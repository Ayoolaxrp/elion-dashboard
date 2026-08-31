const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export interface N8nProvisionPayload {
  client_id: string; automation_id: string; template_id: string;
  template_version: string; n8n_workflow_id: string; config: Record<string, unknown>;
}
export interface N8nExecutionPayload {
  client_id: string; automation_id: string; execution_id: string;
  trigger_type: string; trigger_data: Record<string, unknown>;
}

export async function checkN8nHealth(): Promise<{ status: "ok" | "error"; version?: string }> {
  if (!N8N_WEBHOOK_URL) return { status: "error" };
  try {
    const baseUrl = new URL(N8N_WEBHOOK_URL).origin;
    const response = await fetch(baseUrl + "/healthz", { signal: AbortSignal.timeout(5000) });
    if (response.ok) { const data = await response.json().catch(() => ({})); return { status: "ok", version: data.version }; }
    return { status: "error" };
  } catch { return { status: "error" }; }
}

export async function triggerWorkflow(workflowId: string, payload: N8nExecutionPayload): Promise<{ success: boolean; execution_id?: string; error?: string }> {
  if (!N8N_WEBHOOK_URL) return { success: false, error: "n8n not configured" };
  try {
    const response = await fetch(N8N_WEBHOOK_URL + "/elion/trigger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow_id: workflowId, ...payload }), signal: AbortSignal.timeout(30000) });
    if (response.ok) { const data = await response.json().catch(() => ({})); return { success: true, execution_id: data.execution_id }; }
    return { success: false, error: "HTTP " + response.status };
  } catch (err) { return { success: false, error: err instanceof Error ? err.message : "Failed" }; }
}

export function getWorkflowWebhookUrl(workflowId: string, triggerPath: string): string | null {
  if (!N8N_WEBHOOK_URL) return null;
  const base = new URL(N8N_WEBHOOK_URL);
  base.pathname = "/webhook/" + triggerPath;
  return base.toString();
}

export async function validateN8nConfig(_clientId: string): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];
  const health = await checkN8nHealth();
  if (health.status !== "ok") issues.push("n8n instance is not reachable");
  if (!N8N_WEBHOOK_URL) issues.push("N8N_WEBHOOK_URL not configured");
  return { valid: issues.length === 0, issues };
}
