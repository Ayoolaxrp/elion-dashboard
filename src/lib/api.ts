// API client for n8n webhook submissions
// Uses NEXT_PUBLIC_N8N_URL env var, falls back to auto-detect

function getN8nUrl(): string {
  // Server-side or client-side env var
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_N8N_URL) {
    return process.env.NEXT_PUBLIC_N8N_URL;
  }
  // Client-side: auto-detect from window.location
  if (typeof window !== "undefined") {
    return window.location.origin.replace(":4000", ":5678");
  }
  return "http://localhost:5678";
}

export interface FormResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

const N8N_URL = getN8nUrl();

export async function submitForm(
  webhookPath: string,
  payload: Record<string, string>
): Promise<FormResult> {
  try {
    const res = await fetch(`${N8N_URL}${webhookPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, error: `Server error: ${res.status}` };
    }

    const text = await res.text();
    try {
      return { success: true, data: JSON.parse(text) };
    } catch {
      return { success: true, data: { raw: text } };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { success: false, error: "Request timed out. Please try again." };
    }
    return {
      success: false,
      error: "Cannot reach server. Please check your connection and try again.",
    };
  }
}
