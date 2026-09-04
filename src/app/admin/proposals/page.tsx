"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, XCircle, Eye, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

interface ProposalItem {
  id?: string;
  automation_name?: string;
  description?: string;
  status?: string;
  setup_price?: number | null;
  monthly_price?: number | null;
}

interface Proposal {
  id: string;
  title: string;
  company_name: string | null;
  client_name: string | null;
  client_email: string | null;
  summary: string | null;
  items: ProposalItem[];
  total_setup: number;
  total_monthly: number;
  implementation_timeline: string | null;
  support_plan: string | null;
  status: string;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  created_at: string;
  clients?: { company_name: string | null; contact_name: string | null; email: string | null } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "text-gray-400 bg-gray-400/10", icon: FileText, label: "Draft" },
  sent: { color: "text-blue-400 bg-blue-400/10", icon: SendIcon, label: "Sent" },
  viewed: { color: "text-amber-400 bg-amber-400/10", icon: Eye, label: "Viewed" },
  accepted: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Accepted" },
  rejected: { color: "text-red-400 bg-red-400/10", icon: XCircle, label: "Rejected" },
  expired: { color: "text-gray-400 bg-gray-400/10", icon: Clock, label: "Expired" },
};

function SendIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", company_name: "", client_name: "", client_email: "", total_setup: "", total_monthly: "", valid_until: "" });

  const load = () => {
    fetch("/api/admin/proposals")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => setProposals(d.proposals || []))
      .catch(() => setError("Failed to load proposals"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const patch = async (id: string, status: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      load();
    } catch (e: any) {
      alert("Failed: " + (e.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!form.title.trim()) { alert("Proposal title is required"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          company_name: form.company_name.trim() || null,
          client_name: form.client_name.trim() || null,
          client_email: form.client_email.trim() || null,
          total_setup: Number(form.total_setup) || 0,
          total_monthly: Number(form.total_monthly) || 0,
          valid_until: form.valid_until || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      setShowCreate(false);
      setForm({ title: "", company_name: "", client_name: "", client_email: "", total_setup: "", total_monthly: "", valid_until: "" });
      load();
    } catch (e: any) {
      alert("Failed: " + (e.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm";

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Proposals</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{loading ? "Loading…" : `${proposals.length} proposals`}</p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Proposal
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {showCreate && (
            <div className="mb-6 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Create a proposal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input className={inputCls} placeholder="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                <input className={inputCls} placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                <input className={inputCls} placeholder="Client email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                <input className={inputCls} placeholder="Total setup (₦)" type="number" value={form.total_setup} onChange={(e) => setForm({ ...form, total_setup: e.target.value })} />
                <input className={inputCls} placeholder="Monthly management (₦)" type="number" value={form.total_monthly} onChange={(e) => setForm({ ...form, total_monthly: e.target.value })} />
                <input className={inputCls} placeholder="Valid until (date)" type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={create} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save proposal
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No proposals yet</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Create a proposal to start the commercial pipeline for a client.</p>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold">
                <Plus className="w-4 h-4" /> Create your first proposal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                const Icon = sc.icon;
                const isOpen = expanded === p.id;
                const company = p.company_name || p.clients?.company_name || "—";
                const client = p.client_name || p.clients?.contact_name || null;
                return (
                  <div key={p.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all">
                    <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : p.id)}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{p.title}</h3>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{company}{client ? ` · ${client}` : ""}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${sc.color}`}>
                        <Icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-3 flex-wrap">
                          <span>Setup: <span className="text-[var(--color-text-secondary)] font-semibold">₦{(p.total_setup || 0).toLocaleString()}</span></span>
                          {p.total_monthly ? <span>Management: <span className="text-[var(--color-text-secondary)] font-semibold">₦{p.total_monthly.toLocaleString()}/mo</span></span> : null}
                          {p.valid_until ? <span>Valid until: <span className="text-[var(--color-text-secondary)]">{new Date(p.valid_until).toLocaleDateString("en-NG")}</span></span> : null}
                          <Link href={`/admin/proposals/${p.id}`} className="text-[var(--color-accent)] hover:underline">Open detail →</Link>
                        </div>
                        {p.summary && <p className="text-xs text-[var(--color-text-secondary)] mb-3">{p.summary}</p>}
                        {(p.items || []).length > 0 && (
                          <div className="space-y-1.5 mb-4">
                            {(p.items || []).map((item, i) => (
                              <div key={item.id || i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface)]">
                                <span className="text-xs text-[var(--color-text-secondary)]">{item.automation_name || item.description || "Line item"}</span>
                                {item.setup_price ? <span className="text-xs font-medium text-[var(--color-text-primary)]">₦{item.setup_price.toLocaleString()}</span> : null}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.status === "draft" && (
                            <button onClick={() => patch(p.id, "sent")} disabled={busy} className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-semibold hover:bg-blue-500/25">Mark sent</button>
                          )}
                          {["sent", "viewed"].includes(p.status) && (
                            <>
                              <button onClick={() => patch(p.id, "accepted")} disabled={busy} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25">Accept</button>
                              <button onClick={() => patch(p.id, "rejected")} disabled={busy} className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25">Reject</button>
                            </>
                          )}
                          {["sent", "viewed", "accepted", "rejected"].includes(p.status) && (
                            <button onClick={() => patch(p.id, "draft")} disabled={busy} className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">Back to draft</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}