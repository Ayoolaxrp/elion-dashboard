import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// ------------------------------------------------------------------
// Client dashboard overview — everything the client sees is derived
// server-side from real rows, scoped to the signed-in user's client
// organization. Nothing is fabricated: no metric is reported unless a
// real row supports it, and the UI shows "No activity yet" otherwise.
// ------------------------------------------------------------------

const INTEGRATION_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  calendar: "Calendar",
  crm: "CRM",
  ai: "AI provider",
  n8n: "n8n",
  voice: "Voice AI",
};

type ActivityRow = {
  id: number;
  created_at: string;
  event_type: string;
  event_data: Record<string, unknown>;
};

function friendlyEvent(row: ActivityRow): { text: string; tone: "ok" | "warn" | "neutral" } {
  const ed = row.event_data || {};
  const status = String(ed.status || ed.result || "");
  const name = String(ed.lead_name || ed.lead_email || ed.name || ed.customer_name || "");
  const suffix = name ? ` for ${name}` : "";
  switch (row.event_type) {
    case "lead_response_automation":
      if (status === "failed") return { text: `Response failed to send${suffix}`, tone: "warn" };
      return { text: `Lead response sent${suffix}`, tone: "ok" };
    case "lead_received":
      return { text: `New lead received${suffix}`, tone: "neutral" };
    case "follow_up_sent":
      return { text: `Follow-up sent${suffix}`, tone: "ok" };
    case "booking_created":
      return { text: `Booking confirmed${suffix}`, tone: "ok" };
    case "booking_cancelled":
      return { text: `Booking cancelled${suffix}`, tone: "warn" };
    case "revenue_recovery":
    case "recovery_sent":
      return { text: `Recovery message sent${suffix}`, tone: "ok" };
    case "escalation":
    case "escalation_created":
      return { text: `Conversation escalated to your team${suffix}`, tone: "warn" };
    default:
      if (status === "failed") return { text: `${row.event_type.replace(/_/g, " ")} failed`, tone: "warn" };
      return { text: row.event_type.replace(/_/g, " "), tone: "neutral" };
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the signed-in user's client organization (same rule as /api/client/automations)
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");

  let clientId: string | null = null;
  if (memberships && memberships.length > 0) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, client_id")
      .in("id", memberships.map((m: { organization_id: string }) => m.organization_id))
      .eq("org_type", "client")
      .single();
    if (org?.client_id) clientId = org.client_id as string;
  }

  if (!clientId) {
    return NextResponse.json({ client: null, automations: [], integrations: [], activity: [], outcomes: null, needsAttention: [] });
  }

  // Client record
  const { data: client } = await supabase
    .from("clients")
    .select("company_name, contact_name, email, onboarding_status, created_at")
    .eq("id", clientId)
    .single();

  // Automations with their template (incl. the integrations the template requires)
  const { data: automations } = await supabase
    .from("client_automations")
    .select(
      "id, custom_name, status, total_runs, last_run_at, success_rate, deployed_at, paused_at, last_health_check, workflow_templates(name, slug, category, required_integrations)"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  // Integration credentials for this client
  const { data: creds } = await supabase
    .from("integration_credentials")
    .select("integration_type, status, health, last_verified_at, updated_at")
    .eq("client_id", clientId);

  const connectedTypes = new Set(
    (creds || [])
      .filter((c: { status: string }) => c.status === "connected" || c.status === "active")
      .map((c: { integration_type: string }) => c.integration_type)
  );

  // Activity attributable to this client (execution events carry client_id in event_data)
  const { data: activityRows } = await supabase
    .from("activity_log")
    .select("id, created_at, event_type, event_data")
    .contains("event_data", { client_id: clientId })
    .order("created_at", { ascending: false })
    .limit(12);

  // Bookings attributable to this client (real booking rows)
  const { data: bookingRows } = await supabase
    .from("bookings")
    .select("id, status, start_at, customer_name")
    .eq("client_id", clientId);

  // ------------------------------------------------------------------
  // Health per automation
  // ------------------------------------------------------------------
  type Health = { level: "healthy" | "degraded" | "attention" | "paused" | "setup" | "offline"; label: string; reason?: string };
  const healthOf = (a: {
    status: string;
    total_runs: number | null;
    success_rate: number | null;
    workflow_templates?: { required_integrations?: string[] | null } | { required_integrations?: string[] | null }[] | null;
  }): Health => {
    const wt = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
    const required: string[] = Array.isArray(wt?.required_integrations) ? (wt.required_integrations as string[]) : [];
    const missing = required.filter((t) => !connectedTypes.has(t));
    switch (a.status) {
      case "failed":
        return { level: "attention", label: "Needs attention", reason: "A recent run failed. ELION has been notified." };
      case "paused":
        return { level: "paused", label: "Paused", reason: "Paused by ELION. Contact us to resume." };
      case "pending":
      case "configuring":
      case "testing":
        return { level: "setup", label: "Setting up" };
      case "live":
        if (a.total_runs && a.success_rate !== null && a.success_rate < 60) {
          return { level: "degraded", label: "Needs attention", reason: "Recent executions are failing." };
        }
        if (missing.length > 0) {
          return {
            level: "degraded",
            label: "Needs attention",
            reason: `Required connection missing: ${missing.map((t) => INTEGRATION_LABELS[t] || t).join(", ")}.`,
          };
        }
        return { level: "healthy", label: "Healthy" };
      default:
        return { level: "setup", label: "Setting up" };
    }
  };

  const automationsView = (automations || []).map((a: any) => {
    const h = healthOf(a);
    const wt = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
    return {
      id: a.id,
      name: a.custom_name || wt?.name || "Automation",
      status: a.status,
      health: h,
      total_runs: a.total_runs || 0,
      last_run_at: a.last_run_at,
      success_rate: a.success_rate,
      template: wt ? { name: wt.name, slug: wt.slug, category: wt.category } : null,
    };
  });

  // ------------------------------------------------------------------
  // Outcomes — real counts only; hasData=false when nothing exists
  // ------------------------------------------------------------------
  const outcomes: {
    hasData: boolean;
    counts: { key: string; label: string; count: number }[];
    executions: { ok: number; failed: number };
  } = { hasData: false, counts: [], executions: { ok: 0, failed: 0 } };

  if (activityRows && activityRows.length > 0) {
    let leads = 0, responses = 0, followUps = 0, recoveries = 0, ok = 0, failed = 0;
    for (const row of activityRows) {
      const ed = row.event_data || {};
      const status = String(ed.status || ed.result || "");
      if (status === "failed" || row.event_type.includes("failed")) failed++;
      else if (row.event_type.includes("escalation")) { /* attention item, not an outcome */ }
      else ok++;

      if (row.event_type === "lead_response_automation" || row.event_type === "lead_received") {
        if (status === "responded" || status === "received" || status === "sent") responses++;
        leads++;
      } else if (row.event_type.includes("follow_up")) followUps++;
      else if (row.event_type.includes("recovery") || row.event_type.includes("recover")) recoveries++;
    }
    const counts: { key: string; label: string; count: number }[] = [];
    if (leads > 0) counts.push({ key: "leads", label: "Leads handled", count: leads });
    if (responses > 0) counts.push({ key: "responses", label: "Responses sent", count: responses });
    if (followUps > 0) counts.push({ key: "follow_ups", label: "Follow-ups completed", count: followUps });
    if (recoveries > 0) counts.push({ key: "recoveries", label: "Recovered opportunities", count: recoveries });
    outcomes.hasData = counts.length > 0 || ok + failed > 0;
    outcomes.counts = counts;
    outcomes.executions = { ok, failed };
  }

  if (bookingRows && bookingRows.length > 0) {
    const confirmed = bookingRows.filter((b: { status: string }) => ["confirmed", "completed", "rescheduled"].includes(b.status)).length;
    outcomes.hasData = true;
    const existing = outcomes.counts.find((c) => c.key === "bookings");
    if (existing) existing.count = confirmed;
    else if (confirmed > 0) outcomes.counts.push({ key: "bookings", label: "Bookings", count: confirmed });
  }

  // ------------------------------------------------------------------
  // Needs attention — real, actionable items only
  // ------------------------------------------------------------------
  const needsAttention: { kind: string; title: string; message: string; action: string; href: string }[] = [];

  // Required integrations that are missing for a live/deployed system
  const requiredByTemplate = new Set<string>();
  for (const a of automationsView) {
    const wt = (automations || []).find((x: any) => x.id === a.id)?.workflow_templates;
    const tpl = Array.isArray(wt) ? wt[0] : wt;
    if (Array.isArray(tpl?.required_integrations)) {
      for (const t of tpl.required_integrations) requiredByTemplate.add(String(t));
    }
  }
  for (const type of requiredByTemplate) {
    if (connectedTypes.has(type)) continue;
    const label = INTEGRATION_LABELS[type] || type;
    needsAttention.push({
      kind: "integration",
      title: `${label} needs attention`,
      message: `Your ${label} connection is not connected. ${label === "WhatsApp" ? "New enquiries may not receive responses." : "This system may not run as expected."}`,
      action: "Reconnect",
      href: "/dashboard/onboarding",
    });
  }

  for (const a of automationsView) {
    if (a.status === "failed") {
      needsAttention.push({
        kind: "system",
        title: `${a.name} needs attention`,
        message: "ELION couldn't complete a recent run. Our team has been notified and is looking into it.",
        action: "Contact ELION",
        href: "/dashboard/onboarding",
      });
    }
    if (a.status === "paused") {
      needsAttention.push({
        kind: "system",
        title: `${a.name} is paused`,
        message: "Your automation is currently paused. Contact ELION to resume it.",
        action: "Contact ELION",
        href: "/dashboard/onboarding",
      });
    }
  }

  // No live automation yet → the client's next step is onboarding
  if (!automationsView.some((a: { status: string }) => a.status === "live")) {
    needsAttention.push({
      kind: "setup",
      title: "Your systems are being set up",
      message: "ELION is preparing your automation. Complete or review your onboarding so we can launch.",
      action: "View onboarding",
      href: "/dashboard/onboarding",
    });
  }

  // ------------------------------------------------------------------
  // Integrations view (existing creds + required-but-missing types)
  // ------------------------------------------------------------------
  const integrationsView = (creds || []).map((c: { integration_type: string; status: string; health: string | null; last_verified_at: string | null }) => ({
    type: c.integration_type,
    label: INTEGRATION_LABELS[c.integration_type] || c.integration_type,
    status: c.status,
    health: c.health,
    last_verified_at: c.last_verified_at,
  }));
  for (const type of requiredByTemplate) {
    if (!integrationsView.some((i: { type: string }) => i.type === type)) {
      integrationsView.push({ type, label: INTEGRATION_LABELS[type] || type, status: "not_configured", health: null, last_verified_at: null });
    }
  }

  // Activity with friendly copy
  const activity = (activityRows || []).map((row) => {
    const f = friendlyEvent(row);
    return { id: row.id, at: row.created_at, text: f.text, tone: f.tone };
  });

  return NextResponse.json({
    client,
    automations: automationsView,
    integrations: integrationsView,
    activity,
    outcomes,
    needsAttention,
  });
}
