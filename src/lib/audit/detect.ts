// Detection + confidence model for the ELION audit pipeline.
// Matches structured evidence against the provider registry using conservative
// rules: strong sources identify providers, text never does. Weak evidence is
// retained as category-level "path exists, provider unknown" findings.

import { URL } from "url";
import {
  PROVIDER_REGISTRY,
  TEXT_CATEGORY_PATTERNS,
  NEWSLETTER_TEXT,
  type ProviderCategory,
  type SignalSource,
} from "./registry";
import type { ExtractedPage } from "./extract";
import { parseStructuredData } from "./extract";

export interface Evidence {
  category: ProviderCategory | "whatsapp" | "email" | "phone" | "social" | "contact";
  provider: string | null;   // null = category-level finding, provider unknown
  finding: string;
  source: SignalSource | "structured_data" | "form_action";
  page: string;              // URL of the page that produced the evidence
  match: string;             // matched value (URL/host/property), sanitized
  reliability: "strong" | "moderate" | "weak";
}

export interface CategoryResult {
  category: ProviderCategory | "whatsapp" | "email" | "phone" | "social";
  // found | not_found | could_not_verify
  status: "found" | "not_found" | "could_not_verify";
  provider: string | null;
  confidence: "high" | "medium" | "low";
  value?: string;
  evidence: Evidence[];
  reason?: string; // why could_not_verify (render_failed, crawl_blocked, ...)
}

// ── contact / channel extraction primitives ──

export interface ContactSignals {
  whatsappLinks: string[];   // wa.me / api.whatsapp.com deep links
  whatsappTextOnly: boolean; // word "whatsapp" present but no deep link
  emails: string[];          // from mailto: and structured data
  phones: string[];          // from tel: and structured data
  socialProfiles: Array<{ platform: string; url: string }>;
  bookingPaths: string[];    // hrefs/texts indicating a booking flow
  chatPaths: string[];
  newsletterForms: string[]; // form indices classified as signup
  contactForms: string[];
  providerHits: Array<{ category: ProviderCategory; provider: string; evidence: Evidence[]; confidence: "high" | "medium" }>;
}

const SOCIAL_EXCLUDE = /\/(sharer|share|intent\/tweet|sharing|share-offsite|dialog\/share|pin\/create|login|oauth|signup|signin)|(\?|^|\/)u\/?1?(\/|$)/i;
const SOCIAL_HOSTS: Array<{ platform: string; host: RegExp; profile: RegExp }> = [
  { platform: "Instagram", host: /(?:^|\.)instagram\.com$/i, profile: /instagram\.com\/[A-Za-z0-9_.]+/i },
  { platform: "Facebook", host: /(?:^|\.)(?:facebook|fb)\.com$/i, profile: /(?:facebook|fb)\.com\/(?!sharer|share|dialog|login|tr\b)[A-Za-z0-9._\-/]+/i },
  { platform: "Twitter/X", host: /(?:^|\.)(?:twitter|x)\.com$/i, profile: /(?:twitter|x)\.com\/(?!intent|share|home|hashtag|i\/)[A-Za-z0-9_]+/i },
  { platform: "LinkedIn", host: /(?:^|\.)linkedin\.com$/i, profile: /linkedin\.com\/(?:company|in)\/[A-Za-z0-9\-_%]+/i },
  { platform: "YouTube", host: /(?:^|\.)youtube\.com$/i, profile: /youtube\.com\/(?:c\/|channel\/|user\/|@)[A-Za-z0-9_@.\-/]+/i },
  { platform: "TikTok", host: /(?:^|\.)tiktok\.com$/i, profile: /tiktok\.com\/@[A-Za-z0-9_.]+/i },
  { platform: "Pinterest", host: /(?:^|\.)pinterest\.(?:com|[a-z.]+)$/i, profile: /pinterest\.[a-z.]+\/[A-Za-z0-9_]+\/?$/i },
  { platform: "GitHub", host: /(?:^|\.)github\.com$/i, profile: /github\.com\/[A-Za-z0-9\-_.]+\/?$/i },
];

