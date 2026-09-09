// Multi-stage audit pipeline for ELION.
// Stage A reachability -> Stage B static homepage -> Stage C bounded internal
// crawl -> Stage D conditional deep render (Scrapling). Produces a verified
// signal result where every important category carries a status of
// found / not_found / could_not_verify, plus evidence and inspection metadata
// (what was actually checked, and what failed).

import { URL } from "url";
import {
  fetchSafe, isSafeUrlResolved, AUDIT_USER_AGENT, MAX_AUDIT_RESPONSE_BYTES,
} from "./fetch-safe";
import { extractPage, normalizeUrl, type ExtractedPage } from "./extract";
import { scanPage, aggregate, resolveUrl, type Evidence, type CategoryResult, type ContactSignals } from "./detect";
import { crawlInternalPages, type CrawledPage } from "./crawl";
import { shouldRenderDeep, looksLikeSpaShell, runDeepAnalysis, type DeepOutcome } from "./deep";
import { PROVIDER_REGISTRY, type ProviderCategory } from "./registry";

export const HOMEPAGE_TIMEOUT_MS = 8000;

export interface PipelineOptions {
  companyWebsite: string; // raw input (may lack scheme)
  /** Skip the deep stage entirely (used by deterministic tests). */
  disableDeep?: boolean;
  /** Force deep stage (used by tests for the render path). */
  forceDeep?: boolean;
  /** Crawl budget override for tests. */
  crawlBudgetMs?: number;
}

export interface InspectionMeta {
  static_home: boolean;
  internal_pages: number;      // successfully inspected
  internal_attempted: number;
  structured_data: boolean;
  rendered_dom: boolean;
  runtime_network: boolean;
  failedSources: Record<string, string>;
  deepAnalysis: {
    attempted: boolean;
    succeeded: boolean;
    reason: string;
    errorCategory?: string;
  };
}

export interface VerifiedSignals {
  hasWebsite: boolean;
  reachable: boolean;
  finalUrl: string;
  httpStatus: number | null;
  title: string;
  metaDescription: string;
  categories: {
    whatsapp: CategoryResult;
    email: CategoryResult;
    phone: CategoryResult;
    social: CategoryResult;
    booking: CategoryResult;
    live_chat: CategoryResult;
    crm: CategoryResult;
    email_marketing: CategoryResult;
    ecommerce: CategoryResult;
  };
  techStack: string[];
  websiteScoreSignals: {
    hasTitle: boolean; hasMetaDescription: boolean; hasViewport: boolean;
    hasSchema: boolean; hasOG: boolean; hasSSL: boolean; hasAnalytics: boolean;
    formCount: number; contactFormCount: number; newsletterFormCount: number;
  };
  inspected: InspectionMeta;
  /** Page-level scans kept for scoring/legacy consumers. */
  homepageSignals: ContactSignals;
  checkedAt: string;
}

function emptyCategory(category: CategoryResult["category"], reason?: string): CategoryResult {
  return aggregate(category, [], { reason });
}

// When NO inspection succeeded, every category must be could_not_verify:
// a failed fetch must never present itself as "nothing found".
function markAllUnverifiable(result: VerifiedSignals, reason: string): void {
  const cats = result.categories as unknown as Record<string, CategoryResult>;
  for (const key of Object.keys(cats)) {
    cats[key] = aggregate(cats[key].category, [], { reason });
  }
}


