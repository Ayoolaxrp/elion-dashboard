import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  // Client-facing onboarding: reached via the client's unique onboarding link.
  // Returns only the fields the onboarding form needs. POST is likewise unauthenticated.
  const supabase = getSupabase();

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, company_name, contact_name, email, industry, website, phone, plan_name, onboarding_status, onboarding_notes, onboarding_form_data, created_at")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Purchased automations decide which configuration sections this client sees.
  const { data: automations } = await supabase
    .from("client_automations")
    .select("id, status, custom_name, workflow_templates(name, slug, category, description)")
    .eq("client_id", clientId);

  return NextResponse.json({ client, automations: automations || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const body = await request.json();
  const supabase = getSupabase();

  // Verify client exists
  const { data: client, error: fetchErr } = await supabase
    .from("clients")
    .select("id, company_name, onboarding_status")
    .eq("id", clientId)
    .single();

  if (fetchErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Save onboarding form data
  const formData = {
    // Step 1: Business info
    business_name: body.business_name || "",
    industry: body.industry || "",
    website: body.website || "",
    timezone: body.timezone || "Africa/Lagos",
    
    // Step 2: Team
    primary_contact_name: body.primary_contact_name || "",
    primary_contact_email: body.primary_contact_email || "",
    primary_contact_phone: body.primary_contact_phone || "",
    primary_contact_role: body.primary_contact_role || "",
    secondary_contact_name: body.secondary_contact_name || "",
    secondary_contact_email: body.secondary_contact_email || "",
    
    // Step 3: Integrations
    whatsapp_number: body.whatsapp_number || "",
    whatsapp_provider: body.whatsapp_provider || "",
    email_smtp: body.email_smtp || "",
    calendar_provider: body.calendar_provider || "",
    calendar_url: body.calendar_url || "",
    crm_tool: body.crm_tool || "",
    
    // Step 4: Preferences
    working_hours_start: body.working_hours_start || "09:00",
    working_hours_end: body.working_hours_end || "17:00",
    working_days: body.working_days || ["mon", "tue", "wed", "thu", "fri"],
    response_speed: body.response_speed || "instant",
    follow_up_1_hours: body.follow_up_1_hours || 4,
    follow_up_2_hours: body.follow_up_2_hours || 24,
    follow_up_3_hours: body.follow_up_3_hours || 72,
    greeting_message: body.greeting_message || "",
    
    // Step 5: Additional
    team_size: body.team_size || "",
    current_tools: body.current_tools || "",
    biggest_challenge: body.biggest_challenge || "",
    additional_notes: body.additional_notes || "",

    // AI systems configuration (only present when the client purchased them)
    agent_receptionist: body.agent_receptionist || null,
    agent_sales: body.agent_sales || null,
    
    // Metadata
    submitted_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from("clients")
    .update({
      onboarding_form_data: formData,
      onboarding_status: "in_review",
      // Update company details from form (never overwrite the client name
      // with a status string when the form's business name is blank)
      company_name: formData.business_name || client.company_name || "",
      industry: formData.industry,
      website: formData.website,
      phone: formData.primary_contact_phone,
    })
    .eq("id", clientId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Merge client-provided agent configuration into the matching automation
  // rows so deployed agents actually run on the client's answers. Each block
  // is stored namespaced on the automation's custom_config (receptionist /
  // sales) and never clobbers the admin-set operational fields above it. If
  // the automation row does not exist yet (admin deploy is yet to run), the
  // config stays in onboarding_form_data until the deploy happens.
  if (body.agent_receptionist || body.agent_sales) {
    const { data: automations } = await supabase
      .from("client_automations")
      .select("id, custom_config, workflow_templates(slug)")
      .eq("client_id", clientId);

    for (const a of automations || []) {
      // REST may return the joined template as an object (FK) or an array
      const wt = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
      const slug = wt?.slug;
      if (!slug) continue;
      if (slug === "ai_receptionist" && body.agent_receptionist) {
        await supabase
          .from("client_automations")
          .update({ custom_config: { ...(a.custom_config || {}), receptionist: body.agent_receptionist } })
          .eq("id", a.id);
      }
      if (slug === "ai_sales_agent" && body.agent_sales) {
        await supabase
          .from("client_automations")
          .update({ custom_config: { ...(a.custom_config || {}), sales: body.agent_sales } })
          .eq("id", a.id);
      }
    }
  }

  return NextResponse.json({ success: true, status: "in_review" });
}
