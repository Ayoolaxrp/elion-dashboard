/**
 * Admin Provisioning API
 *
 * POST /api/admin/provision
 * { client_id, template_slug? } -> provisions one automation (or all of
 * the client's entitled automations when template_slug is omitted) using
 * the real engine (src/lib/provisioning.ts). Idempotent: running twice
 * never creates duplicate instances. Statuses stay honest N/A nothing is
 * marked live unless config + credentials + (n8n when required) pass.
 *
 * GET /api/admin/provision?client_id=...
 * Readiness view: for every automation instance of the client, report
 * template / configuration / credentials / integration / provisioning /
 * tests status plus a derived overall state and the missing requirement.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { provisionAutomation, provisionAllClientAutomations, deactivateAutomation, reactivateAutomation } from "@/lib/provisioning";
import { TEMPLATE_FEATURE_KEYS, resolvePlan } from "@/lib/plan-entitlements";

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

export async function POST(request: NextRequest) {
 const admin = await requireAdmin();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await request.json().catch(() => ({}));
 const { client_id, template_slug, automation_id, action } = body as {
   client_id?: string;
   template_slug?: string;
   automation_id?: string;
   action?: "provision" | "pause" | "activate";
 };
 if (!client_id && !automation_id) return NextResponse.json({ error: "client_id or automation_id is required" }, { status: 400 });

 // Pause / activate operate on an existing automation instance.
 if (action === "pause" || action === "activate") {
   if (!automation_id) return NextResponse.json({ error: "automation_id is required for pause/activate" }, { status: 400 });
   const out =
     action === "pause"
       ? await deactivateAutomation(automation_id)
       : await reactivateAutomation(automation_id);
   if (!out.success) return NextResponse.json(out, { status: 404 });
   return NextResponse.json({ automation_id, action, ...out });
 }

 if (!client_id) return NextResponse.json({ error: "client_id is required" }, { status: 400 });

 const supabase = data();
 const { data: client } = await supabase.from("clients").select("id, company_name").eq("id", client_id).single();
 if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

 if (template_slug) {
 const { data: tpl } = await supabase.from("workflow_templates").select("id").eq("slug", template_slug).maybeSingle();
 if (!tpl) return NextResponse.json({ error: `Template '${template_slug}' not found` }, { status: 404 });
 const result = await provisionAutomation(client_id, tpl.id);
 return NextResponse.json({ client_id, template_slug, ...result });
 }

 const results = await provisionAllClientAutomations(client_id);
 return NextResponse.json({ client_id, results });
}

export async function GET(request: NextRequest) {
 const admin = await requireAdmin();
 if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const clientId = request.nextUrl.searchParams.get("client_id");
 const supabase = data();

 let automations;
 if (clientId) {
 const { data } = await supabase
 .from("client_automations")
 .select("id, custom_name, status, created_at, deployed_at, last_run_at, total_runs, custom_config, template_id, workflow_templates!inner(id, name, slug, category, required_integrations)")
 .eq("client_id", clientId)
 .order("created_at", { ascending: true });
 automations = data || [];
 } else {
 const { data } = await supabase
 .from("client_automations")
 .select("id, client_id, custom_name, status, created_at, deployed_at, last_run_at, total_runs, custom_config, template_id, workflow_templates!inner(id, name, slug, category, required_integrations), clients!inner(id, company_name, plan_name)")
 .order("created_at", { ascending: false })
 .limit(200);
 automations = data || [];
 }

 interface ReadinessAutomation {
   id: string;
   client_id: string | null;
   custom_name: string | null;
   status: string;
   created_at: string | null;
   deployed_at: string | null;
   last_run_at: string | null;
   total_runs: number | null;
   custom_config: unknown;
   template_id: string;
   workflow_templates?: {
     id: string; name: string; slug: string; category: string | null;
     required_integrations?: string[]; required_credentials?: string[];
   } | Array<{
     id: string; name: string; slug: string; category: string | null;
     required_integrations?: string[]; required_credentials?: string[];
   }> | null;
   clients?: { id: string; company_name: string | null } | null;
 }
 const clientIds: string[] = Array.from(new Set((automations as ReadinessAutomation[]).map((a) => a.client_id).filter((x): x is string => Boolean(x))));
 const [configsRes, credsRes, integsRes, plansRes] = await Promise.all([
 supabase.from("client_config").select("client_id, business_name, industry, timezone, whatsapp_number, email_address, calendar_provider").in("client_id", clientIds.length ? clientIds : ["__none__"]),
 supabase.from("client_credentials").select("client_id, credential_type, status").in("client_id", clientIds.length ? clientIds : ["__none__"]),
 supabase.from("integration_credentials").select("client_id, integration_type, status").in("client_id", clientIds.length ? clientIds : ["__none__"]),
 supabase.from("clients").select("id, plan_name").in("id", clientIds.length ? clientIds : ["__none__"]),
 ]);
 const configByClient = new Map((configsRes.data || []).map((c) => [c.client_id, c]));
 const credsByClient = new Map<string, Record<string, string>>();
 for (const c of credsRes.data || []) {
 if (!credsByClient.has(c.client_id)) credsByClient.set(c.client_id, {});
 credsByClient.get(c.client_id)![c.credential_type] = c.status;
 }
 const integsByClient = new Map<string, Record<string, string>>();
 for (const c of integsRes.data || []) {
 if (!integsByClient.has(c.client_id)) integsByClient.set(c.client_id, {});
 integsByClient.get(c.client_id)![c.integration_type] = c.status;
 }
 const planByClient = new Map((plansRes.data || []).map((c) => [c.id, c.plan_name || ""]));

 const CONFIG_FIELDS = ["business_name", "industry", "timezone"] as const;
 const rows: Record<string, unknown>[] = (automations as ReadinessAutomation[]).map((a) => {
 const tpl = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
 const slug = tpl?.slug || "";
 const cfg = (configByClient.get(a.client_id) || {}) as Record<string, unknown>;  const creds = credsByClient.get(a.client_id || "") || {};
  const integs = integsByClient.get(a.client_id || "") || {};
 const missingConfig = CONFIG_FIELDS.filter((f) => !cfg[f]);
 const requiredCreds = (tpl?.required_credentials || []) as string[];
 const missingCreds = requiredCreds.filter((c) => !["configured", "verified"].includes(creds[c] || ""));
 const requiredIntegs = (Array.isArray(tpl?.required_integrations) ? tpl.required_integrations : []) as string[];
 const missingIntegs = requiredIntegs.filter((t) => !["connected", "active"].includes(integs[t] || ""));
 const granting = TEMPLATE_FEATURE_KEYS[slug] || [];
 const planName = planByClient.get(a.client_id) || "";
 const planEntitlement = resolvePlan(planName);
 const entitled = planEntitlement
 ? planEntitlement.template_slugs.includes(slug)
 : granting.length === 0;

 let derived = a.status;
 let missing: string[] = [];
 if (a.status === "pending" || a.status === "configuring") {
 derived = missingCreds.length
 ? "needs_credentials"
 : missingIntegs.length
 ? "needs_integration"
 : missingConfig.length
 ? "needs_configuration"
 : a.status === "configuring"
 ? "ready_to_activate"
 : "needs_configuration";
 missing = [
 ...missingConfig.map((f) => `config:${f}`),
 ...missingCreds.map((c) => `credential:${c}`),
 ...missingIntegs.map((t) => `integration:${t}`),
 ];
 } else if (a.status === "pending_activation") {
 derived = "ready_to_activate";
 }

 return {
 automation_id: a.id,
 automation_name: a.custom_name || tpl?.name || "Automation",
 template_slug: slug,
 template_category: tpl?.category || null,
 client_id: a.client_id,
 client_name: a.clients?.company_name || null,
 plan: planName || null,
 entitled,
 status: a.status,
 derived_state: derived,
 missing_requirements: missing,
 configuration: missingConfig.length ? "incomplete" : "ready",
 credentials: missingCreds.length ? "missing" : "ready",
 integrations: missingIntegs.length ? "not_connected" : "ready",
 provisioning: ["live", "testing", "paused"].includes(a.status) ? a.status : a.status === "failed" ? "failed" : "pending",
 tests: a.status === "testing" ? "not_run" : a.status === "live" ? "passed" : "not_run",
 created_at: a.created_at,
 deployed_at: a.deployed_at,
 last_run_at: a.last_run_at,
 total_runs: a.total_runs || 0,
 };
 });

 const autoIds = rows.map((r) => r.automation_id as string);
 const { data: logs } = await supabase
 .from("provisioning_logs")
 .select("automation_id, action, status, created_at, error_message")
 .in("automation_id", autoIds.length ? autoIds : ["__none__"])
 .order("created_at", { ascending: false });
 const lastByAuto = new Map<string, { automation_id: string; action: string; status: string; created_at: string | null; error_message: string | null }>();
 for (const l of (logs || []) as { automation_id: string; action: string; status: string; created_at: string | null; error_message: string | null }[]) {
 if (!lastByAuto.has(l.automation_id)) lastByAuto.set(l.automation_id, l);
 }
 for (const r of rows) {
 const last = lastByAuto.get(r.automation_id as string);
 r.last_attempt = last ? { action: last.action, status: last.status, at: last.created_at, error: last.error_message } : null;
 }

 return NextResponse.json({ client_id: clientId || null, automations: rows });
}
