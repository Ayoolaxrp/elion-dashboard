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
  const html = wrap(
    p("Hi " + data.firstName + ",") + p("Welcome to ELION.") + p("We're officially getting started.")
    + p("Your automation project is now moving into the implementation phase, and I'm looking forward to building something that genuinely improves how " + data.businessName + " operates.")
    + p("We'll be setting up " + auto + ", configured specifically around how your business works.")
    + '<p style="color:#F8FAFC;font-size:16px;font-weight:600;letter-spacing:0.5px;margin:0 0 32px">Discover → Configure → Build → Test → Launch</p>'
    + '<h3 style="color:#F8FAFC;font-size:15px;font-weight:600;margin:0 0 16px">What happens next</h3>'
    + p("I'll be sending you the details for our kickoff call, where we'll:")
    + '<ul style="color:#9CA3AF;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px"><li>Confirm the agreed scope</li><li>Walk through your current workflow</li><li>Identify the key requirements</li><li>Confirm the integrations and access we need</li><li>Define what success looks like</li><li>Establish the implementation timeline</li></ul>'
    + p("Please have any relevant business information, existing processes, accounts, or materials available before the call.")
    + p("This isn't about simply adding another software tool to your business. The goal is to build a system that actually works around how your business operates.")
    + p("Welcome to ELION. Let's build.") + p("Thank you in anticipation.", "margin:0 0 8px")
    + '<p style="color:#F8FAFC;font-size:14px;font-weight:600;margin:16px 0 0">Ayoolamikun</p>'
    + '<p style="color:#6B7280;font-size:12px;margin:4px 0 0">ELION</p>'
  );
  return { subject, html, text: "Hi " + data.firstName + ",\n\nWelcome to ELION.\n\nYour automation project is moving into the implementation phase.\n\nProcess: Discover → Configure → Build → Test → Launch\n\nThank you in anticipation.\nAyoolamikun\nELION" };
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
