// Bounded high-value internal-page crawler for the ELION audit.
// Homepage + up to MAX_CRAWL_PAGES same-site pages chosen by crawl priority.
// Every discovered URL passes the same SSRF checks as the homepage; external
// URLs are recorded as evidence only and never fetched recursively.

import { URL } from "url";
import { fetchSafe, isSafeUrlResolved, AUDIT_USER_AGENT } from "./fetch-safe";
import { extractPage, isCrawlable, crawlPriority, normalizeUrl, type ExtractedPage } from "./extract";

export const MAX_CRAWL_PAGES = 5;
export const CRAWL_CONCURRENCY = 2;
export const PAGE_FETCH_TIMEOUT_MS = 8000;
export const CRAWL_TOTAL_BUDGET_MS = 30000;

export interface CrawledPage {
  url: string;
  ok: boolean;
  page?: ExtractedPage;
  error?: string;
}

interface CrawlCandidate {
  url: string;
  priority: number;
}

/** Discover same-site crawl candidates from homepage anchors. */
export function discoverCandidates(homepageUrl: string, html: string): CrawlCandidate[] {
  const base = new URL(homepageUrl);
  const baseHost = base.hostname.replace(/^www\./, "");
  const seen = new Set<string>([normalizeUrl(homepageUrl) || homepageUrl]);
  const candidates: CrawlCandidate[] = [];

  for (const m of html.slice(0, 1024 * 1024).matchAll(/<a\s+[^>]*href\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const raw = (m[2] ?? m[3] ?? "").trim();
    if (!raw || raw.startsWith("#") || /^javascript:/i.test(raw) || /^mailto:/i.test(raw) || /^tel:/i.test(raw)) continue;
    let resolved: URL;
    try {
      resolved = new URL(raw, base);
    } catch {
      continue;
    }
    if (resolved.hostname.replace(/^www\./, "") !== baseHost) continue; // external = evidence only, never crawled
    const norm = normalizeUrl(resolved.toString());
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    if (!isCrawlable(norm, homepageUrl)) continue;
    const priority = crawlPriority(norm, raw);
    if (priority <= 0) continue;
    candidates.push({ url: norm, priority });
  }

  // Shallow, high-priority pages first; stable tie-break by URL.
  candidates.sort((a, b) => b.priority - a.priority || a.url.localeCompare(b.url));
  return candidates.slice(0, MAX_CRAWL_PAGES);
}

/** Fetch candidates with bounded concurrency and a total time budget. */
export async function crawlInternalPages(
  homepageUrl: string,
  html: string,
  budgetMs: number = CRAWL_TOTAL_BUDGET_MS
): Promise<{ pages: CrawledPage[]; attempted: number; elapsedMs: number }> {
  const started = Date.now();
  const candidates = discoverCandidates(homepageUrl, html);
  const pages: CrawledPage[] = [];
  const queue = [...candidates];

  async function worker(): Promise<void> {
    while (queue.length && Date.now() - started < budgetMs) {
      const next = queue.shift();
      if (!next) break;
      // SSRF: crawler-discovered URLs are re-validated (string + DNS) before fetch.
      if (!(await isSafeUrlResolved(next.url))) {
        pages.push({ url: next.url, ok: false, error: "blocked_by_ssrf_guard" });
        continue;
      }
      const res = await fetchSafe(next.url, { "User-Agent": AUDIT_USER_AGENT, Accept: "text/html,application/xhtml+xml" }, PAGE_FETCH_TIMEOUT_MS);
      if (!res || !res.ok) {
        pages.push({ url: next.url, ok: false, error: res ? `http_${res.status}` : "fetch_failed" });
        continue;
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct && !ct.includes("text/html") && !ct.includes("xhtml")) {
        pages.push({ url: next.url, ok: false, error: "non_html" });
        continue;
      }
      const body = await res.text().catch(() => "");
      if (body.length > 2 * 1024 * 1024) {
        pages.push({ url: next.url, ok: false, error: "too_large" });
        continue;
      }
      pages.push({ url: next.url, ok: true, page: extractPage(next.url, body) });
    }
  }

  await Promise.all(Array.from({ length: Math.min(CRAWL_CONCURRENCY, Math.max(queue.length, 1)) }, () => worker()));
  return { pages, attempted: candidates.length, elapsedMs: Date.now() - started };
}
