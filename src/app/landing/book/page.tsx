"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2,
  Video, AlertTriangle, ArrowRight, Calendar,
} from "lucide-react";

interface Slot { start: string; end: string; localTime: string; date: string; }
interface Availability {
  connected: boolean;
  reason?: string;
  account_email?: string | null;
  timezone: string;
  duration_min: number;
  config?: { title: string; duration_min: number; timezone: string };
  slots: Slot[];
}

const fmtDay = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function BookPage() {
  const [avail, setAvail] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ meet: string | null; start: string; end: string; timezone: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/bookings/availability?days=14");
      const d = await r.json();
      setAvail(d);
    } catch {
      setAvail({ connected: false, reason: "availability_error", timezone: "Africa/Lagos", duration_min: 30, slots: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of avail?.slots || []) {
      const arr = map.get(s.date) || [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [avail]);

  const [dayOffset, setDayOffset] = useState(0);
  useEffect(() => { setDayOffset(0); }, [selected?.date]);

  async function submit() {
    setError("");
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter your name and a valid email.");
      return;
    }
    if (!selected) return;
    setBusy(true);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_name: name.trim(), customer_email: email.trim(), customer_phone: phone.trim(), timezone: avail?.timezone || "Africa/Lagos", start: selected.start, notes: notes.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "We could not complete your booking.");
        if (d.code === "calendar_not_connected") { setSelected(null); await load(); }
        return;
      }
      setDone({ meet: d.booking.google_meet_url, start: d.booking.start_at, end: d.booking.end_at, timezone: d.booking.timezone });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ----- SUCCESS -----
  if (done) {
    const startD = new Date(done.start);
    const endD = new Date(done.end);
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Strategy call with ELION")}&dates=${startD.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endD.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}&details=${encodeURIComponent("Your ELION strategy call.")}`;
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Your call is booked.</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">A calendar event was created and a Google Meet link generated for your call.</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <CalendarDays className="w-4 h-4 text-[var(--color-accent)]" />
              {startD.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {startD.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}–{endD.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ({done.timezone})
            </div>
            {done.meet ? (
              <a href={done.meet} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 hover:border-[var(--color-accent)]/40 transition-colors">
                <span className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text-primary)]"><Video className="w-4 h-4 text-[var(--color-success)]" /> Google Meet link</span>
                <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
              </a>
            ) : (
              <p className="flex items-center gap-2 text-xs text-[var(--color-warning)]"><AlertTriangle className="w-4 h-4" /> Meet link unavailable : contact ELION for the meeting link.</p>
            )}
            <a href={gcal} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors">
              <Calendar className="w-4 h-4" /> Add to Google Calendar
            </a>
          </div>
          <div className="text-center mt-6">
            <Link href="/audit" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Run a free business audit while you wait →</Link>
          </div>
        </div>
      </div>
    );
  }

  // ----- LOADING -----
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="w-5 h-5 text-[var(--color-accent)] animate-spin" /> Checking live calendar availability…
        </div>
      </div>
    );
  }

  // ----- NOT CONNECTED -----
  if (!avail?.connected) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/70 flex items-center justify-center mx-auto mb-5">
          <CalendarDays className="w-7 h-7 text-[var(--color-text-muted)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Book a strategy call</h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-6">Live scheduling is being switched on : our team is preparing the calendar. In the meantime, run a free business audit or reach out on the support page and we will arrange your call directly.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/audit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">Run Your Free Business Audit</Link>
          <Link href="/landing/support" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Contact ELION</Link>
        </div>
      </div>
    );
  }

  // ----- BOOKING UI -----
  const day = byDate[Math.min(dayOffset, Math.max(byDate.length - 1, 0))];
  const slotsToday = day ? day[1] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] mb-2">ELION · Strategy call</p>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Book a call with ELION</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-xl leading-relaxed">
          Choose a time that works for you. Availability is read live from our calendar , a Google Meet link is created the moment you confirm.
        </p>
      </div>

      <div className="grid md:grid-cols-[1.1fr_1fr] gap-6">
        {/* Calendar column */}
        <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setDayOffset((o) => Math.max(0, o - 1))} disabled={dayOffset === 0} aria-label="Earlier dates" className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 text-[var(--color-text-secondary)]" /></button>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{fmtDay(day?.[0] || "")}</span>
            <button onClick={() => setDayOffset((o) => Math.min(byDate.length - 1, o + 1))} disabled={dayOffset >= byDate.length - 1} aria-label="Later dates" className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] disabled:opacity-30 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-[var(--color-text-secondary)]" /></button>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mb-3">{avail.duration_min} minutes · {avail.timezone}</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slotsToday.map((s) => (
              <button
                key={s.start}
                onClick={() => setSelected(s)}
                aria-pressed={selected?.start === s.start}
                className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  selected?.start === s.start
                    ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/50 text-[var(--color-accent)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)]/60 text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text-primary)]"
                }`}
              >
                {s.localTime}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {byDate.map(([d], i) => (
              <button key={d} onClick={() => { setSelected(null); setDayOffset(i); }} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${i === dayOffset ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>
                {new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
              </button>
            ))}
          </div>
        </div>

        {/* Details column */}
        <div className="rounded-2xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                {fmtDay(selected.date)} at {selected.localTime}
              </div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Your name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 mb-3" />
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 mb-3" />
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Phone (optional)</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 …" className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 mb-3" />
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">What should we cover?</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="A short note about your business or the audit you ran…" className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 mb-4 resize-none" />
              {error && <p className="text-xs text-[var(--color-error)] mb-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg p-2.5">{error}</p>}
              <button onClick={submit} disabled={busy} className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {busy ? "Booking…" : "Confirm booking"}
              </button>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-3 text-center">A Google Meet link is created only when your slot is confirmed on the live calendar.</p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-3"><CalendarDays className="w-6 h-6 text-[var(--color-accent)]" /></div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Pick a time</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-[220px]">Choose an available slot on the left to book your call.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