export async function runAuditPipeline(opts: PipelineOptions): Promise<VerifiedSignals> {
  const checkedAt = new Date().toISOString();
  const result: VerifiedSignals = {
    hasWebsite: false, reachable: false, finalUrl: "", httpStatus: null,
    title: "", metaDescription: "",
    categories: {
      whatsapp: emptyCategory("whatsapp"), email: emptyCategory("email"), phone: emptyCategory("phone"),
      social: emptyCategory("social"), booking: emptyCategory("booking"), live_chat: emptyCategory("live_chat"),
      crm: emptyCategory("crm"), email_marketing: emptyCategory("email_marketing"), ecommerce: emptyCategory("ecommerce"),
    },
    techStack: [],
    websiteScoreSignals: {
      hasTitle: false, hasMetaDescription: false, hasViewport: false, hasSchema: false,
      hasOG: false, hasSSL: false, hasAnalytics: false, formCount: 0, contactFormCount: 0, newsletterFormCount: 0,
    },
    inspected: {
      static_home: false, internal_pages: 0, internal_attempted: 0,
      structured_data: false, rendered_dom: false, runtime_network: false,
      failedSources: {}, deepAnalysis: { attempted: false, succeeded: false, reason: "none" },
    },
    homepageSignals: {
      whatsappLinks: [], whatsappTextOnly: false, emails: [], phones: [], socialProfiles: [],
      bookingPaths: [], chatPaths: [], newsletterForms: [], contactForms: [], providerHits: [],
    },
    checkedAt,
  };

  // ── Normalize input URL ──
  const raw = opts.companyWebsite.trim();
  if (!raw) return result;
  const normalized = raw.startsWith("http") ? raw : `https://${raw}`;

  // ── Stage A + B: reachability + static homepage ──
  let homepage: ExtractedPage | null = null;
  let html = "";
  let staticStatusOk = false;
  let deepNeeded = { yes: false, reason: "none" as import("./deep").DeepReason };

  try {
    if (!(await isSafeUrlResolved(normalized))) {
      result.inspected.failedSources["static_home"] = "blocked_by_ssrf_guard";
      markAllUnverifiable(result, "static_fetch_failed:ssrf_guard");
      return result;
    }
    const res = await fetchSafe(normalized, { "User-Agent": AUDIT_USER_AGENT, Accept: "text/html,application/xhtml+xml" }, HOMEPAGE_TIMEOUT_MS);
    if (!res) {
      result.inspected.failedSources["static_home"] = "fetch_failed";
      markAllUnverifiable(result, "static_fetch_failed:fetch_failed");
      return result;
    }
    result.reachable = true;
    result.hasWebsite = res.ok;
    result.httpStatus = res.status;
    result.finalUrl = res.url || normalized;
    if (!res.ok) {
      result.inspected.failedSources["static_home"] = `http_${res.status}`;
      // Reachable but blocked/unavailable: absence claims would be dishonest.
      markAllUnverifiable(result, `static_fetch_failed:http_${res.status}`);
      return result;
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct && !ct.includes("text/html") && !ct.includes("xhtml")) {
      result.inspected.failedSources["static_home"] = "non_html";
      markAllUnverifiable(result, "static_fetch_failed:non_html");
      return result;
    }
    html = await res.text().catch(() => "");
    if (html.length > MAX_AUDIT_RESPONSE_BYTES) {
      result.inspected.failedSources["static_home"] = "too_large";
      markAllUnverifiable(result, "static_fetch_failed:too_large");
      return result;
    }
    staticStatusOk = true;
    homepage = extractPage(result.finalUrl, html);
    result.inspected.static_home = true;
    result.title = homepage.title;
    const desc = homepage.meta.find((m) => m.name === "description" || m.name === "og:description");
    result.metaDescription = desc ? desc.content : "";
  } catch {
    result.inspected.failedSources["static_home"] = "exception";
    markAllUnverifiable(result, "static_fetch_failed:exception");
    return result;
  }

  // Homepage signals scan
  const homeSignals = scanPage(homepage);
  result.homepageSignals = homeSignals;
  result.inspected.structured_data = homepage.jsonLd.length > 0;

  // ── Stage C: bounded internal crawl (same-site, high-value pages) ──
  let crawled: CrawledPage[] = [];
  try {
    const crawl = await crawlInternalPages(result.finalUrl, html, opts.crawlBudgetMs);
    crawled = crawl.pages;
    result.inspected.internal_attempted = crawl.attempted;
    result.inspected.internal_pages = crawl.pages.filter((p) => p.ok).length;
  } catch {
    result.inspected.failedSources["internal_pages"] = "crawl_exception";
  }
  const crawledSignals = crawled
    .filter((p) => p.ok && p.page)
    .map((p) => scanPage(p.page as ExtractedPage));

  // ── Stage D decision: does the deep path add value? ──
  const allStaticSignals = [homeSignals, ...crawledSignals];
  const unverified = countStronglyVerified(allStaticSignals);
  if (opts.forceDeep) deepNeeded = { yes: true, reason: "categories_unverified" };
  else if (!opts.disableDeep) {
    const decision = shouldRenderDeep({
      htmlLength: html.length,
      staticStatusOk,
      unverifiedCategories: 9 - unverified,
    });
    if (!decision.yes && looksLikeSpaShell(html, homepage.text.length)) {
      deepNeeded = { yes: true, reason: "spa_shell_suspected" };
    } else {
      deepNeeded = decision;
    }
  }

  let deep: DeepOutcome | null = null;
  if (deepNeeded.yes) {
    result.inspected.deepAnalysis = { attempted: true, succeeded: false, reason: deepNeeded.reason };
    deep = await runDeepAnalysis(result.finalUrl);
    result.inspected.deepAnalysis.succeeded = deep.succeeded;
    if (deep.succeeded) {
      result.inspected.rendered_dom = true;
      if (deep.runtimeHosts.length > 0) result.inspected.runtime_network = true;
    } else {
      result.inspected.failedSources["rendered_dom"] = deep.errorCategory || "unknown";
    }
  }

  // ── Aggregate per-category results across all sources ──
  buildCategoryResults(result, allStaticSignals, crawled, deep);
  buildTechAndScoreSignals(result, homepage, deep);

  return result;
}

