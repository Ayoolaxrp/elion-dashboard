"use client";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { FileText, CheckCircle, Clock, Send, Download, Eye } from "lucide-react";
import { allPayments, allContracts } from "@/lib/mock-lifecycle";

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  company_name: string;
  contract_id: string;
  amount: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue";
  issued_at: string;
  due_at: string;
  paid_at: string | null;
  items: { description: string; amount: number }[];
}

const mockInvoices: Invoice[] = [
  {
    id: "inv_001",
    invoice_number: "ELION-2026-001",
    client_name: "Adebayo Okonkwo",
    company_name: "ABC Properties",
    contract_id: "cont_001",
    amount: 350000,
    status: "paid",
    issued_at: "2026-08-22",
    due_at: "2026-09-05",
    paid_at: "2026-08-23",
    items: [
      { description: "Lead Response System - Setup", amount: 150000 },
      { description: "Follow-Up Sequence - Setup", amount: 100000 },
      { description: "Booking Automation - Setup", amount: 100000 },
    ],
  },
  {
    id: "inv_002",
    invoice_number: "ELION-2026-002",
    client_name: "Tunde Bakare",
    company_name: "Fresh Ventures",
    contract_id: "cont_002",
    amount: 100000,
    status: "sent",
    issued_at: "2026-08-28",
    due_at: "2026-09-11",
    paid_at: null,
    items: [
      { description: "Lead Response System - Setup", amount: 100000 },
    ],
  },
  {
    id: "inv_003",
    invoice_number: "ELION-2026-003",
    client_name: "Chidi Nwosu",
    company_name: "Chidi & Sons",
    contract_id: "cont_003",
    amount: 750000,
    status: "draft",
    issued_at: "2026-08-30",
    due_at: "2026-09-13",
    paid_at: null,
    items: [
      { description: "Lead Response System - Setup", amount: 150000 },
      { description: "Follow-Up Sequence - Setup", amount: 100000 },
      { description: "Booking Automation - Setup", amount: 100000 },
      { description: "Revenue Recovery - Setup", amount: 200000 },
      { description: "Operations Automation - Setup", amount: 200000 },
    ],
  },
];

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "text-gray-400 bg-gray-400/10 border border-gray-500/20", icon: FileText, label: "Draft" },
  sent: { color: "text-blue-400 bg-blue-400/10 border border-blue-500/20", icon: Send, label: "Sent" },
  viewed: { color: "text-amber-400 bg-amber-400/10 border border-amber-500/20", icon: Eye, label: "Viewed" },
  paid: { color: "text-emerald-400 bg-emerald-400/10 border border-emerald-500/20", icon: CheckCircle, label: "Paid" },
  overdue: { color: "text-red-400 bg-red-400/10 border border-red-500/20", icon: Clock, label: "Overdue" },
};

export default function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Invoices</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{mockInvoices.length} invoices. Part of the 6-document onboarding system.</p>
          </div>

          {/* 6-Document System Overview */}
          <div className="mb-8 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-3">Onboarding Document System</p>
            <div className="flex flex-wrap gap-2">
              {["Proposal", "Contract", "Invoice", "Welcome Doc", "Client Portal", "Thank You"].map((doc, i) => (
                <span key={doc} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${doc === "Invoice" ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"}`}>
                  {i + 1}. {doc}
                </span>
              ))}
            </div>
          </div>

          {/* Invoice List */}
          <div className="space-y-3">
            {mockInvoices.map(inv => {
              const sc = STATUS_CONFIG[inv.status];
              const Icon = sc.icon;
              return (
                <div key={inv.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all cursor-pointer" onClick={() => setSelectedInvoice(selectedInvoice?.id === inv.id ? null : inv)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{inv.invoice_number}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
                          <Icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">{inv.company_name} / {inv.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>N{inv.amount.toLocaleString()}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Due: {new Date(inv.due_at).toLocaleDateString("en-NG")}</p>
                    </div>
                  </div>

                  {/* Expanded Invoice Detail */}
                  {selectedInvoice?.id === inv.id && (
                    <div className="mt-5 pt-5 border-t border-[var(--color-border)]">
                      <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Line Items</h4>
                      <div className="space-y-2">
                        {inv.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface)]">
                            <span className="text-sm text-[var(--color-text-secondary)]">{item.description}</span>
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">N{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total</span>
                          <span className="text-sm font-bold text-[var(--color-accent)]">N{inv.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-xs text-[var(--color-text-muted)]">Issued: {new Date(inv.issued_at).toLocaleDateString("en-NG")}</span>
                        {inv.paid_at && <span className="text-xs text-emerald-400">Paid: {new Date(inv.paid_at).toLocaleDateString("en-NG")}</span>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        {inv.status === "draft" && <button className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors">Send Invoice</button>}
                        {inv.status === "sent" && <button className="px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-white transition-colors">Resend</button>}
                        <button className="px-4 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-white transition-colors flex items-center gap-1.5"><Download className="w-3 h-3" /> Download PDF</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
