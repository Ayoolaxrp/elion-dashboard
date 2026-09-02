"use client";
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import { allPayments } from "@/lib/mock-lifecycle";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  pending: { color: "text-amber-400 bg-amber-400/10", icon: Clock },
  paid: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
  failed: { color: "text-red-400 bg-red-400/10", icon: AlertCircle },
  partially_paid: { color: "text-amber-400 bg-amber-400/10", icon: Clock },
  refunded: { color: "text-gray-400 bg-gray-400/10", icon: AlertCircle },
};

export default function PaymentsPage() {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Payments</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{allPayments.length} payments</p>
      </div>
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 px-3 sm:px-5 py-3 border-b border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          <span>Client</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Reference</span>
          <span>Date</span>
          <span>Status</span>
        </div>
        {allPayments.map(p => {
          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
          const Icon = sc.icon;
          return (
            <div key={p.id} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4 px-3 sm:px-5 py-4 border-b border-[var(--color-border)]/50 text-sm items-center">
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">{p.company_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{p.client_name}</p>
              </div>
              <span className="font-semibold text-[var(--color-text-primary)]">N{p.amount.toLocaleString()}</span>
              <span className="text-[var(--color-text-secondary)]">{p.payment_method}</span>
              <span className="text-xs font-mono text-[var(--color-text-muted)]">{p.payment_reference}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-NG") : "—"}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
                <Icon className="w-3 h-3" />
                {p.status.replace("_", " ")}
              </span>
            </div>
          );
        })}
      </div>
      </main>
    </div>
  );
}