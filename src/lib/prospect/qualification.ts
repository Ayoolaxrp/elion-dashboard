export type ProspectQualification =
  | "discovered"
  | "validated"
  | "audited"
  | "investigate"
  | "qualified"
  | "reviewed"
  | "approved_for_outreach"
  | "rejected";

export interface ProspectCandidate {
  business: string;
  website: string;
  industry?: string;
  location?: string;
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
}

export interface ProspectValidation {
  valid: boolean;
  normalizedWebsite: string | null;
  domain: string | null;
  reasons: string[];
}

const PRIVATE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export function normalizeProspectWebsite(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    url.username = "";
    url.password = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return null;
  }
}

export function validateProspectCandidate(candidate: ProspectCandidate): ProspectValidation {
  const reasons: string[] = [];
  const normalizedWebsite = normalizeProspectWebsite(candidate.website);
  let domain: string | null = null;

  if (!candidate.business.trim()) reasons.push("business name is required");
  if (!normalizedWebsite) {
    reasons.push("a valid http(s) website is required");
  } else {
    domain = new URL(normalizedWebsite).hostname.toLowerCase();
    if (PRIVATE_HOSTS.has(domain) || domain.endsWith(".local") || domain.endsWith(".internal")) {
      reasons.push("private or local hosts are not eligible");
    }
  }
  if (!candidate.source?.trim()) reasons.push("discovery source is required");
  if (!candidate.sourceUrl?.trim()) reasons.push("public source URL is required");
  if (!candidate.retrievedAt) reasons.push("retrieved_at is required");

  return { valid: reasons.length === 0, normalizedWebsite, domain, reasons };
}

export function prospectDeduplicationKey(candidate: ProspectCandidate): string {
  const normalized = normalizeProspectWebsite(candidate.website);
  if (normalized) return `domain:${new URL(normalized).hostname.toLowerCase()}`;
  return `business:${candidate.business.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export function canEnterSalesQueue(input: {
  validation: ProspectValidation;
  auditCompleted: boolean;
  evidenceCount: number;
  confidence: number;
  opportunity: "strong" | "investigate" | "insufficient_evidence" | "none";
  contactPermission: string;
}): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!input.validation.valid) reasons.push(...input.validation.reasons);
  if (!input.auditCompleted) reasons.push("audit must be completed before sales review");
  if (input.evidenceCount < 1) reasons.push("at least one evidence item is required");
  if (input.confidence < 0.5) reasons.push("confidence is below the review threshold");
  if (input.opportunity === "none" || input.opportunity === "insufficient_evidence") reasons.push("no actionable evidence-backed opportunity");
  if (["opted_out", "do_not_contact"].includes(input.contactPermission)) reasons.push("contact permission blocks outreach");
  return { allowed: reasons.length === 0, reasons };
}
