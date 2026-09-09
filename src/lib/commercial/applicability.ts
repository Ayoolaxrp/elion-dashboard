// ELION Applicability Engine.
//
// Turns verified audit evidence into COMMERCIAL OPPORTUNITIES using:
//   DETECTION + BUSINESS CONTEXT + APPLICABILITY + CONFIDENCE.
//
// Core rules (enforced by tests):
// - Absence of technology is NOT automatically a leak.
// - Unverifiable evidence never becomes a confident recommendation.
// - Industry context can make a category irrelevant even when "missing".
// - The engine can output "no sufficiently strong commercial opportunity
//   was identified from public evidence" and that is a valid result.
// - Every opportunity carries what MUST BE CONFIRMED with the business.

import type { CategoryResult } from "@/lib/audit/detect";
import {
  SOLUTION_CATALOG,
  INDUSTRY_CATEGORY_APPLICABILITY,
  type SolutionSlug,
  type ApplicabilityState,
  type EvidenceCategory,
} from "./solutions";

export interface Opportunity {
  solution: SolutionSlug;
  solutionName: string;
  state: ApplicabilityState;
  confidence: "high" | "medium" | "low";
  /** Evidence summary: what was observed, per category. */
  evidence: Array<{
    category: EvidenceCategory;
    status: string;
    note: string;
  }>;
  /** Potential business consequence (hedged; never measured financial loss). */
  potentialConsequence: string;
  /** Questions that must be asked before proposing. */
  mustConfirm: string[];
  /** Deterministic next best action for the salesperson. */
  nextBestAction: string;
  pricingTier: string;
}

export interface ApplicabilityResult {
  industry: string;
  opportunities: Opportunity[];
  /** True when no strong_opportunity exists. */
  noStrongOpportunity: boolean;
  summaryLine: string;
  /** Industry-context exclusions that were applied (for transparency). */
  appliedExclusions: Array<{ category: EvidenceCategory; reason: string }>;
}

// Weak/missing = verified inspection found nothing (a trustworthy negative).
// Unverifiable = could_not_verify (never counts as missing).
function isVerifiablyWeak(cat: CategoryResult): boolean {
  return cat.status === "not_found";
}

function isStrong(cat: CategoryResult): boolean {
  return cat.status === "found" && (cat.confidence === "high" || cat.confidence === "medium");
}

function isUnverifiable(cat: CategoryResult): boolean {
  return cat.status === "could_not_verify";
}

function industryExclusions(industry: string): Array<{ category: EvidenceCategory; reason: string }> {
  const low = (industry || "").toLowerCase();
  return INDUSTRY_CATEGORY_APPLICABILITY.filter((x) =>
    x.industries.some((i) => low.includes(i))
  ).map((x) => ({ category: x.category, reason: x.reason }));
}

function nextActionFor(slug: SolutionSlug, state: ApplicabilityState, unverifiableCats: string[]): string {
  if (state === "not_applicable") return "Do not pitch this solution; it does not fit this business model.";
  if (state === "insufficient_evidence") {
    return `Request a Deep Audit or ask directly. Public evidence is insufficient for: ${unverifiableCats.join(", ") || "key categories"}.`;
  }
  if (state === "investigate") {
    return slug === "lead_response_capture"
      ? "Call the business. Ask how enquiries from the observed channels are assigned and answered today."
      : "Call the business. Ask how this workflow is handled today before proposing anything.";
  }
  if (state === "strong_opportunity") {
    return `Call the business. Lead with the observed evidence, ask the discovery questions, then propose the ${SOLUTION_CATALOG.find((s) => s.slug === slug)?.name}.`;
  }
  return "No action.";
}

