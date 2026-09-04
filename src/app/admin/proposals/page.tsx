"use client";
import Link from "next/link";
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { allProposals } from "@/lib/mock-lifecycle";
import { AdminSidebar } from "@/components/admin/sidebar";
import { DemoDataBanner } from "@/components/admin/demo-data-banner";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "text-gray-400 bg-gray-400/10", icon: FileText, label: "Draft" },
  sent: { color: "text-blue-400 bg-blue-400/10", icon: Send, label: "Sent" },
  viewed: { color: "text-amber-400 bg-amber-400/10", icon: Eye, label: "Viewed" },
  accepted: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Accepted" },
  rejected: { color: "text-red-400 bg-red-400/10", icon: XCircle, label: "Rejected" },
  expired: { color: "text-gray-400 bg-gray-400/10", icon: Clock, label: "Expired" },
};

function Send(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>;
}

export default function ProposalsPage() {
  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Proposals</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{allProposals.length} proposals</p>
      </div>
      <DemoDataBanner text="Illustrative demo data — sample proposals from the onboarding journey demo. Live proposal generation is not wired to a proposals table yet." />
      <div className="space-y-3">
        {allProposals.map(p => {
          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
          const Icon = sc.icon;
          return (
            <Link key={p.id} href={`/admin/proposals/${p.id}`} className="block p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{p.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{p.company_name} · {p.client_name}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
                  <Icon className="w-3 h-3" />
                  {sc.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                <span>Setup: <span className="text-[var(--color-text-secondary)]">N{p.total_setup.toLocaleString()}</span></span>
                <span>{p.items.filter(i => i.status === "included").length} systems included</span>
                <span>Valid until: <span className="text-[var(--color-text-secondary)]">{new Date(p.valid_until).toLocaleDateString("en-NG")}</span></span>
              </div>
            </Link>
          );
        })}
      </div>
      </div>
      </main>
    </div>
  );
}