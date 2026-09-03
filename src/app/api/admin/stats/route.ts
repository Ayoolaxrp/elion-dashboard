import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Auth check: real session cookies so getUser() sees the login.
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes((user.email || '').toLowerCase())) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  // Data client: service role bypasses RLS.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [clientsRes, leadsRes, automationsRes] = await Promise.all([
    supabase.from("clients").select("id, status, plan_name", { count: "exact" }),
    supabase.from("leads").select("id, contact_name, email, source, created_at, lead_status, company_name").order("created_at", { ascending: false }).limit(50),
    supabase.from("client_automations").select("id, status"),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const todayStart = new Date(today + "T00:00:00Z").toISOString();

  const { count: todayLeads } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayStart);

  const { count: totalLeadsCount } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true });

  // Lead status breakdown
  const { data: statusBreakdown } = await supabase
    .from("leads")
    .select("lead_status")
    .then(({ data }) => {
      if (!data) return { data: null };
      const counts: Record<string, number> = {};
      data.forEach((l) => {
        counts[l.lead_status] = (counts[l.lead_status] || 0) + 1;
      });
      return { data: counts };
    });

  // Leads per day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: dailyLeads } = await supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  const leadsByDay: Record<string, number> = {};
  if (dailyLeads) {
    dailyLeads.forEach((l) => {
      const day = l.created_at.split("T")[0];
      leadsByDay[day] = (leadsByDay[day] || 0) + 1;
    });
  }

  // Revenue estimates
  const planRevenue: Record<string, number> = { starter: 100000, growth: 350000, scale: 750000, custom: 500000 };
  let totalRevenue = 0;
  let mrr = 0;
  const clients = clientsRes.data || [];
  clients.forEach((c) => {
    const plan = (c.plan_name || "").toLowerCase();
    const rev = planRevenue[plan] || 0;
    totalRevenue += rev;
    if (c.status === "active") mrr += rev;
  });

  // Recent leads with correct column name
  const recentLeads = (leadsRes.data || []).slice(0, 10).map((l) => ({
    id: l.id,
    name: l.contact_name,
    email: l.email,
    company: l.company_name,
    source: l.source,
    status: l.lead_status,
    created_at: l.created_at,
  }));

  return NextResponse.json({
    totalClients: clientsRes.count || 0,
    activeClients: clients.filter((c) => c.status === "active").length,
    totalLeads: totalLeadsCount || 0,
    todayLeads: todayLeads || 0,
    totalAutomations: automationsRes.data?.length || 0,
    activeAutomations: automationsRes.data?.filter((a) => a.status === "live").length || 0,
    recentLeads,
    statusBreakdown: statusBreakdown || {},
    leadsByDay,
    totalRevenue,
    mrr,
    conversionRate: totalLeadsCount && clientsRes.count ? Math.round((clientsRes.count / totalLeadsCount) * 100) : 0,
  });
}
