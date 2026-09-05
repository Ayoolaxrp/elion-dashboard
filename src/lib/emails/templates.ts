export interface WelcomeEmailData { firstName: string; businessName: string; automationsPurchased?: string[]; }
export interface KickoffWhatsAppData { firstName: string; date: string; time: string; callLink: string; }
export interface CompletionEmailData { firstName: string; automationName: string; connectedSystems: string[]; workflowDescription: string; }
export interface AuditNotificationData { contactName: string; email: string; businessType?: string; website?: string; primaryProblem?: string; teamSize?: string; }

function hdr(): string {
  return '<div style="margin-bottom:32px"><img src="https://elion.com.ng/brand/elion-e-icon.png" alt="ELION" width="40" height="40" style="display:block" /></div>';
}
function wrap(body: string): string {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#0A0D14;font-family:Inter,system-ui,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px">' + hdr() + body + '</div></body></html>';
}
function p(text: string, extra?: string): string {
  return '<p style="color:#9CA3AF;font-size:14px;line-height:1.6;margin:0 0 24px' + (extra ? ';' + extra : '') + '">' + text + '</p>';
}

export function buildWelcomeEmail(data: WelcomeEmailData) {
  const subject = "Welcome to ELION - " + data.businessName;
  const auto = data.automationsPurchased && data.automationsPurchased.length > 0 ? data.automationsPurchased.join(", ") : "your agreed automation systems";
  // Light, email-compatible document style (no gradients required for meaning).
  const btn = (label: string, href: string) =>
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="background:#6950A1;border-radius:6px"><a href="' + href + '" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px">' + label + '</a></td></tr></table>';
  const link = (label: string, href: string) =>
    '<a href="' + href + '" style="color:#6950A1;text-decoration:underline;font-size:14px">' + label + '</a>';
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#F7F7F5;font-family:Inter,Arial,sans-serif">'
    + '<div style="max-width:600px;margin:0 auto;padding:32px 20px">'
    + '<div style="margin-bottom:24px"><img src="https://elion.com.ng/brand/elion-e-icon.png" alt="ELION" width="36" height="36" style="display:block" /></div>'
    + '<div style="background:#ffffff;border:1px solid #E4E4E0;border-radius:8px;padding:32px">'
    + '<h1 style="color:#252525;font-size:24px;line-height:32px;font-weight:700;margin:0 0 16px">Welcome to ELION, ' + data.firstName + '</h1>'
    + '<p style="color:#646461;font-size:16px;line-height:26px;margin:0 0 16px">Your project for ' + data.businessName + ' is officially underway. We are building ' + auto + ', configured around how your business actually works.</p>'
    + '<p style="color:#646461;font-size:16px;line-height:26px;margin:0 0 24px">Your first step: complete the short onboarding form. It tells us exactly how your enquiries and bookings work today, so your systems are prepared before kickoff.</p>'
    + btn("Complete onboarding", "https://elion.com.ng/dashboard/portal/onboarding")
    + '<p style="color:#646461;font-size:16px;line-height:26px;margin:0 0 8px">Also useful:</p>'
    + '<p style="margin:0 0 24px">' + link("Your client workspace", "https://elion.com.ng/dashboard/portal") + ' &nbsp;·&nbsp; ' + link("Your agreement", "https://elion.com.ng/dashboard/documents") + '</p>'
    + '<div style="background:#F1F1EF;border-radius:8px;padding:20px">'
    + '<p style="color:#252525;font-size:14px;font-weight:600;margin:0 0 8px">What happens next</p>'
    + '<p style="color:#646461;font-size:14px;line-height:22px;margin:0 0 6px">1. Complete onboarding (5 minutes, saves as you go)</p>'
    + '<p style="color:#646461;font-size:14px;line-height:22px;margin:0 0 6px">2. We confirm kickoff - Monday to Friday, 9am to 6pm WAT</p>'
    + '<p style="color:#646461;font-size:14px;line-height:22px;margin:0 0 0">3. We build, test, and hand over your systems. Track everything in your workspace.</p>'
    + '</div>'
    + '<p style="color:#646461;font-size:14px;line-height:22px;margin:24px 0 0">Questions? Reply to this email or use the support page. We respond within 24 hours on business days.</p>'
    + '<p style="color:#252525;font-size:14px;font-weight:600;margin:24px 0 0">Ayoolamikun</p>'
    + '<p style="color:#777773;font-size:12px;margin:2px 0 0">ELION</p>'
    + '</div></div></body></html>';
  return { subject, html, text: "Hi " + data.firstName + ",\n\nWelcome to ELION. Your project for " + data.businessName + " is officially underway.\n\nYour first step: complete the short onboarding form (saves as you go):\nhttps://elion.com.ng/dashboard/portal/onboarding\n\nWhat happens next:\n1. Complete onboarding (5 minutes)\n2. We confirm kickoff (Mon-Fri, 9am-6pm WAT)\n3. We build, test, and hand over your systems\n\nQuestions? Reply here or via the support page.\n\nAyoolamikun\nELION" };
}

