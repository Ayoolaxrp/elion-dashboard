"use client";
import { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, Send, Loader2, Plus } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

interface Contract {
  id: string;
  title: string;
  company_name: string | null;
  client_name: string | null;
  scope_summary: string | null;
  total_amount: number;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  signatory: string | null;
  created_at: string;
  proposals?: { id: string; title: string; status: string } | null;
  clients?: { company_name: string | null; contact_name: string | null } | null;
}

interface ProposalOption {
  id: string;
  title: string;
  status: string;
  company_name: string | null;
  total_setup: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  draft: { color: "text-gray-400 bg-gray-400/10", icon: FileText },
  sent: { color: "text-blue-400 bg-blue-400/10", icon: Send },
  viewed: { color: "text-amber-400 bg-amber-400/10", icon: Clock },
  signed: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
  declined: { color: "text-red-400 bg-red-400/10", icon: FileText },
  expired: { color: "text-gray-400 bg-gray-400/10", icon: Clock },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ proposal_id: "", title: "", company_name: "", client_name: "", total_amount: "", scope_summary: "" });

  const load = () => {
    Promise.all([
      fetch("/api/admin/contracts").then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/admin/proposals").then((r) => (r.ok ? r.json() : Promise.reject())),
    ])
      .then(([c, p]) => {
        setContracts(c.contracts || []);
        setProposals((p.proposals || []).map((x: any) => ({ id: x.id, title: x.title, status: x.status, company_name: x.company_name, total_setup: x.total_setup })));
      })
      .catch(() => setError("Failed to load contracts"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const patch = async (id: string, status: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/contracts", {
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
    setBusy(true);
    try {
      const body: any = {};
      if (form.proposal_id) {
        body.proposal_id = form.proposal_id;
        if (form.scope_summary.trim()) body.scope_summary = form.scope_summary.trim();
      } else {
        if (!form.title.trim()) { alert("Contract title is required (or pick a proposal)"); return; }
        body.title = form.title.trim();
        body.company_name = form.company_name.trim() || null;
        body.client_name = form.client_name.trim() || null;
        body.total_amount = Number(form.total_amount) || 0;
        body.scope_summary = form.scope_summary.trim() || null;
      }
      const r = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      setShowCreate(false);
      setForm({ proposal_id: "", title: "", company_name: "", client_name: "", total_amount: "", scope_summary: "" });
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
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Contracts</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{loading ? "Loading…" : `${contracts.length} contracts`}</p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Contract
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {showCreate && (
            <div className="mb-6 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Create a contract</h3>
              <div className="mb-3">
                <label className="block text-xs text-[var(--color-text-muted)] mb-1">Create from proposal (recommended)</label>
                <select className={inputCls} value={form.proposal_id} onChange={(e) => setForm({ ...form, proposal_id: e.target.value })}>
                  <option value="">Manual entry</option>
                  {proposals.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} · {p.status}{p.company_name ? ` · ${p.company_name}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Title *" value={form.title} disabled={!!form.proposal_id} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input className={inputCls} placeholder="Company name" value={form.company_name} disabled={!!form.proposal_id} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                <input className={inputCls} placeholder="Client name" value={form.client_name} disabled={!!form.proposal_id} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                <input className={inputCls} placeholder="Total amount (₦)" type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
              </div>
              <textarea className={`${inputCls} mt-3`} rows={2} placeholder="Scope summary" value={form.scope_summary} onChange={(e) => setForm({ ...form, scope_summary: e.target.value })} />
              <div className="flex gap-2 mt-4">
                <button onClick={create} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save contract
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No contracts yet</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Create a contract from an accepted proposal to move a client into the commercial pipeline.</p>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold">
                <Plus className="w-4 h-4" /> Create your first contract
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((c) => {
                const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                const Icon = sc.icon;
                const company = c.company_name || c.clients?.company_name || "—";
                const client = c.client_name || c.clients?.contact_name || null;
                return (
                  <div key={c.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{c.title}</h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{company}{client ? ` · ${client}` : ""}</p>
                        {c.proposals && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">From: {c.proposals.title}</p>}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${sc.color}`}>
                        <Icon className="w-3 h-3" />
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </div>
                    {c.scope_summary && <p className="text-xs text-[var(--color-text-muted)] mt-3">{c.scope_summary}</p>}
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)] flex-wrap">
                      <span>Amount: <span className="text-[var(--color-text-secondary)] font-semibold">₦{(c.total_amount || 0).toLocaleString()}</span></span>
                      {c.signed_at && <span className="text-emerald-400">Signed: {new Date(c.signed_at).toLocaleDateString("en-NG")}</span>}
                      {c.signatory && <span>Signatory: <span className="text-[var(--color-text-secondary)]">{c.signatory}</span></span>}
                      {c.expires_at && <span>Expires: {new Date(c.expires_at).toLocaleDateString("en-NG")}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      {c.status === "draft" && (
                        <button onClick={() => patch(c.id, "sent")} disabled={busy} className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-semibold hover:bg-blue-500/25">Mark sent</button>
                      )}
                      {["sent", "viewed"].includes(c.status) && (
                        <>
                          <button onClick={() => patch(c.id, "signed")} disabled={busy} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25">Mark signed</button>
                          <button onClick={() => patch(c.id, "declined")} disabled={busy} className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-semibold hover:bg-red-500/25">Decline</button>
                        </>
                      )}
                    </div>
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