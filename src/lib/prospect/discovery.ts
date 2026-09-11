import { fetchSafe, isSafeUrl, isSafeUrlResolved, MAX_AUDIT_RESPONSE_BYTES, AUDIT_USER_AGENT } from "../audit/fetch-safe";
import { normalizeProspectWebsite, prospectDeduplicationKey, validateProspectCandidate, type ProspectCandidate } from "./qualification";

export type ProspectPreflightStatus =
  | "PASSED"
  | "INVALID_INPUT"
  | "DNS_FAILURE"
  | "DEAD_DOMAIN"
  | "TLS_FAILURE"
  | "TIMEOUT"
  | "ANTI_BOT"
  | "REDIRECT_ERROR"
  | "NON_HTML"
  | "HTTP_BLOCK"
  | "JS_REQUIRED"
  | "WRONG_BUSINESS"
  | "AUDIT_INTERNAL_ERROR"
  | "OTHER";

export interface DiscoveryCriteria {
  location: string;
  industry: string;
  targetCount: number;
  minimumFit?: string;
}

export interface DiscoveryCandidate extends ProspectCandidate {
  sourceRecordId?: string;
}

export interface ProspectPreflightResult {
  status: ProspectPreflightStatus;
  valid: boolean;
  normalizedWebsite: string | null;
  domain: string | null;
  finalUrl: string | null;
  httpStatus: number | null;
  contentType: string | null;
  title: string | null;
  detail: string;
  identityMatched: boolean | null;
  checkedAt: string;
}

/** Replaceable discovery boundary. Paid providers can implement this later. */
export interface ProspectDiscoveryProvider {
  readonly id: string;
  discover(criteria: DiscoveryCriteria): Promise<DiscoveryCandidate[]>;
}

/** No-cost provider used today: the operator supplies a CSV/manual batch. */
export const MANUAL_DISCOVERY_PROVIDER: ProspectDiscoveryProvider = {
  id: "manual_csv",
  async discover() {
    return [];
  },
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

/** Parse an operator-provided CSV without scraping a protected directory. */
export function parseProspectCsv(csv: string, defaults: Partial<DiscoveryCriteria> = {}): DiscoveryCandidate[] {
  const rows = parseCsvRows(csv.trim());
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeHeader);
  const value = (record: Record<string, string>, ...keys: string[]) => keys.map((key) => record[key]).find(Boolean) || "";

  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => { record[header] = cells[index] || ""; });
    const business = value(record, "business", "business_name", "company", "company_name");
    const website = value(record, "website", "url", "domain");
    const industry = value(record, "industry") || defaults.industry || "";
    const location = value(record, "location", "city") || defaults.location || "";
    const source = value(record, "source") || "manual_csv";
    const sourceUrl = value(record, "source_url", "source_page", "public_url") || "manual import";
    return {
      business,
      website,
      industry,
      location,
      source,
      sourceUrl,
      retrievedAt: new Date().toISOString(),
      sourceRecordId: value(record, "source_record_id", "place_id", "record_id") || undefined,
    };
  }).filter((candidate) => candidate.business || candidate.website);
}

export function classifyPreflightFailure(input: {
  error?: string;
  status?: number;
  contentType?: string | null;
  bodyLength?: number;
}): ProspectPreflightStatus {
  const error = (input.error || "").toLowerCase();
  if (/timeout|abort|timed out|etimedout/.test(error)) return "TIMEOUT";
  if (/certificate|tls|ssl|self signed/.test(error)) return "TLS_FAILURE";
  if (/redirect/.test(error)) return "REDIRECT_ERROR";
  if (/dns|enotfound|name not known|resolve/.test(error)) return "DNS_FAILURE";
  if (input.status === 401 || input.status === 403 || input.status === 429) return "ANTI_BOT";
  if (input.status === 404 || input.status === 410) return "DEAD_DOMAIN";
  if (input.status && input.status >= 400) return "HTTP_BLOCK";
  if (input.contentType && !/text\/html|application\/xhtml\+xml/i.test(input.contentType)) return "NON_HTML";
  if (input.bodyLength !== undefined && input.bodyLength < 100) return "DEAD_DOMAIN";
  return "OTHER";
}

function titleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim().slice(0, 200) || null;
}

