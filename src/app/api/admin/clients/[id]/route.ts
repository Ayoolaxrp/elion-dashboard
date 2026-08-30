import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAILS) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("*, client_automations(id, status, custom_name, custom_config, last_run_at, total_runs, success_rate, deployed_at, workflow_templates(name, slug, category, description, value_proposition)), client_integrations(integration_type, provider, status, last_verified_at), client_metrics(metric_type, period_start, leads_captured, leads_qualified, leads_responded, avg_response_time_seconds, followups_sent, bookings_created, conversion_rate)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ client });
}