export function buildKickoffWhatsApp(data: KickoffWhatsAppData): string {
  return "Hi " + data.firstName + ",\n\nWe're ready for the kickoff call for your ELION automation.\n\n\ud83d\udcc5 Date: " + data.date + "\n\ud83d\udd50 Time: " + data.time + "\n\ud83d\udcde Call: " + data.callLink
    + "\n\nDuring the call, we'll cover:\n\n1. Your current workflow\n2. The problem we're solving\n3. The agreed automation\n4. Required integrations/access\n5. How the new workflow should operate\n6. Implementation timeline\n7. What we'll need from you"
    + "\n\nPlease join from somewhere you can comfortably discuss your business processes."
    + "\n\nThank you in anticipation.\n\n- Ayoola\nELION";
}

export function buildCompletionEmail(data: CompletionEmailData) {
  const subject = "Your ELION Automation is Live - " + data.automationName;
  const systemsList = data.connectedSystems.map(function(s) { return '<li style="color:#9CA3AF;font-size:14px">' + s + '</li>'; }).join("");
  const html = wrap(
    p("Hi " + data.firstName + ",") + p("We're done. Your ELION automation has now been completed and is ready for use.")
    + '<h3 style="color:#F8FAFC;font-size:15px;font-weight:600;margin:0 0 16px">What has been delivered</h3>'
    + '<div style="background:#11161F;border:1px solid #1F2937;border-radius:8px;padding:20px;margin:0 0 24px">'
    + '<p style="color:#6B7280;font-size:12px;margin:0 0 4px">AUTOMATION</p><p style="color:#F8FAFC;font-size:14px;font-weight:600;margin:0 0 16px">' + data.automationName + '</p>'
    + '<p style="color:#6B7280;font-size:12px;margin:0 0 4px">STATUS</p><p style="color:#10B981;font-size:14px;font-weight:600;margin:0 0 16px">✓ Live</p>'
    + '<p style="color:#6B7280;font-size:12px;margin:0 0 4px">CONNECTED SYSTEMS</p><ul style="list-style:none;padding:0;margin:0 0 16px">' + systemsList + '</ul>'
    + '<p style="color:#6B7280;font-size:12px;margin:0 0 4px">KEY WORKFLOW</p><p style="color:#9CA3AF;font-size:14px;line-height:1.6;margin:0">' + data.workflowDescription + '</p></div>'
    + p("You can now begin using the system as part of your normal business operations.")
    + p("Please remember that the purpose of this system isn't simply to have automation. It is to remove a repetitive operational burden from your business.")
    + p("Thank you for trusting ELION with this part of your business.")
    + p("Here's to building better systems.", "margin:0 0 8px")
    + '<p style="color:#F8FAFC;font-size:14px;font-weight:600;margin:16px 0 0">Ayoola</p><p style="color:#6B7280;font-size:12px;margin:4px 0 0">ELION</p>'
  );
  return { subject: subject, html: html, text: "Hi " + data.firstName + ",\n\nWe're done. Your ELION automation is ready.\n\nAutomation: " + data.automationName + "\nStatus: Live\n\nThank you for trusting ELION.\n\nAyoola\nELION" };
}

export function buildAuditNotificationEmail(data: AuditNotificationData) {
  const subject = "New Audit Submission - " + data.contactName;
  const html = wrap(
    '<div style="background:#11161F;border:1px solid #1F2937;border-radius:8px;padding:20px;margin:0 0 24px">'
    + '<p style="color:#6B7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">New Audit Submission</p>'
    + '<h2 style="color:#F8FAFC;font-size:18px;font-weight:600;margin:8px 0 16px">' + data.contactName + '</h2>'
    + '<table style="width:100%;border-collapse:collapse"><tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Email</td><td style="color:#F8FAFC;font-size:13px;padding:6px 0;text-align:right">' + data.email + '</td></tr>'
    + '<tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Business</td><td style="color:#F8FAFC;font-size:13px;padding:6px 0;text-align:right">' + (data.businessType || "Not specified") + '</td></tr>'
    + '<tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Website</td><td style="color:#F8FAFC;font-size:13px;padding:6px 0;text-align:right">' + (data.website || "Not provided") + '</td></tr>'
    + '<tr><td style="color:#6B7280;font-size:13px;padding:6px 0">Problem</td><td style="color:#F8FAFC;font-size:13px;padding:6px 0;text-align:right">' + (data.primaryProblem || "Not specified") + '</td></tr></table></div>'
    + '<a href="https://elion.com.ng/admin/leads" style="display:inline-block;background:#4F7CFF;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">View in Admin →</a>'
  );
  return { subject: subject, html: html, text: "New Audit Submission\nName: " + data.contactName + "\nEmail: " + data.email + "\nBusiness: " + (data.businessType || "N/A") + "\nProblem: " + (data.primaryProblem || "N/A") };
}
