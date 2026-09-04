"use client";
import { useEffect, useState } from "react";
import { FileText, CheckCircle, Clock, Send, Eye, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

interface InvoiceItem {
  description?: string;
  amount?: number;
}

interface Invoice {
  id: string;
  invoice_number: string | null;
  title: string;
  company_name: string | null;
  client_name: string | null;
  contract_id: string | null;
  amount: number;
  currency: string;
  status: string;
  items: InvoiceItem[];
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  clients?: { company_name: string | null; contact_name: string | null } | null;
  contracts?: { id: string; title: string } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "text-gray-400 bg-gray-400/10 border border-gray-500/20", icon: FileText, label: "Draft" },
  sent: { color: "text-blue-400 bg-blue-400/10 border border-blue-500/20", icon: Send, label: "Sent" },
  paid: { color: "text-emerald-400 bg-emerald-400/10 border border-emerald-500/20", icon: CheckCircle, label: "Paid" },
  overdue: { color: "text-red-400 bg-red-400/10 border border-red-500/20", icon: Clock, label: "Overdue" },
  cancelled: { color: "text-gray-400 bg-gray-400/10 border border-gray-500/20", icon: FileText, label: "Cancelled" },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", company_name: "", client_name: "", amount: "", due_at: "" });

  const load = () => {
    fetch("/api/admin/invoices")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => setInvoices(d.invoices || []))
      .catch(() => setError("Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markPaid = async (id: string, reference?: string) => {
    setBusy(true);
    try {
      const ref = reference?.trim() || prompt("Payment reference (optional):") || "";
      const r = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "paid", reference: ref, method: "bank_transfer" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      if (d.paymentWarning) alert(d.paymentWarning);
      load();
    } catch (e: any) {
      alert("Failed: " + (e.message || "unknown error"));
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (!form.title.trim() || !(Number(form.amount) > 0)) { alert("Title and amount are required"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          company_name: form.company_name.trim() || null,
          client_name: form.client_name.trim() || null,
          amount: Number(form.amount),
          due_at: form.due_at || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      setShowCreate(false);
      setForm({ title: "", company_name: "", client_name: "", amount: "", due_at: "" });
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Invoices</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{loading ? "Loading…" : `${invoices.length} invoices`}</p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {showCreate && (
            <div className="mb-6 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Create an invoice</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <input className={inputCls} placeholder="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                <input className={inputCls} placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                <input className={inputCls} placeholder="Amount (₦) *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                <input className={inputCls} placeholder="Due date" type="date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={create} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save invoice
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No invoices yet</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Create an invoice against a signed contract to start billing.</p>
              <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold">
                <Plus className="w-4 h-4" /> Create your first invoice
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                const Icon = sc.icon;
                const isOpen = selected === inv.id;
                const company = inv.company_name || inv.clients?.company_name || "—";
                const client = inv.client_name || inv.clients?.contact_name || null;
                return (
                  <div key={inv.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all cursor-pointer" onClick={() => setSelected(isOpen ? null : inv.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{inv.invoice_number || inv.title}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
                            <Icon className="w-3 h-3" />
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{inv.title} · {company}{client ? ` / ${client}` : ""}</p>
                        {inv.contracts && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Contract: {inv.contracts.title}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>₦{(inv.amount || 0).toLocaleString()}</p>
                        {inv.due_at && <p className="text-xs text-[var(--color-text-muted)]">Due: {new Date(inv.due_at).toLocaleDateString("en-NG")}</p>}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
                        {(inv.items || []).length > 0 && (
                          <>
                            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Line Items</h4>
                            <div className="space-y-2">
                              {(inv.items || []).map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface)]">
                                  <span className="text-sm text-[var(--color-text-secondary)]">{item.description || "Line item"}</span>
                                  {item.amount ? <span className="text-sm font-medium text-[var(--color-text-primary)]">₦{item.amount.toLocaleString()}</span> : null}
                                </div>
                              ))}
                              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total</span>
                                <span className="text-sm font-bold text-[var(--color-accent)]">₦{(inv.amount || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-3 mt-4 flex-wrap text-xs text-[var(--color-text-muted)]">
                          {inv.issued_at && <span>Issued: {new Date(inv.issued_at).toLocaleDateString("en-NG")}</span>}
                          {inv.paid_at && <span className="text-emerald-400">Paid: {new Date(inv.paid_at).toLocaleDateString("en-NG")}</span>}
                        </div>
                        {!["paid", "cancelled"].includes(inv.status) && (
                          <div className="flex items-center gap-2 mt-4">
                            <button onClick={(e) => { e.stopPropagation(); markPaid(inv.id); }} disabled={busy} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
                              Mark paid (records payment)
                            </button>
                            {inv.status === "draft" && (
                              <button onClick={(e) => { e.stopPropagation(); fetch("/api/admin/invoices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: inv.id, status: "sent" }) }).then(() => load()); }} disabled={busy} className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-semibold hover:bg-blue-500/25">
                                Mark sent
                              </button>
                            )}
                          </div>
                        )}
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