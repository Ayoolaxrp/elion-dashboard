// Admin Deployments + Vendor Costs API (P0 commercial-delivery sprint).
//
// GET  /api/admin/deployments?client_id=...
//   Client's client_automations with deployment-ownership fields, plus the
//   vendor-cost register with derived ELION-paid vs client-paid monthly cost.
//
// POST /api/admin/deployments
//   Update deployment ownership fields on a client_automation, upsert a
//   vendor-cost row, or record actual executions. Never stores secrets.
//
// POST /api/admin/deployments/estimate
//   Deterministic n8n execution estimate (no workflow count guessing).

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { estimateMonthlyExecutions, validateDeploymentReadiness } from "@/lib/commercial/deployments";
import { evaluateVendorCostRegister } from "@/lib/commercial/vendor-costs";

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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const sb = data();

  const { data: automations } = await sb
    .from("client_automations")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  const { data: vendorRows } = await sb
    .from("vendor_costs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  const register = evaluateVendorCostRegister(
    (vendorRows || []).map((r) => ({
      vendor: r.vendor,
      service: r.service,
      purpose: r.purpose || undefined,
      billingOwner: r.billing_owner as "client" | "elion",
      currency: r.currency,
      fixedFee: r.fixed_fee ?? undefined,
      includedAllowance: r.included_allowance || undefined,
      variableBasis: r.variable_basis || undefined,
      expectedMonthlyUsage: r.expected_monthly_usage ?? undefined,
      actualMonthlyUsage: r.actual_monthly_usage ?? undefined,
    }))
  );

  const deployments = (automations || []).map((d) => ({
    ...d,
    readiness: validateDeploymentReadiness({
      billingOwner: d.billing_owner,
      elionAccessState: d.elion_access_state,
      workflowVersion: d.workflow_version,
      lastTestedAt: d.last_tested_at,
      deploymentState: d.status,
    }),
  }));

  return NextResponse.json({ deployments, vendorCosts: vendorRows || [], register });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sb = data();
  const action = String(body.action || "");

  if (action === "estimate") {
    const estimate = estimateMonthlyExecutions({
      scheduledRunsPerDay: Number(body.scheduledRunsPerDay) || 0,
      webhookRunsPerMonth: Number(body.webhookRunsPerMonth) || 0,
      messageRunsPerMonth: Number(body.messageRunsPerMonth) || 0,
      backgroundRunsPerMonth: Number(body.backgroundRunsPerMonth) || 0,
      retryFactor: Number(body.retryFactor) || 1,
    });
    return NextResponse.json(estimate);
  }

  if (action === "update_automation") {
    const automationId = String(body.automation_id || "");
    if (!automationId) return NextResponse.json({ error: "automation_id required" }, { status: 400 });
    const patch: Record<string, unknown> = {};
    for (const k of [
      "deployment_type", "orchestration_provider", "instance_ref", "billing_owner",
      "elion_access_state", "n8n_plan", "estimated_monthly_executions", "actual_monthly_executions",
      "workflow_version", "last_tested_at", "backup_ref", "monitoring_state", "care_state",
      "go_live_at", "offboarded_at",
    ]) {
      if (body[k] !== undefined) patch[k] = body[k];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No deployment fields provided" }, { status: 400 });
    }
    const { data, error } = await sb
      .from("client_automations")
      .update(patch)
      .eq("id", automationId)
      .select("id, status, workflow_version, billing_owner, elion_access_state, last_tested_at")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    return NextResponse.json({ automation: data });
  }

  if (action === "upsert_vendor") {
    const clientId = String(body.client_id || "");
    const vendor = String(body.vendor || "").trim();
    const service = String(body.service || "").trim();
    if (!clientId || !vendor || !service) {
      return NextResponse.json({ error: "client_id, vendor and service are required" }, { status: 400 });
    }
    const row = {
      client_id: clientId,
      vendor,
      service,
      purpose: body.purpose || null,
      billing_owner: body.billing_owner === "elion" ? "elion" : "client",
      currency: body.currency || "NGN",
      fixed_fee: body.fixed_fee != null ? Math.round(Number(body.fixed_fee)) : null,
      included_allowance: body.included_allowance || null,
      variable_basis: body.variable_basis || null,
      expected_monthly_usage: body.expected_monthly_usage != null ? Number(body.expected_monthly_usage) : null,
      actual_monthly_usage: body.actual_monthly_usage != null ? Number(body.actual_monthly_usage) : null,
      renewal_at: body.renewal_at || null,
      status: body.status || "active",
      notes: body.notes || null,
    };
    let result;
    if (body.vendor_cost_id) {
      const { data, error } = await sb
        .from("vendor_costs")
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq("id", String(body.vendor_cost_id))
        .select("id")
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    } else {
      const { data, error } = await sb.from("vendor_costs").insert(row).select("id").maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      result = data;
    }
    return NextResponse.json({ vendorCost: result });
  }

  if (action === "delete_vendor") {
    const id = String(body.vendor_cost_id || "");
    if (!id) return NextResponse.json({ error: "vendor_cost_id required" }, { status: 400 });
    const { error } = await sb.from("vendor_costs").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}