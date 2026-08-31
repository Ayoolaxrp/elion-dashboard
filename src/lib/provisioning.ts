import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

interface ProvisioningStep {
  step: string;
  status: "passed" | "failed" | "blocked" | "skipped";
  detail?: string;
  missing?: string[];
}

interface ProvisioningResult {
  success: boolean;
  steps: ProvisioningStep[];
  error?: string;
  automation_id?: string;
}

interface TemplateVersion {
  id: string;
  template_id: string;
  version: string;
  n8n_workflow_id: string | null;
  config_schema: Record<string, unknown>;
  default_config: Record<string, unknown>;
  required_credentials: string[];
  validation_rules: Record<string, unknown>;
  status: string;
}

interface ClientConfig {
  business_name: string | null;
  industry: string | null;
  timezone: string;
  currency: string;
  website: string | null;
  whatsapp_number: string | null;
  email_address: string | null;
  calendar_provider: string | null;
  working_hours: Record<string, unknown>;
  response_rules: Record<string, unknown>;
}

async function getLatestTemplateVersion(templateId: string): Promise<TemplateVersion | null> {
  const { data, error } = await getSupabase()
    .from("template_versions")
    .select("*")
    .eq("template_id", templateId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as TemplateVersion;
}

async function getClientConfig(clientId: string): Promise<ClientConfig | null> {
  const { data, error } = await getSupabase().from("client_config").select("*").eq("client_id", clientId).single();
  if (error || !data) return null;
  return data as ClientConfig;
}

async function getClientEntitlements(clientId: string) {
  const { data, error } = await getSupabase()
    .from("client_entitlements")
    .select("*, features!inner(key, name, category)")
    .eq("client_id", clientId)
    .eq("status", "active");
  if (error) return [];
  return data || [];
}

function validateConfig(config: ClientConfig | null, rules: Record<string, unknown>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!config) return { valid: false, missing: ["client_config (no configuration exists)"] };
  const requiredFields = (rules.required_fields as string[]) || [];
  for (const field of requiredFields) {
    const val = config[field as keyof ClientConfig];
    if (!val || (typeof val === "string" && val.trim() === "")) missing.push(field);
  }
  const requiredIntegrations = (rules.required_integrations as string[]) || [];
  for (const integ of requiredIntegrations) {
    if (integ === "whatsapp" && !config.whatsapp_number) missing.push("whatsapp_number");
    if (integ === "email" && !config.email_address) missing.push("email_address");
    if (integ === "calendar" && !config.calendar_provider) missing.push("calendar_connection");
  }
  return { valid: missing.length === 0, missing };
}

async function validateCredentials(clientId: string, requiredCredentials: string[]): Promise<{ valid: boolean; missing: string[] }> {
  if (requiredCredentials.length === 0) return { valid: true, missing: [] };
  const { data: creds } = await getSupabase().from("client_credentials").select("credential_type, status").eq("client_id", clientId);
  const existing = new Map((creds || []).map((c: { credential_type: string; status: string }) => [c.credential_type, c.status]));
  const missing: string[] = [];
  for (const cred of requiredCredentials) {
    const status = existing.get(cred);
    if (!status || status === "not_configured" || status === "expired") missing.push(cred);
  }
  return { valid: missing.length === 0, missing };
}

async function checkExistingAutomation(clientId: string, templateId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from("client_automations")
    .select("id, status")
    .eq("client_id", clientId)
    .eq("template_id", templateId)
    .in("status", ["pending", "configuring", "testing", "live"])
    .limit(1)
    .single();
  return data?.id || null;
}

async function logProvisioning(clientId: string, automationId: string | null, templateId: string, templateVersion: string, action: string, status: string, steps: ProvisioningStep[], error?: string, durationMs?: number) {
  await getSupabase().from("provisioning_logs").insert({
    client_id: clientId, automation_id: automationId, template_id: templateId,
    template_version: templateVersion, action, status, steps,
    error_message: error || null, initiated_by: "admin", duration_ms: durationMs || null,
  });
}

