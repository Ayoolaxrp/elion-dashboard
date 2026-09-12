import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { checkQuoteMargin, type QuoteCostInput } from "@/lib/commercial/pricing-model";
import { enforceProposalAcceptance, type MarginEnforcementInput } from "@/lib/commercial/margin-enforcement";

// Data client: plain service-role client so queries bypass RLS.
const data = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ── Quote economics ──
// Cost inputs come from the proposal body (the quote UI sends them). When
// present, a margin snapshot is computed and stored so acceptance can be
// gated reproducibly — another endpoint can never bypass the check by
// simply omitting them.
function marginFieldsFrom(body: Record<string, unknown>) {
  const tier = typeof body.tier === "string" ? body.tier : "";
  const hours = Number(body.estimated_delivery_hours);
  const labour = Number(body.labour_rate_per_hour);
  const costInputsPresent =
    Boolean(tier) && Number.isFinite(hours) && hours > 0 && Number.isFinite(labour) && labour > 0;

  let marginCheck: ReturnType<typeof checkQuoteMargin> | null = null;
  if (costInputsPresent) {
    const input: QuoteCostInput = {
      tier: tier as QuoteCostInput["tier"],
      quotedImplementation: Number(body.total_setup) || 0,
      quotedCareMonthly: Number(body.total_monthly) || 0,
      estimatedDeliveryHours: hours,
      labourRatePerHour: labour,
      contractorCost: Number(body.contractor_cost) || 0,
      clientInfrastructureMonthly: Number(body.client_infrastructure_monthly) || 0,
      apiSetupCost: Number(body.api_setup_cost) || 0,
      onboardingCost: Number(body.onboarding_cost) || 0,
      contingencyPercent: Number(body.contingency_percent) || 0,
    };
    marginCheck = checkQuoteMargin(input);
  }

  return {
    tier: tier || null,
    estimated_delivery_hours: costInputsPresent ? hours : null,
    labour_rate_per_hour: costInputsPresent ? labour : null,
    contractor_cost: costInputsPresent ? Number(body.contractor_cost) || 0 : null,
    client_infrastructure_monthly: costInputsPresent ? Number(body.client_infrastructure_monthly) || 0 : null,
    api_setup_cost: costInputsPresent ? Number(body.api_setup_cost) || 0 : null,
    onboarding_cost: costInputsPresent ? Number(body.onboarding_cost) || 0 : null,
    contingency_percent: costInputsPresent ? Number(body.contingency_percent) || 0 : null,
    margin_check: marginCheck ? (marginCheck as unknown as Record<string, unknown>) : null,
    margin_status: marginCheck ? (marginCheck.passes ? "within_guardrails" : "below_guardrails") : "not_checked",
  };
}

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

const VALID_STATUS = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];
const VALID_CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;

