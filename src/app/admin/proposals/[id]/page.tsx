"use client";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { allProposals } from "@/lib/mock-lifecycle";
import { useParams } from "next/navigation";

export default function ProposalDetailPage() {
  const params = useParams();
  const proposal = allProposals.find(p => p.id === params.id);
  if (!proposal) return <div className="max-w-3xl p-6"><p className="text-[var(--color-text-muted)]">Proposal not found.</p></div>;

  return (
    <div className="max-w-3xl p-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/proposals" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{proposal.title}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{proposal.company_name} · {proposal.client_name}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Scope</h2>
        <div className="space-y-3">
          {proposal.items.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
              {item.status === "included" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.status === "included" ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{item.automation_name}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>
              </div>
              {item.setup_price && <span className="text-xs font-semibold text-[var(--color-text-secondary)]">N{item.setup_price.toLocaleString()}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Setup</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>N{proposal.total_setup.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">Implementation</p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{proposal.implementation_timeline}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{proposal.support_plan}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Timeline</h2>
        <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <p>Created: {new Date(proposal.created_at).toLocaleDateString("en-NG")}</p>
          {proposal.sent_at && <p>Sent: {new Date(proposal.sent_at).toLocaleDateString("en-NG")}</p>}
          {proposal.accepted_at && <p className="text-emerald-400">Accepted: {new Date(proposal.accepted_at).toLocaleDateString("en-NG")}</p>}
          <p>Valid until: {new Date(proposal.valid_until).toLocaleDateString("en-NG")}</p>
        </div>
      </div>
    </div>
  );
}