/**
 * Commercial Lifecycle API
 *
 * POST /api/admin/commercial
 * Handles the full commercial-to-operational lifecycle:
 *   Payment Verified -> Entitlement Created -> Onboarding Started -> Provisioning
 *
 * PATCH /api/admin/commercial
 * Advances lifecycle stages: configure, approve, provision, test, activate
 *
 * GET /api/admin/commercial
 * Get full lifecycle state for a client
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Every handler in this route performs privileged operations (creating
// entitlements, advancing provisioning states, reading client lifecycle
// data). Require an authenticated admin session on every method.
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

/**
 * STEP 1: Verify payment and create entitlement + onboarding
 */
async function handlePaymentVerified(body: {
  client_id: string;
  order_id?: string;
  amount: number;
  payment_ref: string;
  purchased_automations: string[]; // e.g. ["lead_response", "follow_up"]
}) {
  const { client_id, order_id, amount, payment_ref, purchased_automations } = body;

  // 1. Verify client exists
  const { data: client } = await supabase
    .from("clients")
    .select("id, contact_name, email, company_name")
    .eq("id", client_id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // 2. Check for idempotency - don't create duplicate entitlements
  const { data: existingEntitlements } = await supabase
    .from("client_automations")
    .select("id, template_id")
    .eq("client_id", client_id);

  const existingTemplateIds = new Set(
    (existingEntitlements || []).map((e) => e.template_id)
  );

  // 3. Map purchased automations to template IDs
  const templateMap: Record<string, string> = {
    lead_response: "tmpl_lead_response_v1",
    follow_up: "tmpl_follow_up_v1",
    booking: "tmpl_booking_v1",
    revenue_recovery: "tmpl_revenue_recovery_v1",
    operations: "tmpl_operations_v1",
  };

  const created: string[] = [];
  const skipped: string[] = [];

  for (const automation of purchased_automations) {
    const templateId = templateMap[automation];
    if (!templateId) {
      skipped.push(automation);
      continue;
    }

    // Idempotency: skip if already exists
    if (existingTemplateIds.has(templateId)) {
      skipped.push(automation);
      continue;
    }

    // Create client automation instance (entitlement)
    const { data: newAutomation, error } = await supabase
      .from("client_automations")
      .insert({
        client_id,
        template_id: templateId,
        custom_name: automation.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        custom_config: {},
        status: "pending",
      })
      .select("id")
      .single();

    if (!error && newAutomation) {
      created.push(templateId);
    }
  }

  // 4. Create onboarding pipeline record (idempotent)
  const { data: existingOnboarding } = await supabase
    .from("onboarding_pipeline")
    .select("id")
    .eq("client_id", client_id)
    .single();

  if (!existingOnboarding) {
    await supabase.from("onboarding_pipeline").insert({
      client_id,
      current_stage: "welcome",
      stages: {
        welcome: { status: "in_progress", started_at: new Date().toISOString() },
        kickoff: { status: "pending" },
        configuration: { status: "pending" },
        build: { status: "pending" },
        testing: { status: "pending" },
        launch: { status: "pending" },
        handover: { status: "pending" },
      },
    });
  }

  // 5. Create payment record (client-level: use the client_id column,
  // never write a client UUID into lead_id which is an FK to leads).
  // Amounts are integer NGN, consistent with the rest of the commercial
  // lifecycle tables. Fail loudly if the payment cannot be recorded.
  const { error: payError } = await supabase.from("payments").insert({
    client_id,
    amount,
    currency: "NGN",
    description: `Payment for ${purchased_automations.join(", ")}`,
    paystack_ref: payment_ref,
    status: "success",
    paid_at: new Date().toISOString(),
    method: "online",
    metadata: {
      client_id,
      order_id,
      purchased_automations,
    },
  });
  if (payError) {
    console.error("Payment record insert failed:", payError);
    return NextResponse.json(
      { error: `Payment verified but payment record could not be saved: ${payError.message}` },
      { status: 500 }
    );
  }

  // 6. Log the event
  await supabase.from("activity_log").insert({
    event_type: "payment_verified",
    event_data: {
      client_id,
      client_name: client.company_name,
      amount,
      payment_ref,
      purchased_automations,
      entitlements_created: created,
      entitlements_skipped: skipped,
    },
    performed_by: "admin",
  });

  // 7. Create notification
  await supabase.from("notifications").insert({
    type: "document_signed",
    client_id,
    title: "Payment verified",
    message: `Payment of N${amount.toLocaleString()} verified for ${client.company_name}. ${created.length} automation(s) created.`,
    metadata: { payment_ref, created },
  });

  return NextResponse.json({
    success: true,
    client: { id: client_id, name: client.company_name },
    payment: { amount, ref: payment_ref },
    entitlements: { created, skipped },
    onboarding: existingOnboarding ? "already exists" : "created",
  });
}

/**
 * STEP 2: Advance lifecycle stage
 */
async function handleAdvance(body: {
  client_id: string;
  action: string;
  template_id?: string;
  config?: Record<string, unknown>;
}) {
  const { client_id, action, template_id, config } = body;

  if (!client_id || !action) {
    return NextResponse.json({ error: "client_id and action required" }, { status: 400 });
  }

  // Get the automation to advance
  let query = supabase
    .from("client_automations")
    .select("*, workflow_templates!inner(name)")
    .eq("client_id", client_id);

  if (template_id) {
    query = query.eq("template_id", template_id);
  }

  const { data: automations } = await query;
  if (!automations || automations.length === 0) {
    return NextResponse.json({ error: "No automations found for client" }, { status: 404 });
  }

  const results: Array<{ template_id: string; name: string; old_status: string; new_status: string }> = [];

  for (const automation of automations) {
    let newStatus = automation.status;
    let valid = true;

    switch (action) {
      case "configure":
        if (automation.status !== "pending") { valid = false; break; }
        newStatus = "configuring";
        break;
      case "config_complete":
        if (automation.status !== "configuring") { valid = false; break; }
        newStatus = "pending_activation";
        break;
      case "provision":
        if (!["pending", "configuring", "pending_activation"].includes(automation.status)) { valid = false; break; }
        newStatus = "pending_activation";
        break;
      case "test":
        if (automation.status !== "pending_activation") { valid = false; break; }
        newStatus = "testing";
        break;
      case "activate":
        if (automation.status !== "testing" && automation.status !== "pending_activation") { valid = false; break; }
        newStatus = "live";
        break;
      case "pause":
        if (automation.status !== "live") { valid = false; break; }
        newStatus = "paused";
        break;
      case "resume":
        if (automation.status !== "paused") { valid = false; break; }
        newStatus = "live";
        break;
      default:
        valid = false;
    }

    if (!valid) {
      results.push({
        template_id: automation.template_id,
        name: ((automation.workflow_templates as unknown as Record<string, unknown>)?.name as string) || "Unknown",
        old_status: automation.status,
        new_status: automation.status,
      });
      continue;
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (action === "configure" && config) {
      updateData.custom_config = config;
    }
    if (action === "activate") {
      updateData.deployed_at = new Date().toISOString();
    }

    await supabase
      .from("client_automations")
      .update(updateData)
      .eq("id", automation.id);

    // Log the transition
    await supabase.from("provisioning_logs").insert({
      client_id,
      automation_id: automation.id,
      template_id: automation.template_id,
      action: action as "provision" | "activate" | "pause" | "test" | "retry",
      status: "passed",
      steps: [{ action, from: automation.status, to: newStatus, time: new Date().toISOString() }],
    });

    results.push({
      template_id: automation.template_id,
      name: ((automation.workflow_templates as unknown as Record<string, unknown>)?.name as string) || "Unknown",
      old_status: automation.status,
      new_status: newStatus,
    });
  }

  // Update onboarding stage based on automation statuses
  const allStatuses = results.map((r) => r.new_status);
  let onboardingStage = "welcome";
  if (allStatuses.every((s) => s === "live")) onboardingStage = "launch";
  else if (allStatuses.some((s) => s === "testing")) onboardingStage = "testing";
  else if (allStatuses.some((s) => s === "pending_activation")) onboardingStage = "build";
  else if (allStatuses.some((s) => s === "configuring")) onboardingStage = "configuration";

  await supabase
    .from("onboarding_pipeline")
    .update({ current_stage: onboardingStage })
    .eq("client_id", client_id);

  return NextResponse.json({ success: true, results });
}

/**
 * GET: Get full lifecycle state for a client
 */
async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("client_id");

  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  // Get client
  const { data: client } = await supabase
    .from("clients")
    .select("id, contact_name, email, company_name, onboarding_status, status")
    .eq("id", clientId)
    .single();

  // Get automations (entitlements)
  const { data: automations } = await supabase
    .from("client_automations")
    .select("id, custom_name, status, custom_config, last_run_at, total_runs, deployed_at, paused_at, template_id, workflow_templates!inner(name, category)")
    .eq("client_id", clientId);

  // Get onboarding
  const { data: onboarding } = await supabase
    .from("onboarding_pipeline")
    .select("*")
    .eq("client_id", clientId)
    .single();

  // Get recent executions
  const { data: executions } = await supabase
    .from("automation_executions")
    .select("id, trigger_type, status, started_at, completed_at, duration_ms, result, error_message")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get integrations
  const { data: integrations } = await supabase
    .from("client_integrations")
    .select("integration_type, status, last_verified_at")
    .eq("client_id", clientId);

  // Get documents
  const { data: documents } = await supabase
    .from("client_documents")
    .select("doc_type, status, sent_at, viewed_at, completed_at")
    .eq("client_id", clientId);

  // Has this client actually paid? (replaces a previously hardcoded true)
  const { count: paymentCount } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .in("status", ["success", "confirmed"]);

  // Determine blockers
  const blockers: string[] = [];
  (automations || []).forEach((a) => {
    if (a.status === "pending" || a.status === "configuring") {
      blockers.push(`${((a.workflow_templates as unknown as Record<string, unknown>)?.name as string) || "Automation"} needs configuration`);
    }
    if (a.status === "pending_activation") {
      blockers.push(`${((a.workflow_templates as unknown as Record<string, unknown>)?.name as string) || "Automation"} needs provisioning`);
    }
    if (a.status === "failed") {
      blockers.push(`${((a.workflow_templates as unknown as Record<string, unknown>)?.name as string) || "Automation"} has failed`);
    }
  });

  return NextResponse.json({
    client,
    automations: automations || [],
    onboarding,
    executions: executions || [],
    integrations: integrations || [],
    documents: documents || [],
    blockers,
    lifecycle: {
      has_payment: (paymentCount || 0) > 0,
      has_entitlements: (automations || []).length > 0,
      has_onboarding: !!onboarding,
      all_configured: (automations || []).every(
        (a) => Object.keys(a.custom_config || {}).length > 0 || a.status === "live"
      ),
      all_provisioned: (automations || []).every(
        (a) => ["live", "testing", "paused"].includes(a.status)
      ),
      all_live: (automations || []).every((a) => a.status === "live"),
    },
  });
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return await handleGet(request);
  } catch (error) {
    console.error("Commercial lifecycle GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();

    if (body.action === "verify_payment") {
      return await handlePaymentVerified(body);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Commercial lifecycle POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    return await handleAdvance(body);
  } catch (error) {
    console.error("Commercial lifecycle PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
