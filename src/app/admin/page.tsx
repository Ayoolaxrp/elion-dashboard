import { Shield, Users, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Clients", value: "—", icon: Users, href: "/admin/clients", description: "Manage client accounts and provisioning" },
  { label: "Leads", value: "—", icon: BarChart3, href: "/admin/leads", description: "View all incoming leads" },
  { label: "Automations", value: "—", icon: Zap, href: "/admin/clients", description: "Active automation systems" },
];

export default function AdminPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-[var(--color-accent)]/10">
          <Shield className="w-6 h-6 text-[var(--color-accent)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
            ELION Admin
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">Platform management and client operations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              <span className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                {stat.value}
              </span>
            </div>
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">{stat.label}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{stat.description}</p>
          </Link>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/clients/new"
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            + New Client
          </Link>
          <Link
            href="/admin/leads"
            className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors"
          >
            View Leads
          </Link>
          <Link
            href="/funnel#audit"
            className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors"
          >
            Run Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