export async function provisionAutomation(clientId: string, templateId: string): Promise<ProvisioningResult> {
  const startTime = Date.now();
  const steps: ProvisioningStep[] = [];

  const { data: client } = await getSupabase().from("clients").select("id, company_name, status").eq("id", clientId).single();
  if (!client) return { success: false, steps, error: "Client not found" };

  const entitlements = await getClientEntitlements(clientId);
  const template = await getSupabase().from("workflow_templates").select("id, name, slug, category").eq("id", templateId).single();
  if (!template.data) {
    steps.push({ step: "template_load", status: "failed", detail: "Template not found" });
    await logProvisioning(clientId, null, templateId, "", "provision", "failed", steps, "Template not found");
    return { success: false, steps, error: "Template not found" };
  }

  const hasEntitlement = entitlements.some((e: Record<string, unknown>) => {
    const feature = e.features as Record<string, unknown>;
    return feature?.category === template.data!.category;
  });
  if (!hasEntitlement) {
    steps.push({ step: "entitlement_check", status: "blocked", detail: "No active entitlement for " + template.data.category });
    await logProvisioning(clientId, null, templateId, "", "provision", "blocked", steps, "No entitlement");
    return { success: false, steps, error: "No active entitlement" };
  }
  steps.push({ step: "entitlement_check", status: "passed" });

  const tv = await getLatestTemplateVersion(templateId);
  if (!tv) {
    steps.push({ step: "template_version", status: "blocked", detail: "No active template version" });
    await logProvisioning(clientId, null, templateId, "", "provision", "blocked", steps, "No active template version");
    return { success: false, steps, error: "No active template version" };
  }
  steps.push({ step: "template_version", status: "passed", detail: "v" + tv.version });

  const existing = await checkExistingAutomation(clientId, templateId);
  if (existing) {
    steps.push({ step: "idempotency_check", status: "skipped", detail: "Automation " + existing + " already exists" });
    await logProvisioning(clientId, existing, templateId, tv.version, "provision", "skipped", steps, "Already provisioned");
    return { success: true, steps, automation_id: existing };
  }
  steps.push({ step: "idempotency_check", status: "passed" });

  const config = await getClientConfig(clientId);
  const configValidation = validateConfig(config, tv.validation_rules as Record<string, unknown>);
  if (!configValidation.valid) {
    steps.push({ step: "config_validation", status: "blocked", detail: "Configuration incomplete", missing: configValidation.missing });
    const { data: automation } = await getSupabase().from("client_automations").insert({ client_id: clientId, template_id: templateId, custom_name: template.data!.name, custom_config: config || {}, status: "pending" }).select("id").single();
    await logProvisioning(clientId, automation?.id || null, templateId, tv.version, "provision", "blocked", steps, "Missing: " + configValidation.missing.join(", "));
    return { success: false, steps, automation_id: automation?.id, error: "Configuration incomplete: " + configValidation.missing.join(", ") };
  }
  steps.push({ step: "config_validation", status: "passed" });

  const credValidation = await validateCredentials(clientId, tv.required_credentials);
  if (!credValidation.valid) {
    steps.push({ step: "credential_check", status: "blocked", detail: "Credentials missing", missing: credValidation.missing });
    const { data: automation } = await getSupabase().from("client_automations").insert({ client_id: clientId, template_id: templateId, custom_name: template.data!.name, custom_config: config || {}, status: "pending" }).select("id").single();
    await logProvisioning(clientId, automation?.id || null, templateId, tv.version, "provision", "blocked", steps, "Missing credentials: " + credValidation.missing.join(", "));
    return { success: false, steps, automation_id: automation?.id, error: "Credentials missing: " + credValidation.missing.join(", ") };
  }
  steps.push({ step: "credential_check", status: "passed" });

  const mergedConfig = { ...tv.default_config, ...(config?.response_rules || {}), business_name: config?.business_name, timezone: config?.timezone, whatsapp_number: config?.whatsapp_number, email_address: config?.email_address };
  const { data: automation, error: autoErr } = await getSupabase().from("client_automations").insert({ client_id: clientId, template_id: templateId, custom_name: template.data!.name, custom_config: mergedConfig, status: "configuring" }).select("id").single();
  if (autoErr || !automation) {
    steps.push({ step: "create_automation", status: "failed", detail: autoErr?.message || "Failed" });
    await logProvisioning(clientId, null, templateId, tv.version, "provision", "failed", steps, autoErr?.message);
    return { success: false, steps, error: autoErr?.message || "Failed" };
  }
  steps.push({ step: "create_automation", status: "passed", detail: automation.id });

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl && tv.n8n_workflow_id) {
    try {
      const resp = await fetch(n8nUrl + "/elion/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: clientId, automation_id: automation.id, template_id: templateId, template_version: tv.version, n8n_workflow_id: tv.n8n_workflow_id, config: mergedConfig }), signal: AbortSignal.timeout(30000) });
      steps.push({ step: "n8n_workflow", status: resp.ok ? "passed" : "failed", detail: resp.ok ? "Provisioned" : "HTTP " + resp.status });
    } catch { steps.push({ step: "n8n_workflow", status: "skipped", detail: "n8n not available" }); }
  } else {
    steps.push({ step: "n8n_workflow", status: "skipped", detail: "n8n not configured" });
  }

  const allPassed = steps.every(s => s.status === "passed" || s.status === "skipped");
  const newStatus = allPassed ? "live" : "configuring";
  await getSupabase().from("client_automations").update({ status: newStatus, ...(newStatus === "live" ? { deployed_at: new Date().toISOString() } : {}) }).eq("id", automation.id);
  steps.push({ step: "activation", status: allPassed ? "passed" : "blocked", detail: newStatus });

  const duration = Date.now() - startTime;
  await logProvisioning(clientId, automation.id, templateId, tv.version, "provision", allPassed ? "passed" : "blocked", steps, undefined, duration);

  if (allPassed) {
    await getSupabase().from("clients").update({ onboarding_status: "building" }).eq("id", clientId).eq("onboarding_status", "pending");
  }

  return { success: allPassed, steps, automation_id: automation.id, ...(!allPassed ? { error: "Provisioning blocked" } : {}) };
}

