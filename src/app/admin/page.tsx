"use client";
import Link from "next/link";
import { Shield, Users, Zap, BarChart3, Plus, ArrowRight, CheckCircle, FileText, CreditCard, FileSignature, Clock } from "lucide-react";
import { allClients, allLeads, allProposals, allContracts, allPayments } from "@/lib/mock-lifecycle";

const LIFECYCLE_COLORS: Record<string, string> = {
  prospect: "text-gray-400 bg-gray-400/10",
  contract_pending: "text-amber-400 bg-amber-400/10",
  payment_pending: "text-amber-400 bg-amber-400/10",
  onboarding: "text-blue-400 bg-blue-400/10",
  implementation: "text-blue-400 bg-blue-400/10",
  testing: "text-purple-400 bg-purple-400/10",
  live: "text-emerald-400 bg-emerald-400/10",
  paused: "text-yellow-400 bg-yellow-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

export default function AdminPage() {
  const liveClients = allClients.filter(c => c.lifecycle_status === "live").length;
  const onboardingClients = allClients.filter(c => c.lifecycle_status === "onboarding").length;
  const pendingContracts = allContracts.filter(c => c.status !== "signed").length;
  const pendingPayments = allPayments.filter(p => p.status === "pending").length;

  return (
    <div className="max-w-5xl p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent)]/10"><Shield className="w-6 h-6 text-[var(--color-accent)]" /></div>
          <div><h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION Admin</h1><p className="text-sm text-[var(--color-text-muted)]">Platform operations</p></div>
        </div>
        <Link href="/admin/clients/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"><Plus className="w-4 h-4" /> New Client</Link>
      </div>

      {/* Attention Required */}
      {(pendingContracts > 0 || pendingPayments > 0) && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">Requires Attention</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {pendingContracts > 0 && <Link href="/admin/contracts" className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-amber-400 transition-colors"><FileText className="w-4 h-4" />{pendingContracts} contract(s) pending</Link>}
            {pendingPayments > 0 && <Link href="/admin/payments" className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-amber-400 transition-colors"><CreditCard className="w-4 h-4" />{pendingPayments} payment(s) pending</Link>}
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <Users className="w-4 h-4 text-[var(--color-text-muted)] mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{allClients.length}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Total Clients</p>
          <p className="text-[10px] text-emerald-400 mt-1">{liveClients} live</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <BarChart3 className="w-4 h-4 text-[var(--color-text-muted)] mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{allLeads.length}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Leads</p>
          <p className="text-[10px] text-[var(--color-accent)] mt-1">{allLeads.filter(l => l.lead_status === "qualified").length} qualified</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <FileSignature className="w-4 h-4 text-[var(--color-text-muted)] mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{allProposals.length}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Proposals</p>
          <p className="text-[10px] text-emerald-400 mt-1">{allProposals.filter(p => p.status === "accepted").length} accepted</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <Zap className="w-4 h-4 text-[var(--color-text-muted)] mb-2" />
          <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{onboardingClients}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Onboarding</p>
          <p className="text-[10px] text-blue-400 mt-1">{onboardingClients} in progress</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/admin/clients", label: "Clients", icon: Users, desc: "Manage accounts" },
          { href: "/admin/proposals", label: "Proposals", icon: FileSignature, desc: "Send proposals" },
          { href: "/admin/contracts", label: "Contracts", icon: FileText, desc: "Track signings" },
          { href: "/admin/payments", label: "Payments", icon: CreditCard, desc: "View payments" },
        ].map(item => (
          <Link key={item.href} href={item.href} className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group">
            <div className="flex items-center justify-between mb-3"><item.icon className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" /><ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" /></div>
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{item.label}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Client Lifecycle */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Client Lifecycle</h2>
          <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {allClients.map(c => (
            <Link key={c.id} href={`/admin/clients/${c.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--color-surface)] transition-colors">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{c.organization.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{c.contact_name} · {c.organization.industry}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${LIFECYCLE_COLORS[c.lifecycle_status] || "text-gray-400 bg-gray-400/10"}`}>
                {c.lifecycle_status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}