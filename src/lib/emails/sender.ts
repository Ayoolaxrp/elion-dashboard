import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "ELION <onboarding@resend.dev>";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!resend) {
    console.error("[ELION-EMAIL] RESEND_API_KEY not configured");
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html, text });
    if (error) { console.error("[ELION-EMAIL] Failed:", error.message); return false; }
    console.log("[ELION-EMAIL] Sent to " + to + ": " + subject);
    return true;
  } catch (err) {
    console.error("[ELION-EMAIL] Exception:", err);
    return false;
  }
}

export async function sendAdminNotification(subject: string, html: string, text: string): Promise<boolean> {
  return sendEmail(ADMIN_EMAIL, subject, html, text);
}

export interface BookingConfirmationDetails {
  customer_name: string;
  summary: string;
  start_at: string; // UTC ISO
  end_at: string; // UTC ISO
  timezone: string;
  meet_url: string | null;
  booking_id: string;
  host?: string; // who booked with (e.g. business or ELION)
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function formatLocal(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

/** Builds the confirmation email body (no side effects : used by the sender and tests). */
export function buildBookingConfirmationEmail(d: BookingConfirmationDetails): { subject: string; html: string; text: string } {
  const when = formatLocal(d.start_at, d.timezone);
  const subject = `Booking confirmed: ${d.summary}`;
  const rows = [
    ["What", esc(d.summary)],
    ["When", esc(when)],
    ["Reference", esc(d.booking_id)],
  ];
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a2e">
      <h2 style="font-size:18px;margin-bottom:16px">Your call is booked ✓</h2>
      <p style="color:#333;line-height:1.6">Hi ${esc(d.customer_name)},</p>
      <p style="color:#333;line-height:1.6">Your ${esc(d.host || "ELION")} call has been confirmed. Here is everything you need:</p>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0;line-height:1.8">
        ${rows.map(([k, v]) => `<p style="margin:6px 0"><strong>${k}:</strong> ${v}</p>`).join("")}
        ${d.meet_url ? `<p style="margin:6px 0"><strong>Google Meet:</strong> <a href="${esc(d.meet_url)}" style="color:#3B66E8">Join the call</a></p>` : ""}
        <p style="margin:6px 0;color:#666;font-size:13px">Timezone: ${esc(d.timezone)}</p>
      </div>
      ${d.meet_url ? `<p style="text-align:center;margin:20px 0"><a href="${esc(d.meet_url)}" style="display:inline-block;background:#3B66E8;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600">Join Google Meet</a></p>` : ""}
      <p style="color:#666;font-size:13px">Need to reschedule or cancel? Reply to this email and we'll help.</p>
      <p style="color:#999;font-size:12px;margin-top:24px">ELION : Find the leaks in your business. Then automate them.</p>
    </div>`;
  const text = [
    `Your call is booked ✓`,
    `Hi ${d.customer_name},`,
    `Your ${d.host || "ELION"} call has been confirmed.`,
    `What: ${d.summary}`,
    `When: ${when}`,
    d.meet_url ? `Google Meet: ${d.meet_url}` : "",
    `Reference: ${d.booking_id}`,
    `Timezone: ${d.timezone}`,
    "",
    "Need to reschedule or cancel? Reply to this email and we'll help.",
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}

/** Sends the booking confirmation to the customer. Never throws : booking outcome
 *  is decided by the real calendar event, not by email deliverability. */
export async function sendBookingConfirmationEmail(to: string, d: BookingConfirmationDetails): Promise<boolean> {
  const { subject, html, text } = buildBookingConfirmationEmail(d);
  return sendEmail(to, subject, html, text);
}

export { ADMIN_EMAIL };