export function evaluateOpportunities(
  categories: Record<string, CategoryResult>,
  industry: string,
  websiteReachable: boolean
): ApplicabilityResult {
  const exclusions = industryExclusions(industry);
  const excludedCats = new Set(exclusions.map((e) => e.category));
  const opportunities: Opportunity[] = [];

  // Site unreachable: nothing commercially meaningful can be claimed.
  if (!websiteReachable) {
    return {
      industry,
      opportunities: [],
      noStrongOpportunity: true,
      summaryLine:
        "No sufficiently strong commercial opportunity was identified: the website could not be inspected. Any diagnosis would be guesswork.",
      appliedExclusions: exclusions,
    };
  }

  const cats = categories as Record<EvidenceCategory, CategoryResult>;

  for (const solution of SOLUTION_CATALOG) {
    // Custom systems are sold via discovery, not audit evidence.
    if (solution.slug === "custom_business_system") continue;

    const weakCats = solution.relevantWhenWeak.filter((c) => !excludedCats.has(c));
    if (weakCats.length === 0) continue; // all relevant categories excluded by industry

    const verifiablyWeak = weakCats.filter((c) => isVerifiablyWeak(cats[c]));
    const unverifiable = weakCats.filter((c) => isUnverifiable(cats[c]));
    const disqualifiedBy = Object.entries(solution.disqualifyingWhenStrong)
      .filter(([c]) => isStrong(cats[c as EvidenceCategory]))
      .map(([, reason]) => reason);

    // Disqualified: strong evidence for the very thing we would install.
    if (disqualifiedBy.length > 0 && verifiablyWeak.length === 0) {
      opportunities.push({
        solution: solution.slug,
        solutionName: solution.name,
        state: "investigate",
        confidence: "low",
        evidence: weakCats.map((c) => ({
          category: c,
          status: cats[c].status,
          note: isStrong(cats[c]) ? "Present (provider: " + (cats[c].provider || "unidentified") + ")" : cats[c].status.replace("_", " "),
        })),
        potentialConsequence: `${disqualifiedBy[0]} Whether it is used well internally is unknown from public evidence.`,
        mustConfirm: solution.discoveryQuestions,
        nextBestAction: `Do not pitch a replacement. Ask whether the existing ${weakCats.filter((c) => isStrong(cats[c])).join("/") || "tool"} is actively used and followed.`,
        pricingTier: solution.pricingTier,
      });
      continue;
    }

    // Nothing verifiably weak: either everything is present or unverifiable.
    if (verifiablyWeak.length < solution.minVerifiedWeakCount) {
      if (unverifiable.length > 0) {
        opportunities.push({
          solution: solution.slug,
          solutionName: solution.name,
          state: "insufficient_evidence",
          confidence: "low",
          evidence: weakCats.map((c) => ({ category: c, status: cats[c].status, note: isUnverifiable(cats[c]) ? "Could not be verified" : "Present" })),
          potentialConsequence:
            "Unknown: the relevant public signals could not be verified, so no gap is claimed.",
          mustConfirm: solution.discoveryQuestions,
          nextBestAction: nextActionFor(solution.slug, "insufficient_evidence", unverifiable),
          pricingTier: solution.pricingTier,
        });
      }
      continue;
    }

    // There IS verifiable weakness. Determine state and confidence.
    // A disqualifying-strong category (e.g. an automated chat surface already
    // present) caps the state at "investigate": the gap may be real, but a
    // replacement pitch must wait until the existing tool's role is understood.
    const cappedByDisqualifier = disqualifiedBy.length > 0;
    const state: ApplicabilityState = cappedByDisqualifier
      ? "investigate"
      : verifiablyWeak.length >= solution.minVerifiedWeakCount && unverifiable.length === 0
        ? "strong_opportunity"
        : "investigate";
    const confidence: Opportunity["confidence"] =
      state === "strong_opportunity" && verifiablyWeak.length >= 2 ? "high" : state === "strong_opportunity" ? "medium" : "low";

    opportunities.push({
      solution: solution.slug,
      solutionName: solution.name,
      state,
      confidence,
      evidence: weakCats.map((c) => ({
        category: c,
        status: cats[c].status,
        note: isVerifiablyWeak(cats[c])
          ? `Not found in the pages successfully inspected${cats[c].evidence.length ? " (checked: " + cats[c].evidence.map((e) => e.source).join(", ") + ")" : ""}`
          : isUnverifiable(cats[c])
            ? "Could not be verified"
            : isStrong(cats[c])
              ? `Present (provider: ${cats[c].provider || "unidentified"})`
              : "Present",
      })),
      potentialConsequence: cappedByDisqualifier
        ? `${disqualifiedBy[0]} The missing categories above may still matter; confirm how the existing tooling is used before proposing.`
        : solution.businessProblem,
      mustConfirm: solution.discoveryQuestions,
      nextBestAction: cappedByDisqualifier
        ? `Do not pitch a replacement. Ask how the existing ${weakCats.filter((c) => isStrong(cats[c])).join("/") || "tool"} is used, then assess whether the missing categories still need a system.`
        : nextActionFor(solution.slug, state, unverifiable),
      pricingTier: solution.pricingTier,
    });
  }

  // Sort: strong first, then investigate, then insufficient.
  const order: Record<ApplicabilityState, number> = {
    strong_opportunity: 0, investigate: 1, insufficient_evidence: 2, not_applicable: 3, no_recommendation: 4,
  };
  opportunities.sort((a, b) => order[a.state] - order[b.state] || (a.confidence < b.confidence ? 1 : -1));

  const strongCount = opportunities.filter((o) => o.state === "strong_opportunity").length;
  return {
    industry,
    opportunities,
    noStrongOpportunity: strongCount === 0,
    summaryLine:
      strongCount > 0
        ? `${strongCount} evidence-backed opportunit${strongCount === 1 ? "y" : "ies"} identified from public evidence. Internal processes must be confirmed with the business.`
        : "No sufficiently strong commercial opportunity was identified from public evidence. Use discovery questions before proposing anything.",
    appliedExclusions: exclusions,
  };
}
