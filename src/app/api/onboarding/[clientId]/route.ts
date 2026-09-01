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
  const supabase = getSupabase();

  const { data: client, error } = await supabase
    .from("clients")
    .select("id, company_name, contact_name, email, industry, website, phone, plan_name, onboarding_status, onboarding_notes, onboarding_form_data, created_at")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json({ client });
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
    .select("id, onboarding_status")
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
    
    // Metadata
    submitted_at: new Date().toISOString(),
  };

  const { error: updateErr } = await supabase
    .from("clients")
    .update({
      onboarding_form_data: formData,
      onboarding_status: "in_review",
      // Update company details from form
      company_name: formData.business_name || client.onboarding_status,
      industry: formData.industry,
      website: formData.website,
      phone: formData.primary_contact_phone,
    })
    .eq("id", clientId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "in_review" });
}