function hostOf(u: string): string {
  try { return new URL(u).hostname.toLowerCase(); } catch { return ""; }
}

function classifySocial(url: string): { platform: string; url: string } | null {
  const host = hostOf(url);
  if (!host) return null;
  for (const s of SOCIAL_HOSTS) {
    if (s.host.test(host)) {
      // Share/intent/OAuth links are NOT evidence of a company profile.
      if (SOCIAL_EXCLUDE.test(url)) return null;
      if (!s.profile.test(url)) return null;
      return { platform: s.platform, url };
    }
  }
  return null;
}

const WHATSAPP_RE = /(?:https?:\/\/)?(?:api\.)?wa\.me\/\+?\d{6,15}|(?:https?:\/\/)?api\.whatsapp\.com\/send\?(?:\S*)?phone=\+?\d{6,15}|whatsapp:\/\/send\?(?:\S*)?phone=\+?\d{6,15}/i;

// Two variants: a /g regex for matchAll iteration, and a stateless one for
// .test() (a /g regex carries lastIndex across .test() calls, which produces
// alternating false negatives).
const EMAIL_RE = /[a-z0-9](?:[a-z0-9._%+-]{0,61}[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]{0,61}[a-z0-9])?\.[a-z]{2,12}/gi;
const EMAIL_TEST = /^[a-z0-9](?:[a-z0-9._%+-]{0,61}[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]{0,61}[a-z0-9])?\.[a-z]{2,12}$/i;

const BAD_EMAIL_DOMAINS = /(sentry|example\.com|wixpress|@2x|\.png|\.jpe?g|\.gif|\.webp|\.svg|\.ico)/i;

// Generic text that indicates a booking path exists (never identifies provider)
const BOOKING_TEXT = TEXT_CATEGORY_PATTERNS.booking;

