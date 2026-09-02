/**
 * n8n Webhook Client
 * Sends lead data to n8n workflows for processing
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;

interface N8nLeadPayload {
  client_id: string;
  client_name: string;
  client_industry: string;
  lead_id: string;
  lead_name: string;
  lead_email?: string;
  lead_phone?: string;
  lead_whatsapp?: string;
  lead_message?: string;
  lead_source?: string;
  channel: string;
  channel_destination: string;
  response_template: string;
  business_hours: {
    timezone: string;
    start: string;
    end: string;
    currently_open: boolean;
  };
  qualification: {
    score: number;
    qualified: boolean;
    reason: string;
  };
}

interface N8nResponse {
  success: boolean;
  execution_id?: string;
  message?: string;
  error?: string;
}

/**
 * Send a lead to n8n for processing
 */
export async function sendLeadToN8n(payload: N8nLeadPayload): Promise<N8nResponse> {
  if (!N8N_WEBHOOK_URL) {
    return { success: false, error: "N8N_WEBHOOK_URL not configured" };
  }

  try {
    const webhookUrl = `${N8N_WEBHOOK_URL}/webhook/elion/lead-response`;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(N8N_WEBHOOK_SECRET ? { "X-Webhook-Secret": N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `n8n returned ${response.status}: ${text}` };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      execution_id: data.executionId || data.execution_id,
      message: data.message || "Lead sent to n8n",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `n8n webhook failed: ${msg}` };
  }
}

/**
 * Test n8n connectivity
 */
export async function testN8nConnection(): Promise<N8nResponse> {
  if (!N8N_WEBHOOK_URL) {
    return { success: false, error: "N8N_WEBHOOK_URL not configured" };
  }

  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/healthz`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    return {
      success: response.ok,
      message: response.ok ? "n8n is reachable" : `n8n returned ${response.status}`,
    };
  } catch (error) {
    return { success: false, error: "n8n is not reachable" };
  }
}