function visibleText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function identityMatches(business: string, title: string | null, html: string): boolean {
  const tokens = business.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((token) => token.length >= 4);
  if (tokens.length === 0) return true;
  const haystack = `${title || ""} ${visibleText(html).slice(0, 10000)}`.toLowerCase();
  return tokens.some((token) => haystack.includes(token));
}

/**
 * Verify a candidate before it can enter the audit queue. This deliberately
 * classifies source/network failures separately from an ELION audit failure.
 */
export async function preflightProspect(candidate: DiscoveryCandidate): Promise<ProspectPreflightResult> {
  const checkedAt = new Date().toISOString();
  const validation = validateProspectCandidate(candidate);
  const normalizedWebsite = validation.normalizedWebsite;
  const base = {
    normalizedWebsite,
    domain: validation.domain,
    finalUrl: null,
    httpStatus: null,
    contentType: null,
    title: null,
    checkedAt,
    identityMatched: null,
  };
  if (!validation.valid || !normalizedWebsite) {
    return { ...base, status: "INVALID_INPUT", valid: false, detail: validation.reasons.join("; ") };
  }
  if (!isSafeUrl(normalizedWebsite)) {
    return { ...base, status: "OTHER", valid: false, detail: "Website failed SSRF-safe URL checks." };
  }
  if (!(await isSafeUrlResolved(normalizedWebsite))) {
    return { ...base, status: "DNS_FAILURE", valid: false, detail: "Website hostname did not resolve to a public address." };
  }

  const response = await fetchSafe(normalizedWebsite, { "User-Agent": AUDIT_USER_AGENT, Accept: "text/html,application/xhtml+xml" }, 8000);
  if (!response) {
    return { ...base, status: "TIMEOUT", valid: false, detail: "Website did not return a safe response within the preflight limit." };
  }
  const contentType = response.headers.get("content-type");
  const finalUrl = response.url || normalizedWebsite;
  if (!response.ok) {
    const status = classifyPreflightFailure({ status: response.status, contentType });
    return { ...base, finalUrl, httpStatus: response.status, contentType, status, valid: false, detail: `Website returned HTTP ${response.status}.` };
  }
  if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    return { ...base, finalUrl, httpStatus: response.status, contentType, status: "NON_HTML", valid: false, detail: `Website returned ${contentType}, not HTML.` };
  }

  const reader = response.body?.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  if (reader) {
    while (bytes < MAX_AUDIT_RESPONSE_BYTES) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = next.value;
      bytes += chunk.byteLength;
      chunks.push(chunk);
      if (bytes >= MAX_AUDIT_RESPONSE_BYTES) break;
    }
  } else {
    const buffer = new Uint8Array(await response.arrayBuffer());
    bytes = buffer.byteLength;
    chunks.push(buffer);
  }
  const html = new TextDecoder().decode(concat(chunks, Math.min(bytes, MAX_AUDIT_RESPONSE_BYTES)));
  if (html.length < 100 || !/<html[\s>]/i.test(html)) {
    return { ...base, finalUrl, httpStatus: response.status, contentType, status: "DEAD_DOMAIN", valid: false, detail: "Response was too small or did not contain an HTML document." };
  }
  const title = titleFromHtml(html);
  const identityMatched = identityMatches(candidate.business, title, html);
  if (!identityMatched) {
    return { ...base, finalUrl, httpStatus: response.status, contentType, title, identityMatched, status: "WRONG_BUSINESS", valid: false, detail: "The supplied business name was not found in the page title or visible homepage text." };
  }
  return { ...base, finalUrl, httpStatus: response.status, contentType, title, identityMatched, status: "PASSED", valid: true, detail: "Public HTML homepage, reachability and a basic business-identity signal passed." };
}

function concat(chunks: Uint8Array[], length: number): Uint8Array {
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    if (offset >= length) break;
    const count = Math.min(chunk.byteLength, length - offset);
    output.set(chunk.subarray(0, count), offset);
    offset += count;
  }
  return output;
}

export function deduplicateProspects(candidates: DiscoveryCandidate[]): DiscoveryCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = prospectDeduplicationKey(candidate);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function auditQueueEligible(preflight: ProspectPreflightResult): boolean {
  return preflight.valid && preflight.status === "PASSED";
}

export function normalizeForStorage(candidate: DiscoveryCandidate): DiscoveryCandidate {
  return { ...candidate, website: normalizeProspectWebsite(candidate.website) || candidate.website.trim() };
}
