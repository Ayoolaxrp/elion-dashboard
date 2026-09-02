// Onboarding email scheduler - sends emails at intervals
import { Resend } from "resend";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "ELION <onboarding@resend.dev>";

interface ScheduleConfig {
  clientId: string;
  clientName: string;
  clientEmail: string;
  businessName: string;
  kickoffDate?: string;
  kickoffTime?: string;
  kickoffLink?: string;
  automationName?: string;
  connectedSystems?: string[];
  workflowDescription?: string;
}

// Stages and delays (in milliseconds)
// Welcome: immediately, Kickoff: 1 day, Configuration: 3 days, Build: 5 days, Testing: 3 days, Launch: 2 days, Handover: 1 day
const STAGE_DELAYS: Record<string, number> = {
  welcome: 0,
  kickoff: 86400000,         // 1 day
  configuration: 259200000,  // 3 days
  build: 432000000,          // 5 days
  testing: 259200000,        // 3 days
  launch: 172800000,         // 2 days
  handover: 86400000,        // 1 day
};

const STAGE_ORDER = ["welcome", "kickoff", "configuration", "build", "testing", "launch", "handover"];

function getWelcomeEmail(config: ScheduleConfig) {
  return {
    subject: `Welcome to ELION — Your Automation Journey Begins`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#4F7CFF;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;">E</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">
        Welcome to ELION.<br/><br/>
        We're officially getting started.<br/><br/>
        Your automation project is now moving into the implementation phase, and I'm looking forward to building something that genuinely improves how <strong style="color:#F8FAFC;">${config.businessName}</strong> operates.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        Our process is simple:<br/>
        <strong style="color:#F8FAFC;">Discover → Configure → Build → Test → Launch</strong>
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">
        We'll start by understanding how your business currently handles the workflow we're automating, where the bottlenecks are, and what the ideal process should look like.
      </p>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#F8FAFC;margin-bottom:12px;">What happens next</h3>
        <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:12px;">I'll be sending you the details for our kickoff call, where we'll:</p>
        <ul style="font-size:14px;line-height:1.8;color:#9CA3AF;padding-left:20px;">
          <li>Confirm the agreed scope</li>
          <li>Walk through your current workflow</li>
          <li>Identify the key requirements</li>
          <li>Confirm the integrations and access we need</li>
          <li>Define what success looks like</li>
          <li>Establish the implementation timeline</li>
        </ul>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        Please have any relevant business information, existing processes, accounts, or materials available before the call.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        This isn't about simply adding another software tool to your business.<br/>
        The goal is to build a system that actually works around how your business operates.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:8px;">Welcome to ELION.</p>
      <p style="font-size:16px;line-height:1.7;color:#F8FAFC;margin-bottom:24px;">Let's build.</p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:14px;color:#6B7280;">Thank you in anticipation.</p>
        <p style="font-size:16px;font-weight:600;">Ayoolamikun</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getKickoffEmail(config: ScheduleConfig) {
  return {
    subject: `ELION — Project Kickoff Call Scheduled`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#4F7CFF;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;">E</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        We're ready for the kickoff call for your ELION automation.
      </p>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin-bottom:8px;"><span style="color:#4F7CFF;">Date:</span> <span style="color:#F8FAFC;">${config.kickoffDate || "TBD"}</span></p>
        <p style="margin-bottom:8px;"><span style="color:#4F7CFF;">Time:</span> <span style="color:#F8FAFC;">${config.kickoffTime || "TBD"}</span></p>
        ${config.kickoffLink ? `<p><span style="color:#4F7CFF;">Call:</span> <span style="color:#F8FAFC;">${config.kickoffLink}</span></p>` : ""}
      </div>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">During the call, we'll cover:</p>
      <ol style="font-size:14px;line-height:1.8;color:#9CA3AF;padding-left:20px;margin-bottom:24px;">
        <li>Your current workflow</li>
        <li>The problem we're solving</li>
        <li>The agreed automation</li>
        <li>Required integrations/access</li>
        <li>How the new workflow should operate</li>
        <li>Implementation timeline</li>
        <li>What we'll need from you</li>
      </ol>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        Please join from somewhere you can comfortably discuss your business processes.<br/><br/>
        If there are any existing documents, workflows, screenshots, accounts, or examples that would help us understand the current process, please have them available.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">See you on the call.</p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:14px;color:#6B7280;">Thank you in anticipation.</p>
        <p style="font-size:16px;font-weight:600;">— Ayoola</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getConfigurationEmail(config: ScheduleConfig) {
  return {
    subject: `ELION — Configuration Phase for ${config.businessName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#4F7CFF;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;">E</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        We've completed the kickoff and are now moving into the <strong style="color:#F8FAFC;">configuration phase</strong> for ${config.businessName}.
      </p>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#F8FAFC;margin-bottom:12px;">What we're configuring</h3>
        <ul style="font-size:14px;line-height:1.8;color:#9CA3AF;padding-left:20px;">
          <li>Communication channels (WhatsApp, Email)</li>
          <li>Business rules and response patterns</li>
          <li>Working hours and availability</li>
          <li>Lead qualification criteria</li>
          <li>Follow-up sequences</li>
        </ul>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        We'll keep you updated as configuration progresses. If we need any additional information, we'll reach out.
      </p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:14px;color:#6B7280;">Thank you in anticipation.</p>
        <p style="font-size:16px;font-weight:600;">— Ayoola</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getBuildEmail(config: ScheduleConfig) {
  return {
    subject: `ELION — Build Phase for ${config.businessName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#4F7CFF;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:white;">E</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        Your automation is now being <strong style="color:#F8FAFC;">built</strong>.
      </p>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#F8FAFC;margin-bottom:12px;">What's happening</h3>
        <ul style="font-size:14px;line-height:1.8;color:#9CA3AF;padding-left:20px;">
          <li>Connecting your communication channels</li>
          <li>Building the automation workflows</li>
          <li>Configuring response templates</li>
          <li>Setting up tracking and logging</li>
        </ul>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        We're building this around how your business operates. You'll be able to see everything once we move to testing.
      </p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:14px;color:#6B7280;">Thank you in anticipation.</p>
        <p style="font-size:16px;font-weight:600;">— Ayoola</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getTestingEmail(config: ScheduleConfig) {
  return {
    subject: `ELION — Testing Phase for ${config.businessName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#F59E0B;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:white;">⚙</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        Your automation for <strong style="color:#F8FAFC;">${config.businessName}</strong> is now in <strong style="color:#F8FAFC;">testing</strong>.
      </p>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#F8FAFC;margin-bottom:12px;">Testing checklist</h3>
        <ul style="font-size:14px;line-height:1.8;color:#9CA3AF;padding-left:20px;">
          <li>Verifying all connections are active</li>
          <li>Testing lead capture and response flow</li>
          <li>Validating follow-up sequences</li>
          <li>Confirming message delivery</li>
          <li>Checking error handling</li>
        </ul>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        We'll notify you once testing is complete and everything is ready for launch.
      </p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:14px;color:#6B7280;">Thank you in anticipation.</p>
        <p style="font-size:16px;font-weight:600;">— Ayoola</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getLaunchEmail(config: ScheduleConfig) {
  return {
    subject: `ELION — Your Automation is Live!`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#10B981;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:white;">✓</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">We're done.</p>
      <p style="font-size:16px;line-height:1.7;color:#F8FAFC;margin-bottom:24px;">
        Your ELION automation has now been completed and is ready for use.
      </p>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:24px;">
        Over the course of the implementation, we took the workflow we discussed, configured the system around your business, connected the required components, and tested the agreed process.
      </p>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#F8FAFC;margin-bottom:12px;">What has been delivered</h3>
        <p style="font-size:14px;color:#9CA3AF;margin-bottom:8px;"><span style="color:#4F7CFF;">Automation:</span> ${config.automationName || "Lead Response System"}</p>
        <p style="font-size:14px;color:#9CA3AF;margin-bottom:8px;"><span style="color:#10B981;">Status:</span> Live</p>
        <p style="font-size:14px;color:#9CA3AF;margin-bottom:12px;"><span style="color:#4F7CFF;">Connected Systems:</span></p>
        <ul style="font-size:14px;line-height:1.8;color:#9CA3AF;padding-left:20px;margin-bottom:12px;">
          ${(config.connectedSystems || ["WhatsApp", "Email", "Calendar"]).map(s => `<li>${s}</li>`).join("")}
        </ul>
        ${config.workflowDescription ? `<p style="font-size:14px;color:#9CA3AF;"><span style="color:#4F7CFF;">Key Workflow:</span> ${config.workflowDescription}</p>` : ""}
      </div>
      <div style="background:#11161F;border:1px solid #1F2937;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:14px;font-weight:600;color:#F8FAFC;margin-bottom:12px;">Your next step</h3>
        <p style="font-size:14px;line-height:1.7;color:#9CA3AF;">
          You can now begin using the system as part of your normal business operations.<br/><br/>
          We'll also provide any relevant handover information, access details, or instructions you need.
        </p>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">
        Please remember that the purpose of this system isn't simply to "have automation." It is to remove a repetitive operational burden from your business and create a process that works consistently.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:8px;">Thank you for trusting ELION with this part of your business.</p>
      <p style="font-size:16px;line-height:1.7;color:#F8FAFC;margin-bottom:24px;">I genuinely appreciate the opportunity to build with you.</p>
      <p style="font-size:16px;line-height:1.7;color:#F8FAFC;margin-bottom:24px;">Here's to building better systems.</p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:14px;color:#6B7280;">Thank you in anticipation.</p>
        <p style="font-size:16px;font-weight:600;">Ayoola</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getHandoverEmail(config: ScheduleConfig) {
  return {
    subject: `ELION — Handover Complete for ${config.businessName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0A0D14;color:#F8FAFC;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#10B981;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;color:white;">★</div>
      </div>
      <h1 style="font-size:24px;font-weight:600;margin-bottom:16px;">Hi ${config.clientName},</h1>
      <p style="font-size:16px;line-height:1.7;color:#F8FAFC;margin-bottom:16px;">
        Thank you for trusting ELION with a part of your business.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">
        I know that putting your business systems in someone else's hands requires trust, and I don't take that lightly.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">
        We're not just building an automation for you — we're building something that should give you and your team more time to focus on the things that actually move the business forward.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#9CA3AF;margin-bottom:16px;">
        I'm excited to see what we build together.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#F8FAFC;margin-bottom:24px;">
        Thank you for choosing ELION.
      </p>
      <div style="border-top:1px solid #1F2937;padding-top:24px;">
        <p style="font-size:16px;font-weight:600;">— Ayoolamikun</p>
        <p style="font-size:14px;color:#4F7CFF;">ELION</p>
      </div>
    </div>`
  };
}

function getEmailContent(stage: string, config: ScheduleConfig) {
  const templates: Record<string, { subject: string; html: string }> = {
    welcome: getWelcomeEmail(config),
    kickoff: getKickoffEmail(config),
    configuration: getConfigurationEmail(config),
    build: getBuildEmail(config),
    testing: getTestingEmail(config),
    launch: getLaunchEmail(config),
    handover: getHandoverEmail(config),
  };
  return templates[stage] || templates.welcome;
}

export async function sendStageEmail(stage: string, config: ScheduleConfig): Promise<boolean> {
  if (!resend) return false;
  const t = getEmailContent(stage, config);
  try {
    const { error } = await resend.emails.send({ from: FROM, to: [config.clientEmail], subject: t.subject, html: t.html });
    if (error) { console.error("[ONBOARDING] Failed " + stage + ":", error.message); return false; }
    console.log("[ONBOARDING] Sent " + stage + " to " + config.clientEmail);
    return true;
  } catch (err) { console.error("[ONBOARDING] Error " + stage, err); return false; }
}

export function getNextStage(current: string): string | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function getStageDelay(stage: string): number {
  return STAGE_DELAYS[stage] || 0;
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    welcome: "Welcome",
    kickoff: "Kickoff Call",
    configuration: "Configuration",
    build: "Build",
    testing: "Testing",
    launch: "Launch",
    handover: "Handover",
  };
  return labels[stage] || stage;
}