export function scanPage(page: ExtractedPage): ContactSignals {
  const sig: ContactSignals = {
    whatsappLinks: [], whatsappTextOnly: false, emails: [], phones: [],
    socialProfiles: [], bookingPaths: [], chatPaths: [], newsletterForms: [],
    contactForms: [], providerHits: [],
  };
  const lowerText = page.text.toLowerCase();
  const pageUrl = page.url;

  // ── WhatsApp: deep links from anchors (direct actionable evidence) ──
  for (const a of page.anchors) {
    const m = a.href.match(WHATSAPP_RE);
    if (m) {
      sig.whatsappLinks.push(m[0]);
      continue;
    }
    // Social profile detection from anchors
    const social = classifySocial(a.href);
    if (social && !sig.socialProfiles.some((p) => p.platform === social.platform)) {
      sig.socialProfiles.push(social);
    }
    // Booking provider hrefs (host match is strong evidence)
    const hrefHost = hostOf(a.href);
    if (hrefHost) {
      for (const fp of PROVIDER_REGISTRY) {
        if (fp.hrefHosts.some((h) => hrefHost === h || hrefHost.endsWith("." + h))) {
          sig.providerHits.push({
            category: fp.category, provider: fp.provider, confidence: "high",
            evidence: [{ category: fp.category, provider: fp.provider, finding: `Link to ${fp.provider}`, source: "href", page: pageUrl, match: a.href.slice(0, 200), reliability: "strong" }],
          });
        }
      }
    }
    // Booking path CTA text on any link
    if (BOOKING_TEXT.some((re) => re.test(a.text)) && a.text.length < 80) {
      const resolved = resolveUrl(a.href, pageUrl);
      if (resolved) sig.bookingPaths.push(resolved);
    }
  }

  // mailto: and tel: from anchors (strong evidence)
  for (const a of page.anchors) {
    if (/^mailto:/i.test(a.href)) {
      const e = decodeURIComponent(a.href.replace(/^mailto:/i, "").split("?")[0]).trim();
      if (e && EMAIL_TEST.test(e) && !BAD_EMAIL_DOMAINS.test(e)) sig.emails.push(e.toLowerCase());
    } else if (/^tel:/i.test(a.href)) {
      const digits = a.href.replace(/^tel:/i, "").replace(/[^\d+]/g, "");
      if (digits.replace(/\D/g, "").length >= 7 && digits.replace(/\D/g, "").length <= 15) sig.phones.push(digits);
    }
  }

  // WhatsApp deep links also appear in raw hrefs caught by the anchor regex
  // (some are on <area>/buttons); scan page text for wa.me as a fallback that
  // still requires a deep-link pattern, not just the word.
  const waInText = lowerText.match(WHATSAPP_RE);
  if (waInText && !sig.whatsappLinks.length) sig.whatsappLinks.push(waInText[0]);
  if (/\bwhatsapp\b/i.test(page.text) && !sig.whatsappLinks.length) sig.whatsappTextOnly = true;

  // ── Structured data (JSON-LD): ContactPoint, sameAs, email, telephone ──
  const structured = parseStructuredData(page.jsonLd);
  for (const e of structured.emails) {
    if (EMAIL_TEST.test(e) && !BAD_EMAIL_DOMAINS.test(e) && !sig.emails.includes(e.toLowerCase())) sig.emails.push(e.toLowerCase());
  }
  for (const p of structured.phones) {
    const digits = p.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length >= 7 && !sig.phones.includes(digits)) sig.phones.push(digits);
  }
  for (const s of structured.sameAs) {
    const social = classifySocial(s);
    if (social && !sig.socialProfiles.some((p) => p.platform === social.platform)) {
      sig.socialProfiles.push({ ...social, url: s });
    }
  }

  // Fallback: visible public emails (page text) — moderate value, still real
  if (!sig.emails.length) {
    for (const m of page.text.matchAll(EMAIL_RE)) {
      const e = m[0].toLowerCase();
      if (!BAD_EMAIL_DOMAINS.test(e) && !sig.emails.includes(e)) sig.emails.push(e);
      if (sig.emails.length >= 3) break;
    }
  }
  // Fallback: visible Nigerian-market phone shapes in page text
  if (!sig.phones.length) {
    for (const m of page.text.matchAll(/\+?234[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{3,4}|\b0[789][01]\d[\s.-]?\d{3}[\s.-]?\d{3,4}\b/g)) {
      const digits = m[0].replace(/\D/g, "");
      if (digits.length >= 10 && digits.length <= 14 && !sig.phones.includes(digits)) sig.phones.push(m[0].trim());
      if (sig.phones.length >= 3) break;
    }
  }

  // ── Scripts / iframes / inline JS: provider fingerprints ──
  const scanHosts = (src: string, source: SignalSource) => {
    const host = hostOf(src);
    if (!host) return;
    for (const fp of PROVIDER_REGISTRY) {
      if (fp.networkHosts.some((h) => host === h || host.endsWith("." + h))) {
        sig.providerHits.push({
          category: fp.category, provider: fp.provider, confidence: "high",
          evidence: [{ category: fp.category, provider: fp.provider, finding: `${source === "script" ? "Script" : "Iframe"} from ${host}`, source, page: pageUrl, match: host, reliability: "strong" }],
        });
      }
    }
  };
  for (const s of page.scripts) {
    if (s.src) scanHosts(s.src, "script");
    if (s.inline) {
      const low = s.inline.toLowerCase();
      for (const fp of PROVIDER_REGISTRY) {
        if (fp.htmlPatterns.some((p) => low.includes(p.toLowerCase()))) {
          sig.providerHits.push({
            category: fp.category, provider: fp.provider, confidence: "high",
            evidence: [{ category: fp.category, provider: fp.provider, finding: `Vendor marker in inline script`, source: "script", page: pageUrl, match: fp.provider, reliability: "strong" }],
          });
        }
      }
    }
  }
  for (const f of page.iframes) scanHosts(f.src, "iframe");

  // HTML-level markers in full page text (moderate evidence) — only patterns,
  // never provider display names in visible copy.
  for (const fp of PROVIDER_REGISTRY) {
    if (sig.providerHits.some((h) => h.provider === fp.provider)) continue;
    const hit = fp.htmlPatterns.find((p) => lowerText.includes(p.toLowerCase()));
    if (hit) {
      sig.providerHits.push({
        category: fp.category, provider: fp.provider, confidence: "medium",
        evidence: [{ category: fp.category, provider: fp.provider, finding: `DOM marker for ${fp.provider}`, source: "html", page: pageUrl, match: hit, reliability: "moderate" }],
      });
    }
  }

  // ── Form classification (passive; never submitted) ──
  page.forms.forEach((f, i) => {
    const blob = `${f.action} ${f.fields} ${f.submitText} ${f.context}`.toLowerCase();
    const actionHost = f.action ? hostOf(resolveUrl(f.action, pageUrl) || "") : "";
    // Provider evidence from form action hosts (strong for known SaaS endpoints)
    if (actionHost) {
      for (const fp of PROVIDER_REGISTRY) {
        if (fp.networkHosts.some((h) => actionHost === h || actionHost.endsWith("." + h))) {
          sig.providerHits.push({
            category: fp.category, provider: fp.provider, confidence: "high",
            evidence: [{ category: fp.category, provider: fp.provider, finding: `Form action points to ${fp.provider}`, source: "form", page: pageUrl, match: f.action.slice(0, 200), reliability: "strong" }],
          });
        }
      }
    }
    // Newsletter / signup forms
    const isNewsletter =
      /list-manage\.com|mc\.us\d+\.list-manage|sibforms|ck-page|klaviyo|mailchimp/i.test(f.action) ||
      NEWSLETTER_TEXT.test(f.fields) || NEWSLETTER_TEXT.test(f.submitText) ||
      (/\bemail\b/.test(f.fields) && /subscri|newsletter|updates/i.test(`${f.submitText} ${f.fields}`));
    if (isNewsletter) sig.newsletterForms.push(String(i));
    // Contact / enquiry forms
    const isContact =
      /contact|enquir|inquir|message|get in touch|send us|talk to/i.test(`${f.fields} ${f.submitText}`) ||
      (/\b(name|email)\b/.test(f.fields) && /\b(message|enquir|inquir|question|send)\b/.test(blob));
    if (isContact && !isNewsletter) sig.contactForms.push(String(i));
  });

  // Chat path text (category-level only)
  if (/\b(chat\s+(with\s+us|now|to\s+us)|live\s+chat|talk\s+to\s+(us|an\s+expert)|message\s+us)\b/i.test(page.text)) {
    sig.chatPaths.push("chat invitation text present");
  }

  return sig;
}

export function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

// ── confidence aggregation across pages ──

// Confidence: strong evidence => high; several independent moderate sources =>
// medium; weak only => low (category-level). Repeated evidence from the same
// source/page never upgrades confidence.
export function aggregate(
  category: ProviderCategory | "whatsapp" | "email" | "phone" | "social",
  evidence: Evidence[],
  opts: { provider?: string | null; value?: string; reason?: string } = {}
): CategoryResult {
  const strong = evidence.some((e) => e.reliability === "strong");
  const moderateSources = new Set(evidence.filter((e) => e.reliability === "moderate").map((e) => `${e.source}:${e.page}`));
  let confidence: "high" | "medium" | "low" = "low";
  if (strong) confidence = "high";
  else if (moderateSources.size >= 2) confidence = "medium";
  else if (moderateSources.size === 1) confidence = "low";
  return {
    category,
    status: evidence.length > 0 ? "found" : (opts.reason ? "could_not_verify" : "not_found"),
    provider: opts.provider ?? null,
    confidence: evidence.length > 0 ? confidence : "low",
    value: opts.value,
    evidence: evidence.slice(0, 12),
    reason: opts.reason,
  };
}