function countStronglyVerified(signals: ContactSignals[]): number {
  let n = 0;
  if (signals.some((s) => s.whatsappLinks.length > 0)) n++;
  if (signals.some((s) => s.emails.length > 0)) n++;
  if (signals.some((s) => s.phones.length > 0)) n++;
  if (signals.some((s) => s.socialProfiles.length > 0)) n++;
  if (signals.some((s) => s.bookingPaths.length > 0 || s.providerHits.some((h) => h.category === "booking"))) n++;
  if (signals.some((s) => s.providerHits.some((h) => h.category === "live_chat") || s.chatPaths.length > 0)) n++;
  if (signals.some((s) => s.providerHits.some((h) => h.category === "crm"))) n++;
  if (signals.some((s) => s.providerHits.some((h) => h.category === "email_marketing") || s.newsletterForms.length > 0)) n++;
  if (signals.some((s) => s.providerHits.some((h) => h.category === "ecommerce"))) n++;
  return n;
}

type PageScan = ContactSignals;

function collectEvidence(
  category: ProviderCategory | "whatsapp" | "email" | "phone" | "social",
  scans: PageScan[],
  crawled: CrawledPage[]
): Evidence[] {
  const out: Evidence[] = [];
  scans.forEach((sig, i) => {
    const pageUrl = i === 0 ? "homepage" : crawled[i - 1]?.url || "homepage";
    if (category === "whatsapp") {
      for (const w of sig.whatsappLinks) {
        out.push({ category: "whatsapp", provider: null, finding: "WhatsApp deep link", source: "href", page: pageUrl, match: sanitize(w), reliability: "strong" });
      }
    } else if (category === "email") {
      for (const e of sig.emails.slice(0, 3)) {
        out.push({ category: "email", provider: null, finding: "Contact email", source: "href", page: pageUrl, match: e, reliability: "strong" });
      }
    } else if (category === "phone") {
      for (const p of sig.phones.slice(0, 3)) {
        out.push({ category: "phone", provider: null, finding: "Contact phone", source: "href", page: pageUrl, match: p, reliability: "strong" });
      }
    } else if (category === "social") {
      for (const s of sig.socialProfiles) {
        out.push({ category: "social", provider: s.platform, finding: `${s.platform} profile link`, source: "href", page: pageUrl, match: sanitize(s.url), reliability: "strong" });
      }
    } else {
      for (const h of sig.providerHits) {
        if (h.category !== category) continue;
        out.push(...h.evidence);
      }
      if (category === "booking") {
        for (const b of sig.bookingPaths.slice(0, 3)) {
          out.push({ category: "booking", provider: null, finding: "Booking/scheduling call-to-action", source: "text", page: pageUrl, match: sanitize(b), reliability: "weak" });
        }
      }
      if (category === "email_marketing") {
        for (const idx of sig.newsletterForms.slice(0, 2)) {
          out.push({ category: "email_marketing", provider: null, finding: "Newsletter/signup form", source: "form_action", page: pageUrl, match: `form#${idx}`, reliability: "moderate" });
        }
      }
      if (category === "live_chat") {
        for (const c of sig.chatPaths.slice(0, 2)) {
          out.push({ category: "live_chat", provider: null, finding: "Chat invitation present", source: "text", page: pageUrl, match: c, reliability: "weak" });
        }
      }
      if (category === "ecommerce") {
        // commerce category relies on provider hits only (text "shop" is too weak)
      }
    }
  });
  return out;
}

