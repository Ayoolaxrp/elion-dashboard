"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, AlertCircle, Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  company_name: string | null;
  client_name: string | null;
  method: string | null;
  reference: string | null;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  invoices?: { invoice_number: string | null; title: string | null } | null;
  clients?: { company_name: string | null; contact_name: string | null } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "text-amber-400 bg-amber-400/10", icon: Clock, label: "Pending" },
  success: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Paid" },
  paid: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Paid" },
  failed: { color: "text-red-400 bg-red-400/10", icon: AlertCircle, label: "Failed" },
  abandoned: { color: "text-gray-400 bg-gray-400/10", icon: AlertCircle, label: "Abandoned" },
  refunded: { color: "text-gray-400 bg-gray-400/10", icon: AlertCircle, label: "Refunded" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({ company_name: "", client_name: "", amount: "", method: "bank_transfer", reference: "", status: "success", notes: "" });

  const load = () => {
    fetch("/api/admin/payments")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => setPayments(d.payments || []))
      .catch(() => setError("Failed to load payments"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const record = async () => {
    if (!(Number(form.amount) > 0)) { alert("Payment amount must be greater than zero"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name.trim() || null,
          client_name: form.client_name.trim() || null,
          amount: Number(form.amount),
          method: form.method,
          reference: form.reference.trim() || null,
          status: form.status,
          notes: form.notes.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      setShowRecord(false);
      setForm({ company_name: "", client_name: "", amount: "", method: "bank_transfer", reference: "", status: "success", notes: "" });
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
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Payments</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{loading ? "Loading…" : `${payments.length} payments`}</p>
            </div>
            <button
              onClick={() => setShowRecord(!showRecord)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {showRecord && (
            <div className="mb-6 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Record a payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Company name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                <input className={inputCls} placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                <input className={inputCls} placeholder="Amount (₦) *" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                <select className={inputCls} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                  <option value="manual">Manual</option>
                </select>
                <input className={inputCls} placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="success">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <textarea className={`${inputCls} mt-3`} rows={2} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2 mt-4">
                <button onClick={record} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save payment
                </button>
                <button onClick={() => setShowRecord(false)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No payments yet</p>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Record the first payment to confirm a client's order and begin onboarding.</p>
              <button onClick={() => setShowRecord(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold">
                <Plus className="w-4 h-4" /> Record your first payment
              </button>
            </div>
          ) : (
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                <span className="lg:col-span-2">Client</span>
                <span>Amount</span>
                <span>Method</span>
                <span className="hidden sm:block">Reference</span>
                <span className="hidden lg:block">Date</span>
                <span>Status</span>
              </div>
              {payments.map((p) => {
                const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                const Icon = sc.icon;
                const isOpen = expanded === p.id;
                const company = p.company_name || p.clients?.company_name || "—";
                const client = p.client_name || p.clients?.contact_name || null;
                return (
                  <div key={p.id}>
                    <div
                      className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-3 sm:px-5 py-4 border-b border-[var(--color-border)]/50 text-sm items-center cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                    >
                      <div className="lg:col-span-2 min-w-0">
                        <p className="font-medium text-[var(--color-text-primary)] truncate">{company}</p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{client || p.invoices?.invoice_number || "—"}</p>
                      </div>
                      <span className="font-semibold text-[var(--color-text-primary)]">₦{(p.amount || 0).toLocaleString()}</span>
                      <span className="text-[var(--color-text-secondary)] capitalize">{(p.method || "bank_transfer").replace("_", " ")}</span>
                      <span className="hidden sm:block text-xs font-mono text-[var(--color-text-muted)] truncate">{p.reference || "—"}</span>
                      <span className="hidden lg:block text-xs text-[var(--color-text-muted)]">{(p.paid_at || p.created_at) ? new Date(p.paid_at || p.created_at).toLocaleDateString("en-NG") : "—"}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold justify-self-start ${sc.color}`}>
                        <Icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="px-3 sm:px-5 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-[var(--color-text-muted)] mb-1">Payment ID</p>
                            <p className="font-mono text-[var(--color-text-secondary)]">{p.id}</p>
                          </div>
                          {p.invoices && (
                            <div>
                              <p className="text-[var(--color-text-muted)] mb-1">Invoice</p>
                              <p className="text-[var(--color-text-secondary)]">{p.invoices.invoice_number || p.invoices.title || "—"}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[var(--color-text-muted)] mb-1">Currency</p>
                            <p className="text-[var(--color-text-secondary)]">{p.currency || "NGN"}</p>
                          </div>
                          {p.notes && (
                            <div>
                              <p className="text-[var(--color-text-muted)] mb-1">Notes</p>
                              <p className="text-[var(--color-text-secondary)]">{p.notes}</p>
                            </div>
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