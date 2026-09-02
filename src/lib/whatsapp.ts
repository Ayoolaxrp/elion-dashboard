/** ELION WhatsApp Cloud API Integration */

const WHATSAPP_API_URL = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

export class WhatsAppClient {
  private phoneNumberId: string;
  private accessToken: string;

  constructor(phoneNumberId?: string, accessToken?: string) {
    this.phoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.accessToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN || "";
  }

  isConfigured(): boolean {
    return !!(this.phoneNumberId && this.accessToken);
  }

  async sendText(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured()) return { success: false, error: "WhatsApp not configured" };
    const phone = this.normalizePhone(to);
    if (!phone) return { success: false, error: "Invalid phone number" };
    return this.sendMessage({ to: phone, type: "text", text: { body: message, preview_url: false } });
  }

  private async sendMessage(payload: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `${WHATSAPP_API_URL}/${API_VERSION}/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data?.error?.message || `HTTP ${response.status}` };
      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  private normalizePhone(phone: string): string | null {
    if (!phone) return null;
    let c = phone.replace(/[s\-()]/g, "");
    if (c.startsWith("+") && c.length >= 11) return c;
    if (c.startsWith("0") && c.length === 11) return "+234" + c.substring(1);
    if (c.startsWith("234") && c.length === 13) return "+" + c;
    if (c.startsWith("234")) return "+" + c;
    return null;
  }
}

let _client: WhatsAppClient | null = null;
export function getWhatsAppClient(): WhatsAppClient {
  if (!_client) _client = new WhatsAppClient();
  return _client;
}