function sanitize(v: string): string {
  try {
    const u = new URL(v);
    // Strip query strings (may contain tokens/ids); keep origin+path.
    return `${u.protocol}//${u.hostname}${u.pathname.slice(0, 120)}`;
  } catch {
    return v.slice(0, 120);
  }
}

function buildCategoryResults(
  result: VerifiedSignals,
  staticSignals: PageScan[],
  crawled: CrawledPage[],
  deep: DeepOutcome | null
): void {
  // The rendered-DOM evidence from the deep stage arrives as hostnames and
  // platform names; convert them into evidence and merge.
  const deepEvidence = (category: ProviderCategory): Evidence[] => {
    if (!deep || !deep.succeeded) return [];
    const ev: Evidence[] = [];
    for (const fp of PROVIDER_REGISTRY) {
      if (fp.category !== category) continue;
      for (const host of deep.runtimeHosts) {
        if (fp.networkHosts.some((h) => host === h || host.endsWith("." + h))) {
          ev.push({ category, provider: fp.provider, finding: "Runtime network request to provider", source: "network", page: "rendered", match: host, reliability: "strong" });
        }
      }
    }
    return ev;
  };

  const couldNotVerifyReason = (resultInspected: VerifiedSignals["inspected"]): string | undefined => {
    // When the deep stage was needed but failed, categories we could not see
    // through any successful source become could_not_verify.
    if (resultInspected.deepAnalysis.attempted && !resultInspected.deepAnalysis.succeeded) {
      return `render_failed:${resultInspected.deepAnalysis.errorCategory || "unknown"}`;
    }
    if (!resultInspected.static_home) return "static_fetch_failed";
    return undefined;
  };

  const reason = couldNotVerifyReason(result.inspected);
  const failedRendering = reason?.startsWith("render_failed") || false;
  // Static inspection succeeded, so negatives are trustworthy even without a
  // render; a failed render is reported honestly, but does not invalidate
  // successfully inspected sources.
  const baseReason = failedRendering ? undefined : reason;

  const build = (
    category: CategoryResult["category"],
    evidence: Evidence[],
    opts: { provider?: string | null; value?: string } = {}
  ): CategoryResult => {
    if (evidence.length > 0) return aggregate(category, evidence, opts);
    return aggregate(category, [], { reason: baseReason });
  };

  // ── WhatsApp ──
  const waEv = collectEvidence("whatsapp", staticSignals, crawled);
  const waValue = pickFirstMatch(waEv);
  result.categories.whatsapp = build("whatsapp", waEv, { value: waValue });

  // ── Email / phone ──
  result.categories.email = build("email", collectEvidence("email", staticSignals, crawled), { value: pickFirstMatch(collectEvidence("email", staticSignals, crawled)) });
  result.categories.phone = build("phone", collectEvidence("phone", staticSignals, crawled), { value: pickFirstMatch(collectEvidence("phone", staticSignals, crawled)) });

  // ── Social ──
  const socialEv = collectEvidence("social", staticSignals, crawled);
  result.categories.social = build("social", socialEv);

  // ── Registry categories ──
  for (const category of ["booking", "live_chat", "crm", "email_marketing", "ecommerce"] as ProviderCategory[]) {
    const ev = [
      ...collectEvidence(category, staticSignals, crawled),
      ...deepEvidence(category),
    ];
    // Provider = the strongest provider hit, else null (path exists, provider unknown)
    const providerHits = ev.filter((e) => e.provider);
    const provider = providerHits.length > 0 ? providerHits[0].provider : null;
    result.categories[category] = build(category, ev, { provider });
  }

  // Text-only WhatsApp (weak): keep it out of strong findings; surface as low
  // confidence when nothing stronger exists.
  if (result.categories.whatsapp.status !== "found") {
    const textOnly = staticSignals.some((s) => s.whatsappTextOnly);
    if (textOnly) {
      result.categories.whatsapp = {
        ...result.categories.whatsapp,
        status: "found",
        confidence: "low",
        evidence: [{ category: "whatsapp", provider: null, finding: "WhatsApp mentioned in page text (no deep link found)", source: "text", page: "homepage", match: "whatsapp", reliability: "weak" }],
      };
    }
  }
}

