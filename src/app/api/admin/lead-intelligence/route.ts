// Lead intelligence API — Phase 3 of the commercial engine.
//
// GET /api/admin/lead-intelligence?leadId=...
// Assembles ONE payload that lets a salesperson immediately answer:
//   WHO ARE THEY? WHAT DID ELION OBSERVE? WHAT IS UNVERIFIED?
//   WHAT MATTERS? WHAT SHOULD I ASK? WHAT SOLUTION MAY FIT?
//   WHAT SHOULD I DO NEXT?
//
// Truth types stay separated:
//   observed  -> audits + verified categories (pipeline output)
//   reported  -> deep_audits.reported (business claims)
//   modeled   -> deep_audits.modeled  (derived arithmetic w/ assumptions)
//
// Next Best Action is deterministic (rule-based, Phase 4): AI never
// invents business facts. Consent gates every contact suggestion.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { evaluateOpportunities } from "@/lib/commercial/applicability";

const getDataClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((user.email || "").toLowerCase())) return null;
  return user;
}

// ── Deterministic Next Best Action ──

export interface NextBestAction {
  action: string;
  reason: string;
  /** Contact channels permitted under the lead's consent state. */
  allowedChannels: string[];
  blockedChannels: string[];
}

const DAYS = 86_400_000;

export function computeNextBestAction(lead: {
  lead_status: string;
  contact_permission: string;
  updated_at: string;
  industry: string | null;
  hasOpportunities: boolean;
  hasVerifiedEvidence: boolean;
  proposalSentAt?: string | null;
  unpaidInvoices?: number;
}, now = Date.now()): NextBestAction {
  const allowed: string[] = [];
  const blocked: string[] = [];
  const perm = lead.contact_permission;

  // Consent gating FIRST: opt-out/do-not-contact overrides everything.
  if (perm === "opted_out" || perm === "do_not_contact") {
    return {
      action: "No outreach. Contact is opted out or marked do-not-contact.",
      reason: `contact_permission is "${perm}". Respect it on every channel.`,
      allowedChannels: [],
      blockedChannels: ["email", "whatsapp", "phone"],
    };
  }
  if (perm === "unknown") {
    blocked.push("whatsapp");
  } else if (perm === "public_business_contact" || perm === "opted_in_email") {
    blocked.push("whatsapp");
    allowed.push("email");
  } else if (perm === "opted_in_whatsapp") {
    allowed.push("whatsapp", "email");
  }

  // Proposal sent: follow up on the proposal, not on discovery.
  if (lead.proposalSentAt && now - new Date(lead.proposalSentAt).getTime() > 3 * DAYS) {
    return {
      action: "Follow up on the proposal sent " + Math.floor((now - new Date(lead.proposalSentAt).getTime()) / DAYS) + " day(s) ago.",
      reason: "Proposal awaiting response past the 3-day follow-up window.",
      allowedChannels: allowed.includes("whatsapp") ? ["whatsapp", "email"] : allowed,
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

// ── Route handler ──

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leadId = new URL(req.url).searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const sb = getDataClient();

  const { data: lead, error: leadErr } = await sb.from("leads").select("*").eq("id", leadId).single();
  if (leadErr || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data: audits } = await sb.from("audits")
    .select("id, created_at, overall_score, leak_count, critical_leaks, high_leaks, leaks")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestAudit = audits && audits.length > 0 ? audits[0] : null;

  const { data: deepAudits } = await sb.from("deep_audits")
    .select("id, created_at, reported, modeled")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(3)
    .then((r) => (r.error && /deep_audits|relation/.test(r.error.message || "")) ? { data: [] } : r);

  const { data: proposals } = await sb.from("proposals")
    .select("id, sent_at, status, total_setup, total_monthly")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: invoices } = await sb.from("invoices")
    .select("id, status, amount")
    .eq("lead_id", leadId)
    .in("status", ["overdue", "issued", "partially_paid"]);
  const unpaidInvoices = invoices ? invoices.length : 0;

  // Re-run the applicability engine on the latest audit's verified categories.
  let opportunities: ReturnType<typeof evaluateOpportunities> | null = null;
  const verified = (latestAudit && typeof latestAudit === "object" ? (latestAudit as Record<string, unknown>) : null);
  if (verified && typeof verified.leaks === "object") {
    // The stored `audits.leaks` JSON does not carry the full verified-category
    // structure; if the audit row stored `verified` (newer audits do via the
    // pipeline), use it. Older audits get discovery-only guidance.
    const storedVerified = (verified as { verified?: unknown }).verified;
    if (storedVerified && typeof storedVerified === "object") {
      try {
        opportunities = evaluateOpportunities(
          storedVerified as Record<string, never>,
          lead.industry || "General",
          true
        );
      } catch {
        opportunities = null;
      }
    }
  }

  const hasVerifiedEvidence = Boolean(latestAudit);
  const hasOpportunities = Boolean(opportunities && opportunities.opportunities.some((o) => o.state === "strong_opportunity"));
  const sentProposal = proposals && proposals.length > 0 ? proposals.find((p) => p.sent_at) || null : null;

  const nba = computeNextBestAction({
    lead_status: lead.lead_status,
    contact_permission: lead.contact_permission || "unknown",
    updated_at: lead.updated_at,
    industry: lead.industry,
    hasOpportunities,
    hasVerifiedEvidence,
    proposalSentAt: sentProposal ? sentProposal.sent_at : null,
    unpaidInvoices,
  });

  return NextResponse.json({
    lead: {
      id: lead.id,
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      industry: lead.industry,
      lead_status: lead.lead_status,
      contact_permission: lead.contact_permission || "unknown",
      consent_source: lead.consent_source || null,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    },
    observed: {
      auditId: latestAudit ? latestAudit.id : null,
      auditDate: latestAudit ? latestAudit.created_at : null,
      overallScore: latestAudit ? latestAudit.overall_score : null,
      leakCount: latestAudit ? latestAudit.leak_count : null,
      opportunities,
    },
    reported: deepAudits && deepAudits.length > 0 ? deepAudits[0].reported : null,
    modeled: deepAudits && deepAudits.length > 0 ? deepAudits[0].modeled : null,
    proposals: proposals || [],
    unpaidInvoices,
    nextBestAction: nba,
    truthTypeLegend: {
      observed: "Evidence ELION verified from public pages it successfully inspected.",
      reported: "What the business said about itself. Their claim, not verified.",
      modeled: "Arithmetic derived from reported inputs. Scenarios, not forecasts.",
    },
  });
}
