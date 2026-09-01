import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "ELION <onboarding@elion.ng>";
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

export { ADMIN_EMAIL };