function pickFirstMatch(ev: Evidence[]): string | undefined {
  return ev.find((e) => e.match)?.match;
}

function buildTechAndScoreSignals(
  result: VerifiedSignals,
  homepage: ExtractedPage,
  deep: DeepOutcome | null
): void {
  const lower = homepage.text.toLowerCase();
  const htmlLower = homepage.htmlLength > 0 ? lower : lower;
  void htmlLower;
  const tech: string[] = [];
  const techMarkers: Array<[string, RegExp]> = [
    ["Next.js", /_next|__next/i], ["React", /react|__react/i],
    ["WordPress", /wp-content|wp-includes|wordpress/i], ["Shopify", /shopify/i],
    ["Wix", /wix(static)?/i], ["Webflow", /webflow/i], ["Vue.js", /vue(\.js|js)/i],
    ["Angular", /ng-version|angular/i], ["Svelte", /svelte/i],
  ];
  for (const [name, re] of techMarkers) {
    if (re.test(lower) || re.test(homepage.jsonLd)) tech.push(name);
  }
  if (deep?.succeeded) {
    for (const t of deep.renderedTech) if (!tech.includes(t)) tech.push(t);
  }
  result.techStack = tech.slice(0, 12);

  result.websiteScoreSignals = {
    hasTitle: Boolean(result.title),
    hasMetaDescription: Boolean(result.metaDescription),
    hasViewport: homepage.meta.some((m) => m.name === "viewport"),
    hasSchema: homepage.jsonLd.length > 0,
    hasOG: homepage.meta.some((m) => m.name.startsWith("og:")),
    hasSSL: result.finalUrl.startsWith("https://"),
    hasAnalytics: homepage.scripts.some((s) => (/google-analytics|googletagmanager|gtag|analytics\.js/i).test(s.src) || (/gtag\(|googletagmanager/i).test(s.inline)),
    formCount: homepage.forms.length,
    contactFormCount: result.homepageSignals.contactForms.length,
    newsletterFormCount: result.homepageSignals.newsletterForms.length,
  };
}

// ── helpers used by route.ts for honest UI language ──

export function categoryUiLine(cat: CategoryResult, label: string): string {
  if (cat.status === "found") {
    return cat.provider
      ? `${label}: ${cat.provider} detected (confidence: ${cat.confidence})`
      : `${label}: found (confidence: ${cat.confidence})`;
  }
  if (cat.status === "could_not_verify") {
    return `${label}: could not be verified — ${cat.reason || "inspection incomplete"}`;
  }
  return `${label}: not found in the pages successfully inspected`;
}

// Re-export for route convenience
export { normalizeUrl, resolveUrl };
