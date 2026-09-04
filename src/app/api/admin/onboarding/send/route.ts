import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { sendEmail } from "@/lib/emails/sender";
import { buildWelcomeEmail, buildCompletionEmail } from "@/lib/emails/templates";

async function getAdmin() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes((user.email || "").toLowerCase()) ? sb : null;
}

export const dynamic = "force-dynamic";

interface ClientRow { id: string; contact_name: string; email: string; company_name: string; plan_name: string }

// POST - send an onboarding email to ONE client (individual, on demand).
// Ensures an onboarding_pipeline exists for the client (creates one at the
// welcome stage if missing) so the send is always possible from the client
// list, then sends the email and logs an admin notification.
export async function POST(request: Request) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: { client_id?: unknown; kind?: unknown; automationName?: unknown; connectedSystems?: unknown; workflowDescription?: unknown } = await request.json();

  if (typeof body.client_id !== "string" || !body.client_id) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }
  const kind = body.kind === "completion" ? "completion" : "welcome";

  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("id, contact_name, email, company_name, plan_name")
    .eq("id", body.client_id)
    .maybeSingle();
  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });
  if (!client) return NextResponse.json({ error: "client not found" }, { status: 404 });
  const c = client as unknown as ClientRow;
  if (!c.email) return NextResponse.json({ error: "client has no email address" }, { status: 400 });

  // Ensure an onboarding pipeline exists so progress is tracked per client.
  const { data: existing } = await sb
    .from("onboarding_pipeline")
    .select("id")
    .eq("client_id", c.id)
    .maybeSingle();

  let pipelineId = existing?.id || null;
  if (!pipelineId) {
    const { data: created, error: pipeErr } = await sb
      .from("onboarding_pipeline")
      .insert({ client_id: c.id, current_stage: "welcome", stage_status: "in_progress" })
      .select("id")
      .single();
    if (pipeErr) return NextResponse.json({ error: pipeErr.message }, { status: 500 });
    pipelineId = created.id;
    await sb.from("clients").update({ onboarding_status: "in_progress", onboarding_started_at: new Date().toISOString() }).eq("id", c.id);
  }

  const firstName = (c.contact_name || "").split(" ")[0] || "there";
  let sent = false;

  if (kind === "welcome") {
    const { subject, html, text } = buildWelcomeEmail({
      firstName,
      businessName: c.company_name || "your business",
      automationsPurchased: [],
    });
    sent = await sendEmail(c.email, subject, html, text);
    if (sent) {
      await sb.from("onboarding_pipeline").update({
        welcome_email_sent: true,
        welcome_email_sent_at: new Date().toISOString(),
      }).eq("id", pipelineId);
    }
  } else {
    const { subject, html, text } = buildCompletionEmail({
      firstName,
      automationName: typeof body.automationName === "string" ? body.automationName : "Your ELION automation",
      connectedSystems: Array.isArray(body.connectedSystems)
        ? body.connectedSystems.filter((s): s is string => typeof s === "string")
        : ["Email"],
      workflowDescription: typeof body.workflowDescription === "string"
        ? body.workflowDescription
        : "Automated workflow built and configured for your business.",
    });
    sent = await sendEmail(c.email, subject, html, text);
    if (sent) {
      await sb.from("onboarding_pipeline").update({
        completion_email_sent: true,
        completion_email_sent_at: new Date().toISOString(),
      }).eq("id", pipelineId);
    }
  }

  // Log it — unread admin notification so it shows up in the dashboard feed.
  if (sent) {
    await sb.from("notifications").insert({
      type: "onboarding_email_sent",
      title: `${kind === "welcome" ? "Welcome email" : "Completion email"} sent — ${c.company_name || c.contact_name}`,
      message: `Onboarding ${kind === "welcome" ? "welcome" : "completion"} email sent to ${c.email}`,
      client_id: c.id,
      metadata: { kind, pipeline_id: pipelineId },
    });
  }

  return NextResponse.json({
    ok: true,
    sent,
    kind,
    pipeline_id: pipelineId,
    client: c.company_name || c.contact_name,
    email: c.email,
  });
}
