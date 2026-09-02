"use client";
import Link from "next/link";
import { FileText, CheckCircle, Clock, Send, ArrowLeft } from "lucide-react";
import { allContracts } from "@/lib/mock-lifecycle";
import { AdminSidebar } from "@/components/admin/sidebar";

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  draft: { color: "text-gray-400 bg-gray-400/10", icon: FileText },
  sent: { color: "text-blue-400 bg-blue-400/10", icon: Send },
  viewed: { color: "text-amber-400 bg-amber-400/10", icon: Clock },
  signed: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle },
  declined: { color: "text-red-400 bg-red-400/10", icon: FileText },
  expired: { color: "text-gray-400 bg-gray-400/10", icon: Clock },
};

export default function ContractsPage() {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Contracts</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{allContracts.length} contracts</p>
      </div>
      <div className="space-y-3">
        {allContracts.map(c => {
          const sc = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
          const Icon = sc.icon;
          return (
            <div key={c.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{c.company_name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{c.client_name}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
                  <Icon className="w-3 h-3" />
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3">{c.scope_summary}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                <span>Amount: <span className="text-[var(--color-text-secondary)]">N{c.total_amount.toLocaleString()}</span></span>
                {c.signed_at && <span className="text-emerald-400">Signed: {new Date(c.signed_at).toLocaleDateString("en-NG")}</span>}
                {c.signatory && <span>Signatory: <span className="text-[var(--color-text-secondary)]">{c.signatory}</span></span>}
              </div>
            </div>
          );
        })}
      </div>
      </main>
    </div>
  );
}