function normalizeCurrency(value: unknown) {
  const currency = typeof value === "string" ? value.toUpperCase() : "NGN";
  return VALID_CURRENCIES.includes(currency as (typeof VALID_CURRENCIES)[number]) ? currency : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();
  const { data: rows, error } = await supabase
    .from("proposals")
    .select("*, clients(id, company_name, contact_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposals: rows || [] });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const currency = normalizeCurrency(body.currency);
  if (!currency) return NextResponse.json({ error: "Currency must be NGN, USD, GBP, or EUR" }, { status: 400 });

  const supabase = data();

  // ---------- Create from a completed audit ----------
  // Maps the audit's findings into a real proposal:
  // Problem (top leaks) -> Evidence (verified/supported findings) ->
  // Recommended system -> Implementation scope -> Price (admin-set) -> Next step.
  if (typeof body.audit_id === "string" && body.audit_id) {
    const { data: audit, error: aErr } = await supabase
      .from("audits")
      .select("*, leads(id, contact_name, email, company_name, website, industry)")
      .eq("id", body.audit_id)
      .maybeSingle();
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
    if (!audit || audit.status !== "completed") {
      return NextResponse.json({ error: "Audit not found or not completed" }, { status: 404 });
    }

    const findings: Array<{
      area?: string; severity?: string; description?: string;
      impact?: string; recommendation?: string; evidenceLevel?: string;
    }> = Array.isArray(audit.findings) ? audit.findings : [];
    const serious = findings.filter((f) => f.severity === "critical" || f.severity === "high");
    const shown = serious.length ? serious : findings;
    const lead = Array.isArray(audit.leads) ? audit.leads[0] : audit.leads;

    // One line item per serious finding, plus implementation/management items.
    const items = shown.map((f, i) => ({
      automation_name: `${f.area || "Operational gap"}${f.evidenceLevel === "verified" ? " (verified)" : f.evidenceLevel === "supported" ? " (supported)" : ""}`,
      description: f.recommendation || f.description || "",
      status: i === 0 ? "critical" : f.severity === "critical" ? "critical" : "high",
      setup_price: Number(body.total_setup) && i === 0 ? Number(body.total_setup) : null,
      monthly_price: Number(body.total_monthly) && i === 0 ? Number(body.total_monthly) : null,
    }));
    items.push({
      automation_name: "Implementation, configuration, testing & handover",
      description: "Configure and deploy the recommended systems, connect channels, test the workflow, and hand over documented credentials and ownership.",
      status: "scope",
      setup_price: Number(body.total_setup) || null,
      monthly_price: Number(body.total_monthly) || null,
    });

    const summary =
      typeof body.summary === "string" && body.summary.trim()
        ? body.summary.trim()
        : `${audit.company_name} scored ${audit.overall_score ?? "n/a"}/100 on operational automation with ${audit.critical_leaks ?? 0} critical and ${audit.high_leaks ?? 0} high-priority findings. This proposal covers the systems that address the leaks identified in the audit.`;
    const recommendedSystems = audit.recommendations && typeof audit.recommendations === "object"
      ? [
          ...(Array.isArray(audit.recommendations.needs) ? audit.recommendations.needs : []),
          ...(Array.isArray(audit.recommendations.roles) ? audit.recommendations.roles : []),
        ]
      : [];
    const documentData = {
      ...(body.document_data && typeof body.document_data === "object" && !Array.isArray(body.document_data) ? body.document_data : {}),
      executive_summary: summary,
      business_challenge: shown.map((finding) => finding.description || finding.area).filter(Boolean),
      audit_findings: shown.map((finding) => ({
        finding: finding.area || "Operational gap",
        severity: finding.severity || "not recorded",
        business_impact: finding.impact || "Impact to be confirmed with the client.",
        recommendation: finding.recommendation || "Recommendation to be confirmed during implementation scoping.",
        evidence_level: finding.evidenceLevel || "not recorded",
      })),
      recommended_systems: recommendedSystems,
      implementation_reasoning: shown.map((finding) => finding.recommendation || finding.description || finding.area).filter(Boolean),
      suggested_scope: "Confirm workflow scope, integrations, testing, deployment, documentation and handover against the audit findings.",
    };

    const { data: row, error } = await supabase
      .from("proposals")
      .insert({
        title: typeof body.title === "string" && body.title.trim()
          ? body.title.trim()
          : `Operational Automation Proposal : ${audit.company_name}`,
        company_name: lead?.company_name || (typeof body.company_name === "string" ? body.company_name : null) || audit.company_name,
        client_name: lead?.contact_name || (typeof body.client_name === "string" ? body.client_name : null) || null,
        client_email: lead?.email || (typeof body.client_email === "string" ? body.client_email : null) || null,
        client_id: body.client_id || null,
        lead_id: audit.lead_id || null,
        summary,
        items,
        total_setup: Number(body.total_setup) || 0,
        total_monthly: Number(body.total_monthly) || 0,
        implementation_timeline: typeof body.implementation_timeline === "string" ? body.implementation_timeline : null,
        support_plan: typeof body.support_plan === "string" ? body.support_plan : null,
        valid_until: typeof body.valid_until === "string" ? body.valid_until : null,
        currency,
        document_data: documentData,
        status: "draft",
        source_audit_id: audit.id,
        ...marginFieldsFrom(body),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ proposal: row });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Proposal title is required" }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  const totalSetup = Number(body.total_setup) || 0;
  const totalMonthly = Number(body.total_monthly) || 0;

  const { data: row, error } = await supabase
    .from("proposals")
    .insert({
      title,
      company_name: body.company_name || null,
      client_name: body.client_name || null,
      client_email: body.client_email || null,
      client_id: body.client_id || null,
      lead_id: body.lead_id || null,
      summary: body.summary || null,
      items,
      total_setup: totalSetup,
      total_monthly: totalMonthly,
      implementation_timeline: body.implementation_timeline || null,
      support_plan: body.support_plan || null,
      valid_until: body.valid_until || null,
      currency,
      document_data: body.document_data && typeof body.document_data === "object" ? body.document_data : {},
      status: "draft",
      ...marginFieldsFrom(body),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: row });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Proposal id is required" }, { status: 400 });

  const supabase = data();

  const requestedCurrency = body.currency === undefined ? null : normalizeCurrency(body.currency);
  if (body.currency !== undefined && !requestedCurrency) {
    return NextResponse.json({ error: "Currency must be NGN, USD, GBP, or EUR" }, { status: 400 });
  }

  const contentPatch: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) contentPatch.title = body.title.trim();
  if (typeof body.company_name === "string") contentPatch.company_name = body.company_name.trim() || null;
  if (typeof body.client_name === "string") contentPatch.client_name = body.client_name.trim() || null;
  if (typeof body.client_email === "string") contentPatch.client_email = body.client_email.trim() || null;
  if (typeof body.summary === "string") contentPatch.summary = body.summary.trim() || null;
  if (typeof body.implementation_timeline === "string") contentPatch.implementation_timeline = body.implementation_timeline.trim() || null;
  if (typeof body.support_plan === "string") contentPatch.support_plan = body.support_plan.trim() || null;
  if (typeof body.valid_until === "string") contentPatch.valid_until = body.valid_until || null;
  if (requestedCurrency) contentPatch.currency = requestedCurrency;
  if (body.document_data && typeof body.document_data === "object" && !Array.isArray(body.document_data)) contentPatch.document_data = body.document_data;
  if (body.items && Array.isArray(body.items)) contentPatch.items = body.items;
  if (body.total_setup !== undefined && Number.isFinite(Number(body.total_setup))) contentPatch.total_setup = Number(body.total_setup);
  if (body.total_monthly !== undefined && Number.isFinite(Number(body.total_monthly))) contentPatch.total_monthly = Number(body.total_monthly);

  const economicFields = [
    "tier", "estimated_delivery_hours", "labour_rate_per_hour", "contractor_cost",
    "client_infrastructure_monthly", "api_setup_cost", "onboarding_cost", "contingency_percent",
    "total_setup", "total_monthly",
  ];
  if (economicFields.some((field) => field in body)) {
    const { data: currentQuote, error: quoteError } = await supabase
      .from("proposals")
      .select("tier, estimated_delivery_hours, labour_rate_per_hour, contractor_cost, client_infrastructure_monthly, api_setup_cost, onboarding_cost, contingency_percent, total_setup, total_monthly")
      .eq("id", id)
      .maybeSingle();
    if (quoteError) return NextResponse.json({ error: quoteError.message }, { status: 500 });
    if (!currentQuote) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const mergedQuote = { ...currentQuote, ...body };
    Object.assign(contentPatch, marginFieldsFrom(mergedQuote));
  }

  if (Object.keys(contentPatch).length > 0) {
    const { data: updated, error: updateError } = await supabase.from("proposals").update(contentPatch).eq("id", id).select().single();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    return NextResponse.json({ proposal: updated });
  }

  if (typeof body.status !== "string" || !VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const status = body.status as string;

  // Load the current proposal to reject invalid transitions and return
  // 404 for unknown records.
  const { data: existing, error: gErr } = await supabase
    .from("proposals")
    .select("id, status, tier, estimated_delivery_hours, labour_rate_per_hour, contractor_cost, client_infrastructure_monthly, api_setup_cost, onboarding_cost, contingency_percent, total_setup, total_monthly, margin_check, margin_status")
    .eq("id", id)
    .maybeSingle();
  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  const current = existing.status as string;
  const ALLOWED: Record<string, string[]> = {
    draft: ["sent"],
    sent: ["viewed", "accepted", "rejected", "draft", "expired"],
    viewed: ["accepted", "rejected", "draft", "expired"],
    accepted: ["draft"],
    rejected: ["draft"],
    expired: [],
  };
  if (!(ALLOWED[current] || []).includes(status)) {
    return NextResponse.json(
      { error: `Invalid transition: cannot move proposal from ${current} to ${status}` },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = { status };
  const now = new Date().toISOString();

  // ── Margin gate on ACCEPTANCE (P0): a below-guardrail or economically
  // blind quote cannot be accepted without a logged founder override.
  if (status === "accepted") {
    const costInputsPresent =
      Boolean(existing.tier) && Number(existing.estimated_delivery_hours) > 0 && Number(existing.labour_rate_per_hour) > 0;
    let marginCheck = existing.margin_check as { passes?: boolean; warnings?: string[]; recommendation?: string } | null;
    if (!marginCheck && costInputsPresent) {
      try {
        marginCheck = checkQuoteMargin({
          tier: existing.tier as QuoteCostInput["tier"],
          quotedImplementation: Number(existing.total_setup) || 0,
          quotedCareMonthly: Number(existing.total_monthly) || 0,
          estimatedDeliveryHours: Number(existing.estimated_delivery_hours) || 0,
          labourRatePerHour: Number(existing.labour_rate_per_hour) || 0,
          contractorCost: Number(existing.contractor_cost) || 0,
          clientInfrastructureMonthly: Number(existing.client_infrastructure_monthly) || 0,
          apiSetupCost: Number(existing.api_setup_cost) || 0,
          onboardingCost: Number(existing.onboarding_cost) || 0,
          contingencyPercent: Number(existing.contingency_percent) || 0,
        }) as unknown as { passes?: boolean; warnings?: string[]; recommendation?: string };
      } catch {
        marginCheck = null;
      }
    }
    const enforcement = enforceProposalAcceptance({
      marginCheck: marginCheck as MarginEnforcementInput["marginCheck"],
      costInputsPresent,
      overrideReason: typeof body.founder_override_reason === "string" ? body.founder_override_reason : undefined,
    });
    if (!enforcement.allowed) {
      return NextResponse.json({ error: enforcement.error }, { status: 422 });
    }
    patch.margin_status = enforcement.marginStatus;
    patch.accepted_at = now;
    if (enforcement.marginStatus === "founder_override") {
      patch.margin_override = {
        by: admin.email || "unknown admin",
        at: now,
        reason: typeof body.founder_override_reason === "string" ? body.founder_override_reason.trim() : "",
        margin_check: marginCheck,
      };
    }
  } else if (status === "sent") patch.sent_at = now;
  else if (status === "rejected") patch.declined_at = now;
  else if (status === "draft") {
    patch.sent_at = null;
    patch.accepted_at = null;
    patch.declined_at = null;
  }
  const { data: row, error } = await supabase
    .from("proposals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: row });
}