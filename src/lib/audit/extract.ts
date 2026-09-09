// Structured evidence extraction for the ELION audit.
// Given raw HTML, extract the specific element types that carry conversion
// evidence (anchors, forms, iframes, scripts, meta, JSON-LD) instead of
// scanning one big text blob. Detection (registry matching, confidence) is a
// separate step in pipeline.ts.

import { URL } from "url";

export interface ExtractedAnchor {
  href: string;
  text: string;
}

export interface ExtractedForm {
  action: string;
  method: string;
  /** Concatenated input names, types, placeholders and label text (bounded). */
  fields: string;
  submitText: string;
  /** Nearby heading text when one can be cheaply associated (not tracked). */
  context: string;
}

export interface ExtractedIframe {
  src: string;
}

export interface ExtractedScript {
  src: string;
  /** Inline script content (bounded) for high-specificity vendor markers. */
  inline: string;
}

export interface ExtractedMeta {
  name: string;
  content: string;
}

export interface ExtractedPage {
  url: string;
  title: string;
  meta: ExtractedMeta[];
  anchors: ExtractedAnchor[];
  forms: ExtractedForm[];
  iframes: ExtractedScript[];
  scripts: ExtractedScript[];
  /** Concatenated JSON-LD blocks (bounded). */
  jsonLd: string;
  /** All visible-ish text (tags stripped), lowercased, bounded. */
  text: string;
  /** Raw HTML length before any bounds. */
  htmlLength: number;
}

// ── helpers ──

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch { return ""; }
    });
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ");
}

function attr(rawTag: string, name: string): string {
  const m = rawTag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  const v = m ? (m[2] ?? m[3] ?? m[4] ?? "") : "";
  return decodeEntities(v).trim();
}

const BOUND = 64 * 1024; // per-field extraction bound to avoid pathological pages

// ── extraction ──

export function extractPage(url: string, html: string): ExtractedPage {
  const safeHtml = html.slice(0, 2 * BOUND);
  const page: ExtractedPage = {
    url,
    title: "",
    meta: [],
    anchors: [],
    forms: [],
    iframes: [],
    scripts: [],
    jsonLd: "",
    text: "",
    htmlLength: html.length,
  };

  const title = safeHtml.match(/<title[^>]*>([\s\S]{2,300}?)<\/title>/i);
  if (title) page.title = decodeEntities(title[1]).replace(/\s+/g, " ").trim().slice(0, 200);

  // Meta tags
  for (const m of safeHtml.matchAll(/<meta\s+[^>]*>/gi)) {
    const tag = m[0];
    const name = attr(tag, "name") || attr(tag, "property");
    const content = attr(tag, "content");
    if (name && content) {
      page.meta.push({ name: name.toLowerCase(), content: content.slice(0, 500) });
      if (page.meta.length >= 60) break;
    }
  }

  // Anchors — href + visible text (needed to exclude share/intent links and to
  // detect conversion CTAs like "Book a viewing").
  for (const m of safeHtml.matchAll(/<a\s+[^>]*>[\s\S]*?<\/a>/gi)) {
    const tag = m[0];
    const href = attr(tag, "href");
    if (!href || href.startsWith("#") || /^javascript:/i.test(href)) continue;
    const text = stripTags(tag.replace(/^<a\s+[^>]*>/i, "").replace(/<\/a>$/i, "")).trim().slice(0, 120);
    page.anchors.push({ href, text });
    if (page.anchors.length >= 600) break;
  }

  // Forms
  for (const m of safeHtml.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)) {
    const tag = m[0].slice(0, BOUND);
    const inputs: string[] = [];
    for (const im of tag.matchAll(/<(?:input|textarea|select)\b[^>]*>/gi)) {
      const it = im[0];
      const parts = [attr(it, "name"), attr(it, "type"), attr(it, "placeholder")].filter(Boolean);
      if (parts.length) inputs.push(parts.join(":"));
    }
    let submitText = "";
    for (const bm of tag.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>|<input[^>]*type=["']?submit[^>]*>/gi)) {
      const t = bm[1] ? stripTags(bm[1]) : attr(bm[0], "value");
      if (t && t.trim()) { submitText = t.trim().slice(0, 60); break; }
    }
    page.forms.push({
      action: attr(tag, "action") || "",
      method: (attr(tag, "method") || "get").toLowerCase(),
      fields: inputs.join(", ").slice(0, 800),
      submitText,
      context: "",
    });
    if (page.forms.length >= 40) break;
  }

  // Iframes
  for (const m of safeHtml.matchAll(/<iframe\b[^>]*>/gi)) {
    const src = attr(m[0], "src");
    if (src) page.iframes.push({ src: src.slice(0, 500), inline: "" });
    if (page.iframes.length >= 60) break;
  }

  // Scripts — src attributes plus bounded inline content
  for (const m of safeHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || "";
    const src = attr(attrs, "src");
    const inline = (m[2] || "").slice(0, 8000);
    if (src) page.scripts.push({ src: src.slice(0, 500), inline: "" });
    else if (inline && /(?:window\.|var\s|const\s|let\s)/i.test(inline)) {
      page.scripts.push({ src: "", inline });
    }
    if (page.scripts.length >= 150) break;
  }

  // JSON-LD
  const ldBlocks: string[] = [];
  for (const m of safeHtml.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    ldBlocks.push((m[1] || "").slice(0, 16000));
    if (ldBlocks.join("").length >= 64000) break;
  }
  page.jsonLd = ldBlocks.join("\n");

  // Visible text
  page.text = stripTags(safeHtml).slice(0, BOUND);

  return page;
}

