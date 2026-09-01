import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();

  // Last 30 days of events
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_type, created_at, metadata, session_id")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  if (!events) {
    return NextResponse.json({ events: [], summary: {} });
  }

  // Event type counts
  const eventCounts: Record<string, number> = {};
  events.forEach((e) => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });

  // Events by day
  const eventsByDay: Record<string, Record<string, number>> = {};
  events.forEach((e) => {
    const day = e.created_at.split("T")[0];
    if (!eventsByDay[day]) eventsByDay[day] = {};
    eventsByDay[day][e.event_type] = (eventsByDay[day][e.event_type] || 0) + 1;
  });

  // Conversion funnel
  const funnelSteps = [
    "page_view",
    "funnel_started",
    "funnel_step_1",
    "funnel_step_2",
    "funnel_step_3",
    "funnel_step_4",
    "funnel_step_5",
    "funnel_completed",
    "audit_submitted",
    "demo_run",
    "pricing_viewed",
  ];

  const funnel = funnelSteps.map((step) => ({
    step,
    count: eventCounts[step] || 0,
  }));

  // Hourly distribution (for peak hours insight)
  const hourlyDist: Record<string, number> = {};
  events.forEach((e) => {
    const hour = new Date(e.created_at).getHours();
    hourlyDist[hour] = (hourlyDist[hour] || 0) + 1;
  });

  // Source breakdown
  const sources: Record<string, number> = {};
  events.forEach((e) => {
    const source = e.metadata?.source || "direct";
    sources[source] = (sources[source] || 0) + 1;
  });

  // Total unique sessions
  const uniqueSessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size;

  // Today's events
  const today = new Date().toISOString().split("T")[0];
  const todayStart = today + "T00:00:00Z";
  const todayEvents = events.filter((e) => e.created_at >= todayStart);

  return NextResponse.json({
    totalEvents: events.length,
    todayEvents: todayEvents.length,
    uniqueSessions,
    eventCounts,
    eventsByDay,
    funnel,
    hourlyDist,
    sources,
    events: events.slice(-100), // last 100 events
  });
}
