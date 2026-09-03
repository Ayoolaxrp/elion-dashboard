"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Circle, Clock,
  Loader2, ShieldCheck, Wifi, WifiOff, PlugZap, Zap, RefreshCw, Calendar, Mail,
} from "lucide-react";

// ------------------------------------------------------------------
// Client dashboard — built around outcomes, not vanity numbers.
// Every figure comes from /api/client/overview, which derives real rows
// only. When there is no real data the page says "No activity yet" —
// ELION never fabricates metrics or health.
// ------------------------------------------------------------------

type Health = { level: "healthy" | "degraded" | "attention" | "paused" | "setup" | "offline"; label: string; reason?: string };
interface AutomationView { id: string; name: string; status: string; health: Health; total_runs: number; last_run_at: string | null; success_rate: number | null; template: { name: string; slug: string; category: string } | null }
interface IntegrationView { type: string; label: string; status: string; health: string | null; last_verified_at: string | null }
interface ActivityView { id: number; at: string; text: string; tone: "ok" | "warn" | "neutral" }
interface AttentionItem { kind: string; title: string; message: string; action: string; href: string }
interface Overview {
  client: { company_name: string; contact_name: string; onboarding_status: string } | null;
  automations: AutomationView[];
  integrations: IntegrationView[];
  activity: ActivityView[];
  outcomes: { hasData: boolean; counts: { key: string; label: string; count: number }[]; executions: { ok: number; failed: number } } | null;
  needsAttention: AttentionItem[];
}