export async function provisionAllClientAutomations(clientId: string): Promise<ProvisioningResult[]> {
  const entitlements = await getClientEntitlements(clientId);
  const results: ProvisioningResult[] = [];
  const templateMap = new Map<string, string>();
  const { data: templates } = await getSupabase().from("workflow_templates").select("id, category").eq("is_active", true);
  if (templates) for (const t of templates) templateMap.set(t.category, t.id);
  for (const ent of entitlements) {
    const feature = ent.features as Record<string, unknown>;
    const category = feature?.category as string;
    const templateId = templateMap.get(category);
    if (templateId) results.push(await provisionAutomation(clientId, templateId));
  }
  return results;
}

export async function deactivateAutomation(automationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  const { data: auto } = await getSupabase().from("client_automations").select("id, client_id, template_id").eq("id", automationId).single();
  if (!auto) return { success: false, error: "Not found" };
  await getSupabase().from("client_automations").update({ status: "paused", paused_at: new Date().toISOString() }).eq("id", automationId);
  await getSupabase().from("provisioning_logs").insert({ client_id: auto.client_id, automation_id: automationId, template_id: auto.template_id, action: "deactivate", status: "passed", steps: [{ step: "deactivation", status: "passed", detail: reason || "Manual" }], initiated_by: "admin" });
  return { success: true };
}

export async function reactivateAutomation(automationId: string): Promise<{ success: boolean; error?: string }> {
  const { data: auto } = await getSupabase().from("client_automations").select("id, client_id, template_id").eq("id", automationId).single();
  if (!auto) return { success: false, error: "Not found" };
  await getSupabase().from("client_automations").update({ status: "live", paused_at: null }).eq("id", automationId);
  await getSupabase().from("provisioning_logs").insert({ client_id: auto.client_id, automation_id: automationId, template_id: auto.template_id, action: "activate", status: "passed", steps: [{ step: "reactivation", status: "passed" }], initiated_by: "admin" });
  return { success: true };
}
