// Channel-exact Next Best Action (Phase 4 of the commercial engine).
//
// Deterministic, rule-based, consent-gated. AI never invents business
// facts. Consent is evaluated per proposed channel: an email opt-in does
// NOT authorize WhatsApp, and a WhatsApp opt-out does NOT block a
// separately lawful email channel unless a global do-not-contact applies.

import {
  allowedAndBlocked,
  isGloballyBlocked,
  normalizePermissions,
  type ChannelPermissions,
  type ConsentChannel,
} from "./consent";

export interface NextBestAction {
  action: string;
  reason: string;
  /** Contact channels permitted under the lead's per-channel consent state. */
  allowedChannels: ConsentChannel[];
  blockedChannels: ConsentChannel[];
}

const DAYS = 86_400_000;

export function computeNextBestAction(lead: {
  lead_status: string;
  contact_permission?: string | null;
  /** Per-channel permissions; source of truth. Falls back to scalar. */
  channels?: ChannelPermissions;
  updated_at: string;
  industry: string | null;
  hasOpportunities: boolean;
  hasVerifiedEvidence: boolean;
  proposalSentAt?: string | null;
  unpaidInvoices?: number;
}, now = Date.now()): NextBestAction {
  const perms: ChannelPermissions =
    lead.channels && Object.keys(lead.channels).length
      ? lead.channels
      : normalizePermissions(null, lead.contact_permission);
  const { allowedChannels: allowed, blockedChannels: blocked } = allowedAndBlocked(perms);

  // Global do-not-contact overrides everything, including lawful opt-ins.
  if (isGloballyBlocked(perms)) {
    return {
      action: "No outreach on any channel. Contact is marked do-not-contact.",
      reason: "A channel carries do_not_contact. Respect it globally.",
      allowedChannels: [],
      blockedChannels: blocked,
    };
  }

  // Proposal sent: follow up on the proposal, not on discovery.
  if (lead.proposalSentAt && now - new Date(lead.proposalSentAt).getTime() > 3 * DAYS) {
    return {
      action: "Follow up on the proposal sent " + Math.floor((now - new Date(lead.proposalSentAt).getTime()) / DAYS) + " day(s) ago.",
      reason: "Proposal awaiting response past the 3-day follow-up window.",
      allowedChannels: allowed,
      blockedChannels: blocked,
    };
  }

  // No verified evidence: request Deep Audit before pitching.
  if (!lead.hasVerifiedEvidence) {
    return {
      action: "Run or request a Deep Audit. Public evidence is insufficient to diagnose anything.",
      reason: "No successfully inspected audit categories for this lead.",
      allowedChannels: allowed,
      blockedChannels: blocked,
    };
  }

  // Evidence exists but nothing strong: discovery call, not a pitch.
  if (!lead.hasOpportunities) {
    return {
      action: "Call the business for discovery. No strong evidence-backed opportunity yet; do not pitch.",
      reason: "Audit completed but the applicability engine found no strong opportunity from public evidence.",
      allowedChannels: allowed,
      blockedChannels: blocked,
    };
  }

  // Opportunities exist: discovery on the specific evidence.
  const statusActions: Record<string, string> = {
    new: "Call the business. Lead with the observed evidence and ask the solution's discovery questions.",
    audited: "Call the business. Lead with the observed evidence and ask the solution's discovery questions.",
    contacted: "Continue the conversation; confirm the internal process behind the observed evidence.",
    qualified: "Prepare a scoped proposal from the confirmed problems; keep modeled figures labeled as scenarios.",
    proposal: "Follow up on the proposal within 3 days of sending.",
    payment_pending: "Send payment reminder; do not provision infrastructure before kickoff payment clears.",
    paid: "Start onboarding and provisioning immediately.",
    implementation: "Deliver against the implementation plan; log progress for the client.",
    completed: "Review outcomes and request a case study / referral conversation.",
    lost: "Archive. Log the loss reason honestly for the productization review.",
  };
  return {
    action: statusActions[lead.lead_status] || "Review the lead manually.",
    reason: "Rule-based action for lead_status=" + lead.lead_status + ".",
    allowedChannels: allowed,
    blockedChannels: blocked,
  };
}