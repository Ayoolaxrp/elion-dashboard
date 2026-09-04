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
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!user || !adminEmails.includes((user.email || "").toLowerCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the client row separately from its 1-to-many children: a nested
  // select with .single() fails PostgREST's single-object coercion as soon as
  // the client has more than one automation/integration/metric row.
  const { data: client, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const [autos, ints, metrics] = await Promise.all([
    supabase
      .from("client_automations")
      .select("id, status, custom_name, custom_config, last_run_at, total_runs, success_rate, deployed_at, workflow_templates(name, slug, category, description, value_proposition)")
      .eq("client_id", id),
    supabase.from("client_integrations").select("integration_type, provider, status, last_verified_at").eq("client_id", id),
    supabase.from("client_metrics").select("metric_type, period_start, leads_captured, leads_qualified, leads_responded, avg_response_time_seconds, followups_sent, bookings_created, conversion_rate").eq("client_id", id),
  ]);

  return NextResponse.json({
    client: {
      ...client,
      client_automations: autos.data || [],
      client_integrations: ints.data || [],
      client_metrics: metrics.data || [],
    },
  });
}
