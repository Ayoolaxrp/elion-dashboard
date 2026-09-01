"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, Eye, MousePointerClick, ArrowLeft, Loader2 } from "lucide-react";
export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/admin/analytics").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>;
  if (!data) return <div className="max-w-5xl mx-auto p-6"><p className="text-[var(--color-text-muted)]">Failed to load analytics.</p></div>;
  const maxFunnel = Math.max(...(data.funnel || []).map((f: any) => f.count), 1);
  const LABELS: Record<string, string> = { page_view: "Page Views", funnel_started: "Funnel Started", funnel_step_1: "Step 1: Business Type", funnel_step_2: "Step 2: Problem", funnel_step_3: "Step 3: Channels", funnel_step_4: "Step 4: Team Size", funnel_step_5: "Step 5: Website", funnel_completed: "Funnel Completed", audit_submitted: "Audit Submitted", demo_run: "Demo Run", pricing_viewed: "Pricing Viewed" };
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
        <div><h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Analytics</h1><p className="text-sm text-[var(--color-text-muted)]">Conversion tracking and visitor insights</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard icon="eye" label="Total Events" value={String(data.totalEvents || 0)} sub="Last 30 days" />
        <MetricCard icon="bar" label="Today" value={String(data.todayEvents || 0)} sub="Events today" />
        <MetricCard icon="users" label="Sessions" value={String(data.uniqueSessions || 0)} sub="Distinct visitors" />
        <MetricCard icon="click" label="Demo Runs" value={String((data.eventCounts || {}).demo_run || 0)} sub="Interactive demos" />
      </div>
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
          Conversion Funnel
        </h2>
        <div className="space-y-2">
          {(data.funnel || []).map((step: any) => {
            const pct = maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0;
            return (
              <div key={step.step} className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-muted)] w-40 shrink-0 truncate">{LABELS[step.step] || step.step}</span>
                <div className="flex-1 h-6 rounded-md bg-[var(--color-surface)] overflow-hidden">
                  <div className="h-full rounded-md transition-all duration-500" style={{ width: Math.max(pct, 2) + "%", backgroundColor: "var(--color-accent)", opacity: 0.7 }} />
                </div>
                <span className="text-xs font-mono text-[var(--color-text-secondary)] w-12 text-right">{step.count}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Traffic Sources</h2>
          {Object.keys(data.sources || {}).length === 0 ? <p className="text-xs text-[var(--color-text-muted)]">No traffic data yet.</p> : (
            <div className="space-y-2">
              {Object.entries(data.sources || {}).sort(([, a]: any, [, b]: any) => b - a).map(([source, count]: any) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{source}</span>
                  <span className="font-mono text-[var(--color-text-muted)]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Activity by Hour (WAT)</h2>
          <div className="flex items-end gap-1 h-32">
            {Array.from({ length: 24 }, (_, i) => {
              const count = (data.hourlyDist || {})[String(i)] || 0;
              const maxH = Math.max(...Object.values(data.hourlyDist || {}).map(Number), 1);
              const h = Math.max((count / maxH) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={i + ":00 - " + count}>
                  <div className="w-full rounded-t transition-all duration-300" style={{ height: h + "%", backgroundColor: "var(--color-accent)", opacity: 0.6 }} />
                  {i % 6 === 0 && <span className="text-[8px] text-[var(--color-text-muted)]">{i}h</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Events</h2>
        </div>
        {(data.events || []).length === 0 ? (
          <div className="px-5 py-8 text-center"><p className="text-sm text-[var(--color-text-muted)]">No events yet.</p></div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {(data.events || []).slice(-20).reverse().map((event: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: "rgba(79,124,255,0.1)", color: "var(--color-accent)" }}>{event.event_type}</span>
                  {event.metadata?.page && <span className="text-xs text-[var(--color-text-muted)]">{String(event.metadata.page)}</span>}
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">{new Date(event.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function MetricCard({ label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
      <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{value}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{sub}</p>
    </div>
  );
}
