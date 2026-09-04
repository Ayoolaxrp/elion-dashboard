"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Rocket, Send, Loader2, CheckCircle2, ChevronRight, UserPlus } from "lucide-react";
interface Client { id: string; contact_name: string; email: string; company_name: string; plan_name: string; onboarding_status: string; status: string; created_at: string; client_automations: Array<{ id: string; status: string; workflow_templates: { name: string; category: string } }>; client_integrations: Array<{ integration_type: string; status: string }>; }
const SC: Record<string, string> = { active: "text-green-400 bg-green-400/10", paused: "text-yellow-400 bg-yellow-400/10", churned: "text-red-400 bg-red-400/10", completed: "text-blue-400 bg-blue-400/10" };
const OC: Record<string, string> = { pending: "text-gray-400 bg-gray-400/10", in_review: "text-yellow-400 bg-yellow-400/10", in_progress: "text-blue-400 bg-blue-400/10", building: "text-blue-400 bg-blue-400/10", testing: "text-purple-400 bg-purple-400/10", go_live: "text-green-400 bg-green-400/10", completed: "text-green-400 bg-green-400/10" };
const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sentState, setSentState] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/clients").then(r => r.json()).then(d => { setClients(d.clients || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const sendOnboarding = useCallback(async (c: Client) => {
    setSending(c.id); setErr(""); setSentState((p) => ({ ...p, [c.id]: { ok: false, msg: "Sending…" } }));
    try {
      const r = await fetch("/api/admin/onboarding/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: c.id, kind: "welcome" }),
      });
      const d = await r.json();
      if (r.ok && d.sent) {
        setSentState((p) => ({ ...p, [c.id]: { ok: true, msg: `Welcome email sent to ${d.email}` } }));
      } else {
        setSentState((p) => ({ ...p, [c.id]: { ok: false, msg: d.error || "Send failed" } }));
      }
    } catch {
      setSentState((p) => ({ ...p, [c.id]: { ok: false, msg: "Could not reach server" } }));
    } finally {
      setSending(null);
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Clients</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Manage client accounts, automations, and onboarding.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/deploy" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"><Rocket className="w-4 h-4" /> New Client + Deploy</Link>
          <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">{clients.length} clients</span>
        </div>
      </div>

      {err && <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{err}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]/50">
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No clients yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">Clients appear here after a lead converts and is onboarded.</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link href="/admin/deploy" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"><Rocket className="w-4 h-4" /> New Client + Deploy</Link>
            <Link href="/admin/clients/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F2937] text-white text-sm font-semibold rounded-lg hover:bg-[#2A3548] border border-[#1F2937] transition-colors"><UserPlus className="w-4 h-4" /> Quick Add</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => {
            const st = sentState[c.id];
            return (
              <div key={c.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all">
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <Link href={`/admin/clients/${c.id}`} className="min-w-0 flex-1 group">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{c.company_name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{c.contact_name} · {c.email}</p>
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${OC[c.onboarding_status] || ""}`}>{c.onboarding_status.replace(/_/g, " ")}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${SC[c.status] || ""}`}>{c.status}</span>
                    <button
                      onClick={() => sendOnboarding(c)}
                      disabled={sending === c.id}
                      title="Send the onboarding welcome email to this client now"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/40 disabled:opacity-50 transition-all"
                    >
                      {sending === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" /> : <Send className="w-3.5 h-3.5" />}
                      {sending === c.id ? "Sending…" : "Send onboarding"}
                    </button>
                    <Link href={`/admin/clients/${c.id}`} className="p-1.5 rounded-lg border border-transparent hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all" title="Open client">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                {st && (
                  <div className={`mb-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${st.ok ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {st.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Send className="w-3.5 h-3.5 shrink-0" />}
                    {st.msg}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] flex-wrap">
                  <span>Plan: <span className="text-[var(--color-text-secondary)]">{c.plan_name || "Not set"}</span></span>
                  <span>Automations: <span className="text-[var(--color-text-secondary)]">{c.client_automations?.length || 0}</span></span>
                  <span>Integrations: <span className="text-[var(--color-text-secondary)]">{c.client_integrations?.filter(i => i.status === "connected").length || 0} connected</span></span>
                  <span>Created: <span className="text-[var(--color-text-secondary)]">{fmtTime(c.created_at)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