const HEALTH_DOT: Record<Health["level"], { color: string; pulse?: boolean; bg: string }> = {
  healthy: { color: "bg-emerald-400", pulse: true, bg: "bg-emerald-400/10" },
  degraded: { color: "bg-amber-400", bg: "bg-amber-400/10" },
  attention: { color: "bg-red-400", bg: "bg-red-400/10" },
  paused: { color: "bg-gray-400", bg: "bg-gray-400/10" },
  setup: { color: "bg-blue-400", pulse: true, bg: "bg-blue-400/10" },
  offline: { color: "bg-red-400", bg: "bg-red-400/10" },
};

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " + new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { setLoading(false); return; }
        const me = await meRes.json();
        if (me.isSuperAdmin || me.isAdmin) { window.location.href = "/admin"; return; }
        if (!me.isClient || !me.organizationId) { setLoading(false); return; }
        const res = await fetch("/api/client/overview");
        if (!res.ok) { setError("We couldn't load your dashboard right now. Please refresh."); setLoading(false); return; }
        const json = await res.json();
        setData(json);
      } catch {
        setError("We couldn't load your dashboard right now. Please refresh.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium cursor-pointer">Try again</button>
        </div>
      </div>
    );
  }

  const client = data?.client;
  const automations = data?.automations || [];
  const attention = data?.needsAttention || [];
  const integrations = data?.integrations || [];
  const activity = data?.activity || [];
  const outcomes = data?.outcomes;

  const hasLive = automations.some((a) => a.status === "live");
  const statusLine = attention.length > 0
    ? (attention[0].kind === "setup" && !hasLive ? "Your ELION systems are being set up." : "Some systems need your attention.")
    : hasLive
      ? "All systems operational."
      : "Your ELION systems are being set up.";

  const outcomeIcons: Record<string, typeof Zap> = { leads: Zap, responses: Mail, follow_ups: RefreshCw, bookings: Calendar, recoveries: CheckCircle2 };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="p-5 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-[0.18em] mb-1">Client dashboard</p>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
              {client?.company_name || "Your Dashboard"}
            </h1>
            <p className={`text-sm mt-1 inline-flex items-center gap-1.5 ${attention.length > 0 ? "text-amber-400" : hasLive ? "text-emerald-400" : "text-[var(--color-text-muted)]"}`}>
              {attention.length > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
              {hasLive && attention.length === 0 && <CheckCircle2 className="w-3.5 h-3.5" />}
              {statusLine}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/dashboard/onboarding" className="px-3 py-1.5 rounded-lg border border-[var(--color-border)]/60 text-[var(--color-text-secondary)] hover:border-[var(--color-border)] transition-colors">Onboarding</Link>
          </div>
        </div>

        {/* Needs attention */}
        {attention.length > 0 ? (
          <section className="mb-8" aria-label="What needs your attention">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Needs your attention</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">{attention.length}</span>
            </div>
            <div className="space-y-2">
              {attention.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-amber-400/15">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{item.message}</p>
                  </div>
                  <Link href={item.href} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold shrink-0 hover:opacity-90 transition-opacity">
                    {item.action} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-emerald-400/15">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-[var(--color-text-primary)]">Nothing needs your attention right now.</p>
            </div>
          </section>
        )}

        {/* Outcomes */}
        {outcomes?.hasData ? (
          <section className="mb-8" aria-label="Results">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {outcomes.counts.map((c) => {
                const Icon = outcomeIcons[c.key] || Zap;
                return (
                  <div key={c.key} className="bg-[var(--color-surface-raised)] rounded-xl p-4 border border-[var(--color-border)]/60">
                    <Icon className="w-4 h-4 text-[var(--color-accent)] mb-2" />
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{c.count}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{c.label}</p>
                  </div>
                );
              })}
              <div className="bg-[var(--color-surface-raised)] rounded-xl p-4 border border-[var(--color-border)]/60">
                <Activity className="w-4 h-4 text-emerald-400 mb-2" />
                <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                  {outcomes.executions.ok + outcomes.executions.failed}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Executions{outcomes.executions.failed > 0 ? ` · ${outcomes.executions.failed} failed` : " · no failures"}
                </p>
              </div>
            </div>
          </section>
        ) : automations.length > 0 ? (
          <section className="mb-8">
            <div className="p-6 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 text-center">
              <div className="w-11 h-11 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/60 flex items-center justify-center mx-auto mb-3">
                <Activity className="w-5 h-5 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">No activity yet</h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto leading-relaxed">
                Once your systems start processing real leads, their results will appear here. ELION only reports real activity — never estimates.
              </p>
            </div>
          </section>
        ) : null}

        {/* Systems & health */}
        {automations.length > 0 && (
          <section className="mb-8" aria-label="Your systems">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Your systems</h2>
              <Link href="/dashboard/onboarding" className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1">View onboarding <ChevronRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-2">
              {automations.map((a) => {
                const dot = HEALTH_DOT[a.health.level] || HEALTH_DOT.setup;
                return (
                  <div key={a.id} className={`flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border ${a.health.level === "healthy" ? "border-emerald-400/10" : a.health.level === "setup" ? "border-[var(--color-border)]/40" : "border-amber-400/15"}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${dot.bg} shrink-0`}>
                      <Zap className={`w-4 h-4 ${a.health.level === "healthy" ? "text-emerald-400" : a.health.level === "setup" ? "text-blue-400" : a.health.level === "paused" ? "text-gray-400" : "text-amber-400"}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{a.name}</p>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${a.health.level === "healthy" ? "text-emerald-400" : a.health.level === "setup" ? "text-blue-400" : a.health.level === "paused" ? "text-gray-400" : "text-amber-400"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dot.color} ${dot.pulse ? "animate-pulse" : ""}`} />
                          {a.health.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                        {a.health.reason || (a.template?.name || "Automation")}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        {a.total_runs > 0
                          ? `${a.total_runs} run${a.total_runs === 1 ? "" : "s"}${a.last_run_at ? ` · last ${timeAgo(a.last_run_at)}` : ""}`
                          : a.status === "live" ? "Live · no executions yet" : "No executions yet"}
                      </p>
                    </div>
                    {a.health.reason && a.health.level !== "healthy" && (
                      <Link href="/dashboard/onboarding" className="text-[11px] text-[var(--color-accent)] hover:underline shrink-0">View details</Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Connections */}
        {integrations.length > 0 && (
          <section className="mb-8" aria-label="Connections">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Connections</h2>
            <div className="flex flex-wrap gap-2">
              {integrations.map((i) => {
                const ok = i.status === "connected" || i.status === "active";
                const bad = i.status === "error" || i.status === "disconnected" || i.status === "expired" || i.status === "failed";
                return (
                  <div key={i.type} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${ok ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-400" : bad ? "border-red-400/20 bg-red-400/5 text-red-400" : "border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"}`}>
                    {ok ? <Wifi className="w-3.5 h-3.5" /> : bad ? <WifiOff className="w-3.5 h-3.5" /> : <PlugZap className="w-3.5 h-3.5" />}
                    <span className="font-medium">{i.label}</span>
                    <span className="opacity-80">{ok ? "Connected" : bad ? "Needs attention" : i.status === "not_configured" ? "Not connected" : "Checking"}</span>
                    {i.last_verified_at && <span className="text-[10px] opacity-60">· checked {timeAgo(i.last_verified_at)}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent activity */}
        {activity.length > 0 ? (
          <section aria-label="Recent activity">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Recent activity</h2>
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl divide-y divide-[var(--color-border)]/30">
              {activity.slice(0, 8).map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.tone === "ok" ? "bg-emerald-400" : row.tone === "warn" ? "bg-amber-400" : "bg-[var(--color-text-muted)]"}`} />
                  <p className="text-xs text-[var(--color-text-primary)] flex-1 min-w-0 truncate">{row.text}</p>
                  <time className="text-[10px] text-[var(--color-text-muted)] shrink-0" dateTime={row.at}>{dayLabel(row.at)}</time>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Empty state — no systems at all */}
        {automations.length === 0 && (
          <div className="p-10 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
              <Circle className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Your systems are on their way</h2>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mb-5 leading-relaxed">
              Once ELION deploys your automations, they'll appear here with real status, health and results.
            </p>
            <Link href="/dashboard/onboarding" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              View onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
