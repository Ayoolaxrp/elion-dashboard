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
import { computeNextBestAction } from "@/lib/commercial/next-best-action";
import { normalizePermissions } from "@/lib/commercial/consent";

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
// (implemented in src/lib/commercial/next-best-action.ts)

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
    .select("id, created_at, overall_score, leak_count, critical_leaks, high_leaks, leaks, verified")
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

  const { data: permissions } = await sb.from("lead_contact_permissions")
    .select("channel, status, consent_source, updated_at, metadata")
    .eq("lead_id", leadId);

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

  // Re-run the applicability engine on the latest audit's verified categories
  // (persisted since migration 029). Older audits have no payload and get
  // discovery-only guidance instead of fabricated gaps.
  let opportunities: ReturnType<typeof evaluateOpportunities> | null = null;
  const storedVerified =
    latestAudit && typeof latestAudit === "object"
      ? (latestAudit as { verified?: unknown }).verified
      : null;
  if (storedVerified && typeof storedVerified === "object" && !Array.isArray(storedVerified)) {
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

  const hasVerifiedEvidence = Boolean(latestAudit);
  const hasOpportunities = Boolean(opportunities && opportunities.opportunities.some((o) => o.state === "strong_opportunity"));
  const sentProposal = proposals && proposals.length > 0 ? proposals.find((p) => p.sent_at) || null : null;

  const channelPerms = normalizePermissions(permissions as never, lead.contact_permission || "unknown");

  const nba = computeNextBestAction({
    lead_status: lead.lead_status,
    contact_permission: lead.contact_permission || "unknown",
    channels: channelPerms,
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
      contact_permissions: permissions || [],
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
