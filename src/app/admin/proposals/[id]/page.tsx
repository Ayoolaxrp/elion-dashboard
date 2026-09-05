"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
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
}

export default function ProposalDetailPage() {
  const params = useParams();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/proposals")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => {
        const found = (d.proposals || []).find((p: Proposal) => p.id === params.id);
        setProposal(found || null);
      })
      .catch(() => setProposal(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--color-surface)]">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></main>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex min-h-screen bg-[var(--color-surface)]">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <p className="text-[var(--color-text-muted)]">Proposal not found.</p>
          <Link href="/admin/proposals" className="text-[var(--color-accent)] text-sm hover:underline">← Back to proposals</Link>
        </main>
      </div>
    );
  }

  const items = proposal.items || [];

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/admin/proposals" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{proposal.title}</h1>
              <p className="text-sm text-[var(--color-text-muted)]">{proposal.company_name || "-"}{proposal.client_name ? ` · ${proposal.client_name}` : ""}</p>
            </div>
          </div>

          {proposal.summary && (
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{proposal.summary}</p>
            </div>
          )}

          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Scope</h2>
            {items.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No line items recorded on this proposal.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={item.id || i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                    {item.status !== "not_included" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${item.status !== "not_included" ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{item.automation_name || "Line item"}</p>
                      {item.description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>}
                    </div>
                    {item.setup_price ? <span className="text-xs font-semibold text-[var(--color-text-secondary)]">₦{item.setup_price.toLocaleString()}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Setup</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>₦{(proposal.total_setup || 0).toLocaleString()}</p>
            </div>
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Monthly Management</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>₦{(proposal.total_monthly || 0).toLocaleString()}</p>
              {proposal.implementation_timeline && <p className="text-xs text-[var(--color-text-muted)] mt-1">Timeline: {proposal.implementation_timeline}</p>}
              {proposal.support_plan && <p className="text-xs text-[var(--color-text-muted)]">{proposal.support_plan}</p>}
            </div>
          </div>

          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Timeline</h2>
            <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
              <p>Created: {new Date(proposal.created_at).toLocaleDateString("en-NG")}</p>
              {proposal.sent_at && <p>Sent: {new Date(proposal.sent_at).toLocaleDateString("en-NG")}</p>}
              {proposal.accepted_at && <p className="text-emerald-400">Accepted: {new Date(proposal.accepted_at).toLocaleDateString("en-NG")}</p>}
              {proposal.declined_at && <p className="text-red-400">Rejected: {new Date(proposal.declined_at).toLocaleDateString("en-NG")}</p>}
              {proposal.valid_until && <p>Valid until: {new Date(proposal.valid_until).toLocaleDateString("en-NG")}</p>}
              <p className="text-[10px] text-[var(--color-text-muted)]">Status: {proposal.status} · ID: {proposal.id}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}