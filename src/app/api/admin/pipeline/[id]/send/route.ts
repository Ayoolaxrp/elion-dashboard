import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendEmail, sendAdminNotification } from "@/lib/emails/sender";
import { buildWelcomeEmail, buildKickoffWhatsApp, buildCompletionEmail, buildAuditNotificationEmail } from "@/lib/emails/templates";

async function getAdmin() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes((user.email || "").toLowerCase())) return null;
  return sb;
}

// POST - send an email for a pipeline stage
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json();
  const { type, ...data } = body;

  // Get pipeline + client
  const { data: pipeline, error } = await sb
    .from("onboarding_pipeline")
    .select("*, clients(id, contact_name, email, company_name, plan_name)")
    .eq("id", id)
    .single();

  if (error || !pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });
  const client = pipeline.clients as unknown as { id: string; contact_name: string; email: string; company_name: string; plan_name: string };

  const firstName = (client.contact_name || "").split(" ")[0] || "there";
  let sent = false;

  if (type === "welcome") {
    const { subject, html, text } = buildWelcomeEmail({
      firstName,
      businessName: client.company_name || "your business",
      automationsPurchased: data.automations || [],
    });
    sent = await sendEmail(client.email, subject, html, text);
    if (sent) {
      await sb.from("onboarding_pipeline").update({
        welcome_email_sent: true,
        welcome_email_sent_at: new Date().toISOString(),
      }).eq("id", id);
      await sb.from("notifications").insert({
        type: "onboarding_email_sent",
        title: `Welcome email sent — ${client.company_name || client.contact_name}`,
        message: `Welcome email sent to ${client.email}`, client_id: client.id,
        metadata: { kind: "welcome", pipeline_id: id },
      });
    }
  }

  if (type === "kickoff_whatsapp") {
    const msg = buildKickoffWhatsApp({
      firstName,
      date: data.date || "TBD",
      time: data.time || "TBD",
      callLink: data.callLink || "https://meet.google.com/new",
    });
    // Store message for admin to copy-send via WhatsApp
    sent = true;
    await sb.from("onboarding_pipeline").update({
      kickoff_message_sent: true,
      kickoff_message_sent_at: new Date().toISOString(),
      kickoff_date: data.date || null,
      kickoff_time: data.time || null,
      kickoff_call_link: data.callLink || null,
    }).eq("id", id);
    await sb.from("notifications").insert({
      type: "onboarding_email_sent",
      title: `Kickoff message drafted — ${client.company_name || client.contact_name}`,
      message: `Kickoff WhatsApp message generated for ${client.email} (${data.date || "TBD"} ${data.time || ""})`, client_id: client.id,
      metadata: { kind: "kickoff", pipeline_id: id },
    });
    return NextResponse.json({ success: true, whatsappMessage: msg, note: "Copy this message and send via WhatsApp" });
  }

  if (type === "completion") {
    const { subject, html, text } = buildCompletionEmail({
      firstName,
      automationName: data.automationName || "Lead Response System",
      connectedSystems: data.connectedSystems || ["WhatsApp", "Email", "Calendar"],
      workflowDescription: data.workflowDescription || "Automated lead capture, qualification, and response workflow.",
    });
    sent = await sendEmail(client.email, subject, html, text);
    if (sent) {
      await sb.from("onboarding_pipeline").update({
        completion_email_sent: true,
        completion_email_sent_at: new Date().toISOString(),
      }).eq("id", id);
      await sb.from("notifications").insert({
        type: "onboarding_email_sent",
        title: `Completion email sent — ${client.company_name || client.contact_name}`,
        message: `Completion email sent to ${client.email}`, client_id: client.id,
        metadata: { kind: "completion", pipeline_id: id },
      });
    }
  }

  if (type === "audit_notification") {
    const { subject, html, text } = buildAuditNotificationEmail({
      contactName: client.contact_name,
      email: client.email,
      businessType: client.plan_name,
    });
    sent = await sendAdminNotification(subject, html, text);
  }

  return NextResponse.json({ success: sent, type });
}
