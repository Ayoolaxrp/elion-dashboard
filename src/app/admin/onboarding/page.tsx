"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Circle, Send, Copy, ChevronRight, Loader2, Mail, MessageSquare, Phone, Check } from "lucide-react";

const STAGES = [
  { key: "welcome", label: "Welcome" },
  { key: "kickoff", label: "Kickoff" },
  { key: "configuration", label: "Configure" },
  { key: "build", label: "Build" },
  { key: "testing", label: "Test" },
  { key: "launch", label: "Launch" },
  { key: "handover", label: "Handover" },
];

interface Pipeline {
  id: string;
  current_stage: string;
  welcome_email_sent: boolean;
  welcome_email_sent_at: string | null;
  kickoff_message_sent: boolean;
  kickoff_message_sent_at: string | null;
  completion_email_sent: boolean;
  completion_email_sent_at: string | null;
  kickoff_date: string | null;
  kickoff_time: string | null;
  kickoff_call_link: string | null;
  clients: { id: string; contact_name: string; email: string; company_name: string } | null;
  [k: string]: unknown;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

export default function AdminOnboarding() {
  const [pipes, setPipes] = useState<Pipeline[]>([]);
  const [ld, setLd] = useState(true);
  const [sel, setSel] = useState<Pipeline | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [kd, setKd] = useState("");
  const [kt, setKt] = useState("");
  const [kl, setKl] = useState("");
  const [autoName, setAutoName] = useState("Lead Response System");
  const [wa, setWa] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/pipeline")
      .then((r) => r.json())
      .then((d) => { setPipes(d.pipelines || []); setLd(false); })
      .catch(() => setLd(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = () => { setLd(true); load(); };

  const refreshSel = async (id: string) => {
    const r = await fetch("/api/admin/pipeline/" + id);
    const d = await r.json();
    if (d.pipeline) setSel(d.pipeline);
  };

  const advance = async (id: string) => {
    setBusy(id);
    await fetch("/api/admin/pipeline/" + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance" }),
    });
    await load();
    if (sel?.id === id) await refreshSel(id);
    setBusy(null);
  };

  const sendEmail = async (id: string, type: string, extra: Record<string, unknown> = {}) => {
    setBusy(id + type);
    setMsg(null); setWa(null);
    const r = await fetch("/api/admin/pipeline/" + id + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...extra }),
    });
    const d = await r.json();
    if (r.ok && d.whatsappMessage) setWa(d.whatsappMessage);
    if (r.ok && d.success && !d.whatsappMessage) setMsg({ ok: true, text: d.type === "welcome" ? "Welcome email sent." : "Completion email sent." });
    if (!r.ok) setMsg({ ok: false, text: d.error || "Send failed" });
    await load();
    if (sel?.id === id) await refreshSel(id);
    setBusy(null);
  };

  if (ld) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-[var(--color-text-muted)] hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
          <Image src="/brand/elion-e-icon.svg" alt="E" width={24} height={24} />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Onboarding</h1>
          <span className="text-xs text-[var(--color-text-muted)]">{pipes.length} pipeline{pipes.length === 1 ? "" : "s"}</span>
          <button onClick={refresh} className="ml-auto text-xs text-[var(--color-text-muted)] hover:text-white">Refresh</button>
        </div>

        {pipes.length === 0 ? (
          <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]/50">
            <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No onboarding pipelines yet</p>
            <p className="text-sm text-[var(--color-text-muted)]">Send an onboarding email from the Clients page and a pipeline is created automatically for that client.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline list */}
            <div className="space-y-2">
              {pipes.map((p) => {
                const idx = STAGES.findIndex((s) => s.key === p.current_stage);
                const c = p.clients;
                return (
                  <button key={p.id} onClick={() => { setSel(p); setWa(null); setMsg(null); }} className={"w-full text-left p-4 rounded-xl border transition-all " + (sel?.id === p.id ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5" : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border)]")}>
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{c?.company_name || "Unknown"}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent)] shrink-0">{p.current_stage}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{c?.contact_name} · {c?.email}</p>
                    <div className="flex gap-0.5 mt-2">
                      {STAGES.map((s, i) => (
                        <div key={s.key} className={"h-1 flex-1 rounded-full " + (i < idx ? "bg-[var(--color-success)]" : i === idx ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]")} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2 space-y-6">
              {sel ? (
                <>
                  {/* Stage timeline */}
                  <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{sel.clients?.company_name}</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">{sel.clients?.contact_name} · {sel.clients?.email}</p>
                      </div>
                      <button onClick={() => advance(sel.id)} disabled={busy === sel.id || sel.current_stage === "handover"} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                        {busy === sel.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        {sel.current_stage === "handover" ? "Complete" : "Advance stage"}
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-1">
                      {STAGES.map((s, i) => {
                        const idx = STAGES.findIndex((st) => st.key === sel.current_stage);
                        const done = i < idx;
                        const cur = i === idx;
                        return (
                          <div key={s.key} className="flex items-center gap-3 py-1.5">
                            <div className={"w-7 h-7 rounded-full flex items-center justify-center shrink-0 " + (done ? "bg-[var(--color-success)]/15" : cur ? "bg-[var(--color-accent)]/15" : "bg-[var(--color-surface)]")}>
                              {done ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : cur ? <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" /> : <Circle className="w-4 h-4 text-[var(--color-border)]" />}
                            </div>
                            <span className={"text-sm " + (cur ? "text-[var(--color-text-primary)] font-medium" : done ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-muted)]/60")}>{s.label}</span>
                            {done && <span className="text-xs text-[var(--color-success)]">Done</span>}
                            {cur && <span className="text-xs text-[var(--color-accent)]">Current</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Individual sends : always available for this client */}
                  <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                    <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Send onboarding (individual)</h3>

                    {msg && (
                      <div className={"mb-4 px-4 py-3 rounded-lg text-sm border " + (msg.ok ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>{msg.text}</div>
                    )}

                    {/* Welcome */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/12 flex items-center justify-center shrink-0"><Mail className="w-4 h-4 text-[var(--color-accent)]" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Welcome email</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {sel.welcome_email_sent ? `Sent ${fmt(sel.welcome_email_sent_at)}` : "Introduction + what happens next"}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => sendEmail(sel.id, "welcome")} disabled={!!busy || !!sel.welcome_email_sent} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-success)] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                        {busy === sel.id + "welcome" ? <Loader2 className="w-4 h-4 animate-spin" /> : sel.welcome_email_sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {sel.welcome_email_sent ? "Sent" : "Send welcome"}
                      </button>
                    </div>

                    {/* Kickoff WhatsApp */}
                    <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] mb-3">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/12 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-emerald-400" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Kickoff call message</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {sel.kickoff_message_sent ? `Generated ${fmt(sel.kickoff_message_sent_at)}  · copy & send on WhatsApp` : "Draft the kickoff invitation"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3 mb-3">
                        <input type="date" value={kd} onChange={(e) => setKd(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-white text-sm" />
                        <input type="time" value={kt} onChange={(e) => setKt(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-white text-sm" />
                        <input type="text" placeholder="Meeting link (meet.google.com/…)" value={kl} onChange={(e) => setKl(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-white text-sm" />
                      </div>
                      <button onClick={() => sendEmail(sel.id, "kickoff_whatsapp", { date: kd, time: kt, callLink: kl })} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-[#052e16] text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
                        {busy === sel.id + "kickoff_whatsapp" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />} Generate WhatsApp message
                      </button>
                    </div>

                    {/* Completion */}
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/12 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Completion email</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {sel.completion_email_sent ? `Sent ${fmt(sel.completion_email_sent_at)}` : "Send when the build is live"}
                          </p>
                          {!sel.completion_email_sent && (
                            <input type="text" value={autoName} onChange={(e) => setAutoName(e.target.value)} placeholder="Automation name" className="mt-2 w-full sm:w-72 px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs text-white" />
                          )}
                        </div>
                      </div>
                      <button onClick={() => sendEmail(sel.id, "completion", { automationName: autoName, connectedSystems: ["Email", "Calendar"], workflowDescription: "Your ELION automation is configured, connected, and live." })} disabled={!!busy || !!sel.completion_email_sent} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity">
                        {busy === sel.id + "completion" ? <Loader2 className="w-4 h-4 animate-spin" /> : sel.completion_email_sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {sel.completion_email_sent ? "Sent" : "Send completion"}
                      </button>
                    </div>
                  </div>

                  {wa && (
                    <div className="p-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-[#25D366] flex items-center gap-2"><MessageSquare className="w-4 h-4" /> WhatsApp message ready</h3>
                        <button onClick={() => navigator.clipboard.writeText(wa)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-white"><Copy className="w-3.5 h-3.5" /> Copy</button>
                      </div>
                      <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap font-sans">{wa}</pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 text-[var(--color-text-muted)]">Select a client to manage their onboarding.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
