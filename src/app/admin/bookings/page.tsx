"use client";
import { useCallback, useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  Calendar, CalendarDays, CheckCircle2, Link2, Loader2, Save, Video, X, AlertTriangle, ExternalLink,
} from "lucide-react";

interface BookingRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  timezone: string;
  start_at: string;
  end_at: string;
  status: string;
  calendar_event_id: string | null;
  google_meet_url: string | null;
  notes: string | null;
  created_at: string;
  cancellation_reason?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  confirmed: "text-green-400 bg-green-400/10 border-green-400/20",
  rescheduled: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  completed: "text-gray-300 bg-gray-400/10 border-gray-400/20",
  no_show: "text-red-400 bg-red-400/10 border-red-400/20",
};

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<string, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const inputCls = "w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40";

export default function AdminBookingsPage() {
  const [conn, setConn] = useState<{ configured: boolean; connected: boolean; account_email: string | null } | null>(null);
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [recent, setRecent] = useState<BookingRow[]>([]);
  const [cfg, setCfg] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [br, sr] = await Promise.all([
        fetch("/api/admin/bookings").then((r) => r.json()),
        fetch("/api/admin/bookings/settings").then((r) => r.json()),
      ]);
      setConn(br.connection || null);
      setUpcoming(br.upcoming || []);
      setRecent(br.recent || []);
      if (sr.config) { setCfg(sr.config); setForm(JSON.parse(JSON.stringify(sr.config))); }
    } catch {
      setError("Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const p = new URLSearchParams(window.location.search).get("connected");
    if (p) {
      setQ(p === "success" ? "Google Calendar connected successfully." : p === "denied" ? "Google connection cancelled." : p === "not_configured" ? "Google OAuth is not configured yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)." : "Google connection failed. Please try again.");
      window.history.replaceState({}, "", "/admin/bookings");
    }
  }, [load]);

  async function saveSettings() {
    setSaving(true);
    setSavedMsg("");
    try {
      const r = await fetch("/api/admin/bookings/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (r.ok && d.success) { setCfg(d.config); setForm(JSON.parse(JSON.stringify(d.config))); setSavedMsg("Booking settings saved."); }
      else setError(d.error || "Could not save settings.");
    } catch {
      setError("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking(id: string) {
    if (!confirm("Cancel this booking and remove its calendar event?")) return;
    const r = await fetch(`/api/bookings/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Cancelled by ELION admin" }) });
    if (r.ok) { setQ("Booking cancelled."); load(); }
    else setError("Could not cancel booking.");
  }

  const fmtWhen = (iso: string, tz: string) => {
    const d = new Date(iso);
    const local = new Date(d.toLocaleString("en-US", { timeZone: tz || "UTC" }));
    return local.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Bookings</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Strategy calls scheduled on the ELION Google Calendar with Google Meet.</p>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">{upcoming.length} upcoming</span>
          </div>

          {q && (
            <div className="mb-6 flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/25">
              <p className="text-sm text-[var(--color-success)] flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> {q}</p>
              <button onClick={() => setQ(null)} aria-label="Dismiss" className="text-[var(--color-success)] hover:opacity-70 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          )}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/25">
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          {/* Connection */}
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-[var(--color-accent)]" /></div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Google Calendar</p>
                  {loading ? (
                    <p className="text-xs text-[var(--color-text-muted)]"><Loader2 className="w-3 h-3 inline animate-spin mr-1" />Checking…</p>
                  ) : !conn ? (
                    <p className="text-xs text-[var(--color-error)]">Could not read connection state.</p>
                  ) : !conn.configured ? (
                    <p className="text-xs text-[var(--color-warning)] flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to connect the calendar.</p>
                  ) : conn.connected ? (
                    <p className="text-xs text-[var(--color-success)] flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Connected{conn.account_email ? ` as ${conn.account_email}` : ""} · live availability + Meet creation active</p>
                  ) : (
                    <p className="text-xs text-[var(--color-warning)]">Configured but not connected — availability is paused until the calendar is linked.</p>
                  )}
                </div>
              </div>
              {conn?.configured && !conn.connected && (
                <a href="/api/bookings/oauth" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                  <Link2 className="w-4 h-4" /> Connect Google Calendar
                </a>
              )}
            </div>
            {!conn?.configured && (
              <p className="mt-3 text-xs text-[var(--color-text-muted)] leading-relaxed border-t border-[var(--color-border)]/50 pt-3">
                Required server-side environment variables: <code className="text-[var(--color-accent)]">GOOGLE_CLIENT_ID</code>, <code className="text-[var(--color-accent)]">GOOGLE_CLIENT_SECRET</code>, and redirect URI <code className="text-[var(--color-accent)]">{`{site}/api/bookings/oauth/callback`}</code> (add it as an authorized redirect in Google Cloud Console).
              </p>
            )}
          </div>

          {/* Upcoming */}
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5 mb-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[var(--color-accent)]" /> Upcoming calls</h2>
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-[var(--color-accent)] animate-spin" /></div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No upcoming bookings</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Once the calendar is connected, confirmed calls appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{b.customer_name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{b.customer_email}{b.customer_phone ? ` · ${b.customer_phone}` : ""}</p>
                      {b.notes && <p className="text-[11px] text-[var(--color-text-muted)] mt-1 line-clamp-1">{b.notes}</p>}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{fmtWhen(b.start_at, b.timezone)}</div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>{b.status}</span>
                    <div className="flex items-center gap-1.5">
                      {b.google_meet_url && (
                        <a href={b.google_meet_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-success)] transition-colors" aria-label="Open Meet link"><Video className="w-3.5 h-3.5" /></a>
                      )}
                      {["pending", "confirmed", "rescheduled"].includes(b.status) && (
                        <button onClick={() => cancelBooking(b.id)} className="p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors cursor-pointer" aria-label="Cancel booking"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5 mb-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[var(--color-accent)]" /> Availability settings</h2>
            {form && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Call title</label>
                  <input className={inputCls} value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Timezone</label>
                  <input className={inputCls} value={form.timezone || ""} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Working hours</label>
                  <div className="flex items-center gap-2">
                    <input type="time" className={inputCls} value={form.working_hours?.start || "09:00"} onChange={(e) => setForm({ ...form, working_hours: { ...form.working_hours, start: e.target.value } })} />
                    <span className="text-xs text-[var(--color-text-muted)]">to</span>
                    <input type="time" className={inputCls} value={form.working_hours?.end || "17:00"} onChange={(e) => setForm({ ...form, working_hours: { ...form.working_hours, end: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Days</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => { const days = form.working_hours?.days || []; const next = days.includes(d) ? days.filter((x: string) => x !== d) : [...days, d]; setForm({ ...form, working_hours: { ...form.working_hours, days: next } }); }} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${(form.working_hours?.days || []).includes(d) ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"}`}>{DAY_LABEL[d]}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Duration (min)</label>
                  <input type="number" min={15} step={15} className={inputCls} value={form.duration_min ?? 30} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 30 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Buffer between calls (min)</label>
                  <input type="number" min={0} step={5} className={inputCls} value={form.buffer_min ?? 15} onChange={(e) => setForm({ ...form, buffer_min: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Minimum notice (min)</label>
                  <input type="number" min={0} className={inputCls} value={form.min_notice_min ?? 120} onChange={(e) => setForm({ ...form, min_notice_min: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Booking window (days)</label>
                  <input type="number" min={1} max={60} className={inputCls} value={form.max_window_days ?? 30} onChange={(e) => setForm({ ...form, max_window_days: parseInt(e.target.value) || 30 })} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mt-5">
              <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings
              </button>
              {savedMsg && <p className="text-xs text-[var(--color-success)]">{savedMsg}</p>}
            </div>
          </div>

          {/* Recent */}
          {recent.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Recent activity</h2>
              <div className="space-y-2">
                {recent.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">{b.customer_name} · {fmtWhen(b.start_at, b.timezone)}</p>
                      {b.cancellation_reason && <p className="text-[11px] text-[var(--color-text-muted)]">{b.cancellation_reason}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>{b.status}</span>
                    {b.google_meet_url && <a href={b.google_meet_url} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] hover:text-[var(--color-success)]" aria-label="Meet link"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
