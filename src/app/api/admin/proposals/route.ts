import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Data client: plain service-role client so queries bypass RLS.
const data = () =>
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

const VALID_STATUS = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];

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
        status: "draft",
        source_audit_id: audit.id,
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
      status: "draft",
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

  if (typeof body.status !== "string" || !VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const status = body.status as string;

  // Load the current proposal to reject invalid transitions and return
  // 404 for unknown records.
  const { data: existing, error: gErr } = await supabase
    .from("proposals")
    .select("id, status")
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
  if (status === "sent") patch.sent_at = now;
  else if (status === "accepted") patch.accepted_at = now;
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