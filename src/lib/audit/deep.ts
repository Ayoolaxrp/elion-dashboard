// Deep/rendered inspection stage (Scrapling via scripts/scrape.py).
// Escalates only when warranted; its outcome is always observable in the
// result (attempted/succeeded/reason/errorCategory) — it must never fail
// silently or block the audit.

import { execFileSync } from "child_process";
import path from "path";

export type DeepReason =
  | "thin_static_content"
  | "spa_shell_suspected"
  | "categories_unverified"
  | "blocked_static_fetch"
  | "none";

export interface DeepOutcome {
  attempted: boolean;
  succeeded: boolean;
  reason: DeepReason;
  errorCategory?: string;
  /** Rendered script/iframe hostnames + runtime request hosts from scrape.py. */
  runtimeHosts: string[];
  renderedTech: string[];
  renderedSocialPlatforms: string[];
  markdownPreview: string;
  pageTitle?: string;
}

export const DEEP_STAGE_TIMEOUT_MS = 20000;
// Static HTML below this size is usually a JS shell, not real content.
export const THIN_CONTENT_BYTES = 40 * 1024;
const SPA_MARKERS = ['id="root"', 'id="app"', 'id="__next"', 'id="__nuxt"', 'data-reactroot', 'ng-app', 'ng-version'];

export function shouldRenderDeep(opts: {
  htmlLength: number;
  staticStatusOk: boolean;
  unverifiedCategories: number;
}): { yes: boolean; reason: DeepReason } {
  const { htmlLength, staticStatusOk, unverifiedCategories } = opts;
  if (!staticStatusOk) return { yes: true, reason: "blocked_static_fetch" };
  if (htmlLength < THIN_CONTENT_BYTES) return { yes: true, reason: "thin_static_content" };
  if (unverifiedCategories >= 3) return { yes: true, reason: "categories_unverified" };
  // SPA shell check happens in the caller (needs HTML content); thin content
  // covers most shells already.
  return { yes: false, reason: "none" };
}

export function looksLikeSpaShell(html: string, textLength: number): boolean {
  const low = html.slice(0, 200 * 1024).toLowerCase();
  const hasMarker = SPA_MARKERS.some((m) => low.includes(m));
  return hasMarker && textLength < 8 * 1024;
}

interface ScrapePyResult {
  status?: string;
  error?: string;
  fetcher_used?: string;
  title?: string;
  tech_stack?: string[];
  social_links?: string[];
  script_srcs?: string[];
  iframe_srcs?: string[];
  network_hosts?: string[];
  markdown_preview?: string;
}

export async function runDeepAnalysis(website: string): Promise<DeepOutcome> {
  const outcome: DeepOutcome = {
    attempted: true, succeeded: false, reason: "none",
    runtimeHosts: [], renderedTech: [], renderedSocialPlatforms: [], markdownPreview: "",
  };
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "scrape.py");
    // execFileSync avoids shell interpolation of the URL argument entirely.
    const stdout = execFileSync("python", [scriptPath, website], {
      timeout: DEEP_STAGE_TIMEOUT_MS,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    });
    // scrape.py prints pure JSON on stdout (logs go to stderr).
    const start = stdout.indexOf("{");
    if (start < 0) throw new Error("no json output");
    const data = JSON.parse(stdout.slice(start)) as ScrapePyResult;
    if (data.status !== "success") {
      outcome.errorCategory = String(data.error || "scrape_error").slice(0, 200);
      return outcome;
    }
    outcome.succeeded = true;
    outcome.pageTitle = data.title;
    outcome.renderedTech = (data.tech_stack || []).map(String).slice(0, 30);
    outcome.renderedSocialPlatforms = (data.social_links || []).map(String).slice(0, 20);
    outcome.markdownPreview = String(data.markdown_preview || "").slice(0, 2000);
    const hosts = new Set<string>();
    for (const s of data.script_srcs || []) {
      try { hosts.add(new URL(String(s)).hostname.toLowerCase()); } catch { /* skip */ }
    }
    for (const s of data.iframe_srcs || []) {
      try { hosts.add(new URL(String(s)).hostname.toLowerCase()); } catch { /* skip */ }
    }
    for (const h of data.network_hosts || []) hosts.add(String(h).toLowerCase().slice(0, 200));
    outcome.runtimeHosts = [...hosts].slice(0, 60);
    return outcome;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Categorize without leaking internals to users.
    if (/timeout|timed out|ETIMEDOUT/i.test(msg)) outcome.errorCategory = "timeout";
    else if (/ENOENT|python/i.test(msg)) outcome.errorCategory = "python_unavailable";
    else if (/no json|parse/i.test(msg)) outcome.errorCategory = "bad_output";
    else outcome.errorCategory = "runtime_error";
    return outcome;
  }
}
