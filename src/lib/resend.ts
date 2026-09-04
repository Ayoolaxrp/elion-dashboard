import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resend) resend = new Resend(apiKey);
  return resend;
}

export async function sendAuditNotification(to: string, leadData: {
  name: string;
  email: string;
  businessType?: string;
  website?: string;
  primaryProblem?: string;
}) {
  const r = getResend();
  if (!r) {
    console.log("[EMAIL] Resend not configured, skipping email");
    return { ok: false, skipped: true };
  }

  try {
    const result = await r.emails.send({
      from: "ELION <onboarding@resend.dev>",
      to,
      subject: "New Audit Submission: " + leadData.name + " (" + (leadData.businessType || "Unknown") + ")",
      html: buildEmail("New Audit Submission", [
        "<strong>Name:</strong> " + leadData.name,
        "<strong>Email:</strong> " + leadData.email,
        leadData.businessType ? "<strong>Business Type:</strong> " + leadData.businessType : "",
        leadData.website ? "<strong>Website:</strong> " + leadData.website : "",
        leadData.primaryProblem ? "<strong>Primary Problem:</strong> " + leadData.primaryProblem : "",
      ].filter(Boolean).join(""), "Review this lead in your admin dashboard."),
    });
    console.log("[EMAIL] Audit notification sent:", result.data?.id);
    return { ok: true, id: result.data?.id };
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return { ok: false, error: String(error) };
  }
}

export async function sendClientWelcome(to: string, clientData: {
  name: string;
  companyName: string;
  loginUrl?: string;
}) {
  const r = getResend();
  if (!r) return { ok: false, skipped: true };

  try {
    const loginUrl = clientData.loginUrl || (process.env.NEXT_PUBLIC_SITE_URL || "https://elion.com.ng") + "/login";
    const result = await r.emails.send({
      from: "ELION <onboarding@resend.dev>",
      to,
      subject: "Welcome to ELION - Your automation systems are being set up",
      html: buildEmail("Welcome to ELION",
        "<p>Hi " + clientData.name + ",</p>" +
        "<p>Thank you for choosing ELION to automate your business operations. We're excited to work with " + clientData.companyName + ".</p>" +
        "<h3 style='margin-top:20px'>What happens next?</h3>" +
        "<ol style='line-height:1.8'>" +
        "<li>We review your business information</li>" +
        "<li>Configure your automation systems</li>" +
        "<li>Connect your integrations (WhatsApp, Email, Calendar)</li>" +
        "<li>Test everything thoroughly</li>" +
        "<li>Go live with your automations</li>" +
        "</ol>" +
        "<p style='text-align:center;margin:24px 0'>" +
        "<a href='" + loginUrl + "' style='display:inline-block;background:#4F7CFF;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600'>Go to Dashboard</a>" +
        "</p>" +
        "<p style='color:#666;font-size:13px'>If you have any questions, reply to this email or contact us at support@elion.com.ng.</p>",
        ""
      ),
    });
    return { ok: true, id: result.data?.id };
  } catch (error) {
    console.error("[EMAIL] Welcome send failed:", error);
    return { ok: false, error: String(error) };
  }
}

function buildEmail(title: string, body: string, footer: string) {
  return [
    "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px'>",
    "<h2 style='color:#1a1a2e;font-size:18px;margin-bottom:16px'>" + title + "</h2>",
    "<div style='background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:16px;line-height:1.6;color:#333'>" + body + "</div>",
    footer ? "<p style='color:#666;font-size:14px'>" + footer + "</p>" : "",
    "<p style='color:#999;font-size:12px;margin-top:24px'>ELION - Find the leaks in your business. Then automate them.</p>",
    "</body></html>",
  ].join("\n");
}
