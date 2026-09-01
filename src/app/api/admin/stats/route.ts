import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function GET() {
  const supabase = getSupabase();

  const [clientsRes, leadsRes, automationsRes] = await Promise.all([
    supabase.from("clients").select("id, status", { count: "exact" }),
    supabase.from("leads").select("id, name, email, source, created_at, status").order("created_at", { ascending: false }).limit(5),
    supabase.from("client_automations").select("id, status"),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const { count: todayLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", today);

  return NextResponse.json({
    totalClients: clientsRes.count || 0,
    activeClients: clientsRes.data?.filter((c) => c.status === "active").length || 0,
    totalLeads: leadsRes.data?.length || 0,
    todayLeads: todayLeads || 0,
    totalAutomations: automationsRes.data?.length || 0,
    activeAutomations: automationsRes.data?.filter((a) => a.status === "live").length || 0,
    recentLeads: leadsRes.data || [],
  });
}
