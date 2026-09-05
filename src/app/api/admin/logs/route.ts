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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();

  // Real automation lifecycle logs (provisioning engine) joined to their clients.
  const [prov, act] = await Promise.all([
    supabase
      .from("provisioning_logs")
      .select("id, created_at, client_id, automation_id, template_version, action, status, steps, error_message, initiated_by, duration_ms, clients(company_name), client_automations(custom_name)")
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("activity_log")
      .select("id, created_at, lead_id, event_type, event_data, performed_by, leads(company_name, contact_name, email)")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  if (prov.error || act.error) {
    return NextResponse.json({ error: prov.error?.message || act.error?.message || "Failed to load logs" }, { status: 500 });
  }

  const logs = [
    ...(prov.data || []).map((p: any) => ({
      id: `prov_${p.id}`,
      type: "provision" as const,
      created_at: p.created_at,
      client: p.clients?.company_name || p.client_id || "-",
      automation: p.client_automations?.custom_name || null,
      action: p.action,
      status: p.status,
      error_message: p.error_message || null,
      details: `${p.action} ${p.template_version ? `v${p.template_version}` : ""}${p.initiated_by ? ` by ${p.initiated_by}` : ""}`.trim(),
      duration_ms: p.duration_ms,
      steps: Array.isArray(p.steps) ? p.steps : [],
    })),
    ...(act.data || []).map((a: any) => ({
      id: `act_${a.id}`,
      type: "activity" as const,
      created_at: a.created_at,
      client: a.leads?.company_name || a.leads?.contact_name || a.lead_id || "-",
      automation: null,
      action: a.event_type,
      status: "success",
      error_message: null,
      details: a.event_data ? JSON.stringify(a.event_data).slice(0, 200) : "",
      duration_ms: null,
      steps: [],
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 100);

  return NextResponse.json({ logs });
}