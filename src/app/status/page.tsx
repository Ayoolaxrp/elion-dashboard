export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    return admins.includes((user.email || "").toLowerCase());
  } catch { return false; }
}

type StatusVal = "operational" | "degraded" | "partial-outage" | "major-outage" | "maintenance" | "not-configured";
type PhaseVal = "investigating" | "identified" | "monitoring" | "resolved";

const STATUS_META: Record<StatusVal, { label: string; dot: string; text: string; bar: string }> = {
  operational: { label: "Operational", dot: "bg-emerald-500", text: "text-emerald-400", bar: "bg-emerald-500" },
  degraded: { label: "Degraded Performance", dot: "bg-amber-400", text: "text-amber-400", bar: "bg-amber-400" },
  "partial-outage": { label: "Partial Outage", dot: "bg-orange-500", text: "text-orange-400", bar: "bg-orange-500" },
  "major-outage": { label: "Major Outage", dot: "bg-red-500", text: "text-red-400", bar: "bg-red-500" },
  maintenance: { label: "Maintenance", dot: "bg-blue-500", text: "text-blue-400", bar: "bg-blue-500" },
  "not-configured": { label: "Not Configured", dot: "bg-zinc-600", text: "text-zinc-500", bar: "bg-zinc-700" },
};

const PHASE_META: Record<PhaseVal, { label: string; cls: string }> = {
  investigating: { label: "Investigating", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  identified: { label: "Identified", cls: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  monitoring: { label: "Monitoring", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  resolved: { label: "Resolved", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
};

interface Component { id: string; component_name: string; status: StatusVal; note: string | null; created_at: string }
interface Snapshot { component_id: string; date: string; worst_status: StatusVal }
interface UpdateRow { id: string; incident_id: string; status: PhaseVal; message: string | null; created_at: string }
interface Incident { id: string; title: string; status: string; message: string | null; components_affected: string[] | null; created_at: string; resolved_at: string | null; updates: UpdateRow[] }

const client = () =>
  createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

function worstOf(statuses: StatusVal[]): { value: StatusVal; label: string } {
  const rank: Record<StatusVal, number> = { "major-outage": 5, "partial-outage": 4, degraded: 3, maintenance: 2, operational: 1, "not-configured": 0 };
  const worst = statuses.sort((a, b) => rank[b] - rank[a])[0];
  if (!worst) return { value: "operational", label: "All Systems Operational" };
  if (worst === "major-outage") return { value: "major-outage", label: "Major Outage" };
  if (worst === "partial-outage") return { value: "partial-outage", label: "Partial Outage" };
  if (worst === "degraded") return { value: "degraded", label: "Degraded Performance" };
  if (worst === "maintenance") return { value: "maintenance", label: "Maintenance" };
  return { value: "operational", label: "All Systems Operational" };
}

export default async function StatusPage() {
  const admin = await isAdmin();
  const sb = client();

  // Public view: ONLY deliberately public, configured components. Internal or
  // unconfigured infrastructure (n8n, WhatsApp, CRM, payments, etc.) is
  // excluded here — it lives in the admin view only.
  const { data: components } = await sb
    .from("system_status")
    .select("*")
    .eq("is_visible", true)
    .neq("status", "not-configured")
    .order("sort_order", { ascending: true });
  const comps = (components || []) as Component[];

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 31);
  const { data: snapRows } = await sb
    .from("status_daily_snapshots")
    .select("*")
    .gte("date", cutoff.toISOString().slice(0, 10));
  const snaps = (snapRows || []) as Snapshot[];

  const { data: incRows } = await sb
    .from("incidents")
    .select("*, incident_updates(*)")
    .order("created_at", { ascending: false })
    .limit(30);
  const incidents = ((incRows || []) as unknown as Incident[]).map((i) => ({
    ...i,
    updates: (i.updates || []).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
  }));

  const overall = worstOf(comps.map((c) => c.status));
  const overallMeta = STATUS_META[overall.value];
  const operationalCount = comps.filter((c) => c.status === "operational").length;

  // Uptime math from REAL snapshots only — days with no snapshot are "no data".
  const snapByComp = new Map<string, Map<string, StatusVal>>();
  for (const s of snaps) {
    if (!snapByComp.has(s.component_id)) snapByComp.set(s.component_id, new Map());
    snapByComp.get(s.component_id)!.set(s.date.slice(0, 10), s.worst_status);
  }

  // Build the 30-day window per component (oldest -> today).
  const days: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
  }
  const todayStr = now.toISOString().slice(0, 10);

  const trackingStart = snaps.length ? snaps.map((s) => s.date.slice(0, 10)).sort()[0] : todayStr;

  // Incident log grouped by date (Africa/Lagos), covering the tracked window.
  const dayLabel = (d: string) => {
    const date = new Date(d + "T12:00:00Z");
    const opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
    const inLagos = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "Africa/Lagos" }).format(date);
    return d === todayStr ? `${inLagos} (Today)` : inLagos;
  };
  const incByDay = new Map<string, Incident[]>();
  for (const i of incidents) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(i.created_at)).replace(/-/g, "-").split("/").reverse().join("-").replace(/\//g, "-");
    // en-CA yields YYYY-MM-DD already
    const k = key.replaceAll("/", "-");
    if (!incByDay.has(k)) incByDay.set(k, []);
    incByDay.get(k)!.push(i);
  }
  const windowStart = new Date(todayStr + "T00:00:00Z").getTime() - 6 * 86400000;
  const historyDays: { date: string; items: Incident[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(windowStart + i * 86400000).toISOString().slice(0, 10);
    if (d < trackingStart) continue; // don't imply we were tracking before we were
    historyDays.push({ date: d, items: incByDay.get(d) || [] });
  }
  historyDays.reverse();

  return (
    <div className="min-h-screen bg-[#0A0D14] text-[#E6E8EE]">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
            <Image src="/brand/elion-e-icon.svg" alt="" width={26} height={26} priority />
            <span className="font-bold tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION Status</span>
          </Link>
          {admin && (
            <Link href="/admin/status" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2A2F3E] text-xs text-[#9AA3B5] hover:border-[#3D4356] hover:text-[#E6E8EE] transition-all">
              Manage
            </Link>
          )}
        </header>

        {/* 1. Top status banner */}
        <div className="rounded-2xl border border-[#242938] bg-[#0E1320] p-6 sm:p-8 mb-10">
          <div className="flex items-center gap-4">
            <span className="relative flex w-3.5 h-3.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 ${overallMeta.dot}`} />
              <span className={`relative inline-flex rounded-full w-3.5 h-3.5 ${overallMeta.dot}`} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                {overall.label}
              </h1>
              <p className="text-xs text-[#9AA3B5] mt-1">
                {overall.value === "operational"
                  ? "All ELION services are running normally."
                  : `${comps.filter((c) => c.status !== "operational").length} of ${comps.length} services are currently ${overall.label.toLowerCase()}.`}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[#6B7385] mt-5 border-t border-[#242938] pt-4">
            {operationalCount} of {comps.length} services operational · Last checked{" "}
            {new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WAT
          </p>
        </div>

        {/* 2. Components + uptime bars */}
        <div className="space-y-3 mb-10">
          {comps.map((c) => {
            const meta = STATUS_META[c.status];
            const dayMap = snapByComp.get(c.id) || new Map<string, StatusVal>();
            const tracked = days.filter((d) => dayMap.has(d));
            const clean = tracked.filter((d) => dayMap.get(d) === "operational").length;
            const uptime = tracked.length ? Math.round((clean / tracked.length) * 100) : null;
            return (
              <div key={c.id} className="rounded-2xl border border-[#242938] bg-[#0E1320] p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-[#E6E8EE]">{c.component_name}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.text} bg-current/0 border border-current/20`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 flex gap-[3px]" role="img" aria-label={`30-day history for ${c.component_name}`}>
                    {days.map((d) => {
                      const st = dayMap.get(d);
                      return (
                        <span
                          key={d}
                          title={`${d}: ${st ? STATUS_META[st].label : "No data"}`}
                          className={`h-6 flex-1 rounded-[3px] ${st ? STATUS_META[st].bar : "bg-[#1A2030]"} ${st && st !== "operational" ? "opacity-90" : ""}`}
                        />
                      );
                    })}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#E6E8EE] tabular-nums">{uptime === null ? "—" : `${uptime}%`}</p>
                    <p className="text-[10px] text-[#6B7385]">{tracked.length} day{tracked.length === 1 ? "" : "s"} tracked</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Incident log — reverse chronological, clean days included */}
        <div className="mb-10">
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Incident history</h2>
          {historyDays.length === 0 ? (
            <p className="text-sm text-[#9AA3B5]">No incidents reported.</p>
          ) : (
            <div className="space-y-6">
              {historyDays.map(({ date, items }) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-[#9AA3B5] uppercase tracking-wider mb-2">{dayLabel(date)}</p>
                  {items.length === 0 ? (
                    <p className="text-sm text-[#6B7385] px-1">No incidents reported on this day.</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((inc) => (
                        <div key={inc.id} className="rounded-xl border border-[#242938] bg-[#0E1320] p-4">
                          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                            <p className="text-sm font-semibold text-[#E6E8EE]">{inc.title}</p>
                            {inc.components_affected && inc.components_affected.length > 0 && (
                              <span className="text-[10px] text-[#6B7385]">{inc.components_affected.join(", ")}</span>
                            )}
                          </div>
                          <div className="space-y-3 border-l border-[#2A2F3E] ml-2 pl-4">
                            {inc.updates.length === 0 ? (
                              <p className="text-xs text-[#6B7385]">{inc.message || "Investigating."}</p>
                            ) : (
                              inc.updates.map((u) => {
                                const pm = PHASE_META[u.status as PhaseVal] || PHASE_META.investigating;
                                return (
                                  <div key={u.id} className="relative">
                                    <span className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${STATUS_META[u.status === "resolved" ? "operational" : u.status === "monitoring" ? "maintenance" : u.status === "identified" ? "partial-outage" : "degraded"].dot}`} />
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${pm.cls}`}>{pm.label}</span>
                                      <time className="text-[10px] text-[#6B7385] tabular-nums">
                                        {new Date(u.created_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                      </time>
                                    </div>
                                    {u.message && <p className="text-xs text-[#9AA3B5] mt-1 leading-relaxed">{u.message}</p>}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Legend */}
        <div className="rounded-xl border border-[#242938] bg-[#0E1320] p-4 mb-10">
          <p className="text-[11px] font-semibold text-[#9AA3B5] uppercase tracking-wider mb-3">Legend</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(["operational", "degraded", "partial-outage", "major-outage", "maintenance"] as StatusVal[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_META[s].dot}`} />
                <span className="text-xs text-[#9AA3B5]">{STATUS_META[s].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-[#7A82FF] hover:text-[#9BA1FF] transition-colors">← Back to ELION</Link>
        </div>
      </div>
    </div>
  );
}
