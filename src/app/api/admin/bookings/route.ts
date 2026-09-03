import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getStoredTokens, googleConfigured, listConnectedCalendarKeys } from "@/lib/google-calendar";

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email || undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await getStoredTokens();
  const [upcoming, recent, bookingAutos, connectedKeys] = await Promise.all([
    sb
      .from("bookings")
      .select("*, clients(company_name)")
      .in("status", ["pending", "confirmed", "rescheduled"])
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(50),
    sb
      .from("bookings")
      .select("*, clients(company_name)")
      .order("created_at", { ascending: false })
      .limit(20),
    sb
      .from("client_automations")
      .select("id, client_id, custom_name, status, custom_config, clients(company_name), workflow_templates(slug)")
      .eq("workflow_templates.slug", "booking"),
    listConnectedCalendarKeys(),
  ]);

  // Per-client calendar connections: booking automations + which clients
  // have a Google token scope connected (values never leave the server).
  const connectedClientIds = new Set(
    connectedKeys
      .filter((k) => k.startsWith("google_tokens:"))
      .map((k) => k.slice("google_tokens:".length))
  );
  const clientCalendars = (bookingAutos.data || []).map((a: any) => {
    const wt = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
    const cfg = (a.custom_config || {}) as Record<string, unknown>;
    return {
      client_id: a.client_id,
      company_name: (Array.isArray(a.clients) ? a.clients[0] : a.clients)?.company_name || "Client",
      automation_status: a.status,
      connected: connectedClientIds.has(a.client_id),
      configured: googleConfigured(),
      duration: String(cfg.duration || ""),
      timezone: String(cfg.timezone || ""),
      working_hours: String(cfg.working_hours || ""),
      custom_name: a.custom_name || (wt?.slug === "booking" ? "Booking Automation" : a.custom_name),
    };
  });

  return NextResponse.json({
    connection: {
      configured: googleConfigured(),
      connected: Boolean(tokens),
      account_email: tokens?.account_email || null,
    },
    clientCalendars,
    upcoming: upcoming.data || [],
    recent: recent.data || [],
  });
}
