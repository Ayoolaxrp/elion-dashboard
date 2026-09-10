"use client";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { CheckCircle, Clock, AlertCircle, Loader2, Plus, CreditCard } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

type IconType = ComponentType<{ className?: string }>;
type InvoiceOption = { id: string; invoice_number: string | null; title: string | null; amount: number; status: string; company_name: string | null };

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

const STATUS_CONFIG: Record<string, { color: string; icon: IconType; label: string }> = {
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

  // Kora online payment flow.
  const [showKora, setShowKora] = useState(false);
  const [koraBusy, setKoraBusy] = useState(false);
  const [koraMsg, setKoraMsg] = useState<string | null>(null);
  const [koraForm, setKoraForm] = useState({ invoice_id: "", amount: "", company_name: "", customer_email: "" });
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);

  const load = () => {
    fetch("/api/admin/payments")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => setPayments(d.payments || []))
      .catch(() => setError("Failed to load payments"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Invoice picker for the Kora flow.
  useEffect(() => {
    fetch("/api/admin/invoices")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setInvoices((d.invoices || []).filter((i: InvoiceOption) => ["draft", "sent", "overdue"].includes(i.status))))
      .catch(() => {});
  }, []);

  // Server-side Kora verification when the customer returns from checkout
  // (?payment=ID). The redirect itself never marks anything paid.
  useEffect(() => {
    const paymentId = new URLSearchParams(window.location.search).get("payment");
    if (!paymentId) return;
    (async () => {
      setKoraMsg("Verifying payment with Kora…");
      try {
        const r = await fetch(`/api/payments/kora/verify?payment=${encodeURIComponent(paymentId)}`);
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Verification failed");
        setKoraMsg(
          d.verified
            ? `Payment confirmed as ${d.status}. ${d.invoiceUpdated ? "Invoice marked paid. " : ""}${d.leadUpdated ? "Lead promoted to paid." : ""}`
            : `Payment is ${d.status || "unverified"} — not yet paid.`
        );
        load();
      } catch (e) {
        setKoraMsg("Verification error: " + (e instanceof Error ? e.message : "unknown"));
      } finally {
        // Remove the query param so re-renders don't re-verify.
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        window.history.replaceState({}, "", url.toString());
      }
    })();
  }, []);

  const requestKoraPayment = async () => {
    const invoice = invoices.find((i) => i.id === koraForm.invoice_id);
    if (!invoice && !(Number(koraForm.amount) > 0)) { alert("Choose an invoice or enter an amount"); return; }
    setKoraBusy(true);
    setKoraMsg(null);
    try {
      const r = await fetch("/api/payments/kora/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: koraForm.invoice_id || null,
          amount: invoice ? undefined : Number(koraForm.amount),
          company_name: (koraForm.company_name.trim() || invoice?.company_name || null),
          customer_email: koraForm.customer_email.trim() || null,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Request failed");
      setKoraMsg("Checkout opened — payment is confirmed only after Kora verifies it.");
      window.open(d.checkoutUrl, "_blank", "noopener");
      setShowKora(false);
    } catch (e) {
      setKoraMsg("Kora error: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setKoraBusy(false);
    }
  };

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
    } catch (e) {
      alert("Failed: " + (e instanceof Error ? e.message : "unknown error"));
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKora(!showKora)}
                disabled={koraBusy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-semibold hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" /> Online Payment (Kora)
              </button>
              <button
                onClick={() => setShowRecord(!showRecord)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Record Payment
              </button>
            </div>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {koraMsg && (
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">
              {koraMsg}
            </div>
          )}

          {showKora && (
            <div className="mb-6 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Request online payment (Kora)</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Payment is confirmed only after Kora verifies it server-side — returning from checkout alone never marks an invoice paid.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  className={inputCls}
                  value={koraForm.invoice_id}
                  onChange={(e) => setKoraForm({ ...koraForm, invoice_id: e.target.value })}
                >
                  <option value="">— Unpaid invoice (optional) —</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number || inv.title || inv.id} · ₦{(inv.amount || 0).toLocaleString()} · {inv.company_name || ""}
                    </option>
                  ))}
                </select>
                <input className={inputCls} placeholder="Amount (₦) — used only without an invoice" type="number" value={koraForm.amount} onChange={(e) => setKoraForm({ ...koraForm, amount: e.target.value })} />
                <input className={inputCls} placeholder="Company name (optional)" value={koraForm.company_name} onChange={(e) => setKoraForm({ ...koraForm, company_name: e.target.value })} />
                <input className={inputCls} placeholder="Customer email (optional)" type="email" value={koraForm.customer_email} onChange={(e) => setKoraForm({ ...koraForm, customer_email: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={requestKoraPayment} disabled={koraBusy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
                  {koraBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Open checkout
                </button>
                <button onClick={() => setShowKora(false)} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">Cancel</button>
              </div>
            </div>
          )}

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
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Record the first payment to confirm a client&apos;s order and begin onboarding.</p>
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
                const company = p.company_name || p.clients?.company_name || "-";
                const client = p.client_name || p.clients?.contact_name || null;
                return (
                  <div key={p.id}>
                    <div
                      className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-3 sm:px-5 py-4 border-b border-[var(--color-border)]/50 text-sm items-center cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                    >
                      <div className="lg:col-span-2 min-w-0">
                        <p className="font-medium text-[var(--color-text-primary)] truncate">{company}</p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{client || p.invoices?.invoice_number || "-"}</p>
                      </div>
                      <span className="font-semibold text-[var(--color-text-primary)]">₦{(p.amount || 0).toLocaleString()}</span>
                      <span className="text-[var(--color-text-secondary)] capitalize">{(p.method || "bank_transfer").replace("_", " ")}</span>
                      <span className="hidden sm:block text-xs font-mono text-[var(--color-text-muted)] truncate">{p.reference || "-"}</span>
                      <span className="hidden lg:block text-xs text-[var(--color-text-muted)]">{(p.paid_at || p.created_at) ? new Date(p.paid_at || p.created_at).toLocaleDateString("en-NG") : "-"}</span>
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
                              <p className="text-[var(--color-text-secondary)]">{p.invoices.invoice_number || p.invoices.title || "-"}</p>
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