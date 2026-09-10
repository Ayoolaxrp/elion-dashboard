// Quote-economics enforcement — the single gate every proposal acceptance
// must pass. Extracted as a pure module so it is testable without the HTTP
// layer and so no other endpoint can silently bypass the margin guardrails.
//
// Rules:
//  - a proposal with NO computable margin can never be accepted (unless a
//    logged founder override with a real reason is provided);
//  - a proposal BELOW the guardrails can only be accepted with a logged
//    founder override;
//  - an override without a substantive reason is rejected.

export interface MarginEnforcementInput {
  /** checkQuoteMargin result, or null when cost inputs are missing. */
  marginCheck: { passes: boolean; warnings: string[]; recommendation: string } | null;
  /** Whether the proposal carries the cost inputs needed to compute margin. */
  costInputsPresent: boolean;
  overrideReason?: string;
}

export type MarginEnforcement =
  | { allowed: true; marginStatus: "within_guardrails" | "founder_override" }
  | { allowed: false; error: string };

export function enforceProposalAcceptance(input: MarginEnforcementInput): MarginEnforcement {
  // No margin at all: the quote is economically blind. Never accept blindly.
  if (!input.marginCheck) {
    if (!input.costInputsPresent) {
      return {
        allowed: false,
        error:
          "Quote economics required before acceptance: provide tier, estimated delivery hours and cost inputs (or a logged founder override with a substantive reason).",
      };
    }
    return { allowed: false, error: "Margin could not be computed — fix the proposal before accepting." };
  }

  if (input.marginCheck.passes) {
    return { allowed: true, marginStatus: "within_guardrails" };
  }

  // Below guardrails: founder override with a substantive reason is the only way.
  const reason = (input.overrideReason || "").trim();
  if (reason.length >= 5) {
    return { allowed: true, marginStatus: "founder_override" };
  }

  return {
    allowed: false,
    error:
      "Below margin guardrails. " +
      (input.marginCheck.warnings.join(" ") || "Direct cost exceeds the target margin.") +
      " " +
      input.marginCheck.recommendation,
  };
}