// ── JSON-LD structured-data helpers ──

export interface StructuredContact {
  emails: string[];
  phones: string[];
  sameAs: string[];
  types: string[];
  contactPoints: number;
}

function collectStringArrays(node: unknown, key: string, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const n of node) collectStringArrays(n, key, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const v = obj[key];
    if (typeof v === "string") out.add(v);
    else if (Array.isArray(v)) for (const s of v) if (typeof s === "string") out.add(s);
    for (const k of Object.keys(obj)) collectStringArrays(obj[k], key, out);
  }
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const n of node) collectTypes(n, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string") out.add(t);
    else if (Array.isArray(t)) for (const s of t) if (typeof s === "string") out.add(s);
    for (const k of Object.keys(obj)) collectTypes(obj[k], out);
  }
}

// Parse JSON-LD safely; malformed data is skipped, never trusted blindly.
export function parseStructuredData(jsonLd: string): StructuredContact {
  const out: StructuredContact = { emails: [], phones: [], sameAs: [], types: [], contactPoints: 0 };
  if (!jsonLd) return out;
  const emails = new Set<string>();
  const phones = new Set<string>();
  const sameAs = new Set<string>();
  const types = new Set<string>();
  for (const block of jsonLd.split("\n")) {
    try {
      const parsed: unknown = JSON.parse(block.trim());
      collectStringArrays(parsed, "email", emails);
      collectStringArrays(parsed, "telephone", phones);
      collectStringArrays(parsed, "sameAs", sameAs);
      collectTypes(parsed, types);
      // ContactPoint nodes
      const countCp = (node: unknown): number => {
        if (Array.isArray(node)) return node.reduce((a: number, n) => a + countCp(n), 0);
        if (node && typeof node === "object") {
          const obj = node as Record<string, unknown>;
          let n = obj["@type"] === "ContactPoint" ? 1 : 0;
          for (const k of Object.keys(obj)) n += countCp(obj[k]);
          return n;
        }
        return 0;
      };
      out.contactPoints += countCp(parsed);
    } catch {
      // Malformed JSON-LD is ignored (never trusted as evidence).
    }
  }
  out.emails = [...emails].slice(0, 10);
  out.phones = [...phones].slice(0, 10);
  out.sameAs = [...sameAs].slice(0, 20);
  out.types = [...types].slice(0, 20);
  return out;
}

// ── URL helpers ──

/** Normalize a URL for deduplication: strip fragment, trailing slash, lowercase host. */
export function normalizeUrl(u: string): string | null {
  try {
    const url = new URL(u);
    url.hash = "";
    let s = url.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch {
    return null;
  }
}

const SKIP_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|ico|css|js|mjs|json|xml|txt|pdf|zip|gz|tar|rar|7z|mp3|mp4|webm|mov|avi|wmv|flv|woff2?|ttf|eot|otf|dmg|exe|apk)$/i;

const ACTION_URLS = /(logout|log-out|signout|sign-out|delete|remove|wp-admin|wp-login|admin|edit|\/cart\/?(\?|$)|checkout(\?|$)|\?add-to-cart=)/i;

/** Is this candidate URL worth crawling? Same-origin HTML pages only. */
export function isCrawlable(candidateUrl: string, originUrl: string): boolean {
  try {
    const c = new URL(candidateUrl);
    const o = new URL(originUrl);
    if (c.protocol !== "http:" && c.protocol !== "https:") return false;
    // Same registrable site: same hostname (subdomain variation of the same
    // site is allowed only when it keeps the same registrable base; keep it
    // simple and strict: same hostname, since www is normalized by the caller).
    if (c.hostname.replace(/^www\./, "") !== o.hostname.replace(/^www\./, "")) return false;
    if (SKIP_EXTENSIONS.test(c.pathname)) return false;
    if (ACTION_URLS.test(c.pathname) || ACTION_URLS.test(c.search)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Score a same-site link by how likely it is to carry contact/conversion evidence. */
const HIGH_VALUE_PATH = /(contact|contact-us|get-in-touch|about|book|booking|bookings|schedule|scheduling|appointment|appointments|reserve|reservation|consult|consultation|consultations|pricing|services|support|help|enquir|inquir|quote|demo)/i;
const HIGH_VALUE_TEXT = /(contact|get in touch|book|booking|schedule|appointment|reserve|consultation|viewing|enquir|inquir|quote|pricing|demo|talk to|speak to|reach us|call us|whatsapp)/i;

export function crawlPriority(candidateUrl: string, linkText: string): number {
  let score = 0;
  let path = "";
  try { path = new URL(candidateUrl).pathname; } catch { return 0; }
  if (HIGH_VALUE_PATH.test(path)) score += 10;
  if (HIGH_VALUE_TEXT.test(linkText || "")) score += 8;
  // Shallow URLs preferred: penalize depth
  const depth = path.split("/").filter(Boolean).length;
  score -= depth;
  // Homepage itself is handled separately
  if (path === "/" || path === "") score = 0;
  return score;
}
