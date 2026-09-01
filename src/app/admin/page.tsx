"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Users, Zap, BarChart3, Plus, ArrowRight, CheckCircle, Loader2, Bell } from "lucide-react";

interface AdminStats {
  totalClients: number; activeClients: number; totalLeads: number; todayLeads: number;
  totalAutomations: number; activeAutomations: number;
  recentLeads: Array<{ id: string; name: string; email: string; source: string; created_at: string; status: string }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications?unread=true").then((r) => r.json()).then((d) => setUnreadCount(d.unreadCount || 0)).catch(() => {});
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-accent)]/10"><Shield className="w-6 h-6 text-[var(--color-accent)]" /></div>
          <div><h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION Admin</h1><p className="text-sm text-[var(--color-text-muted)]">Platform management</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/notifications" className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>}
          </Link>
          <Link href="/admin/clients/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors"><Plus className="w-4 h-4" /> New Client</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SC label="Total Clients" value={stats?.totalClients ?? 0} icon={Users} sub={(stats?.activeClients ?? 0) + " active"} />
        <SC label="Today Leads" value={stats?.todayLeads ?? 0} icon={BarChart3} sub={(stats?.totalLeads ?? 0) + " total"} />
        <SC label="Automations" value={stats?.activeAutomations ?? 0} icon={Zap} sub={(stats?.totalAutomations ?? 0) + " total"} />
        <SC label="Health" value={stats?.activeAutomations ? "Online" : "---"} icon={CheckCircle} sub="Operational" isText />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/clients" className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group"><div className="flex items-center justify-between mb-3"><Users className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" /><ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" /></div><h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Clients</h3><p className="text-xs text-[var(--color-text-muted)]">Manage accounts</p></Link>
        <Link href="/admin/leads" className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group"><div className="flex items-center justify-between mb-3"><BarChart3 className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" /><ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" /></div><h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Leads</h3><p className="text-xs text-[var(--color-text-muted)]">View all leads</p></Link>
        <Link href="/admin/analytics" className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group"><div className="flex items-center justify-between mb-3"><BarChart3 className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" /><ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" /></div><h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Analytics</h3><p className="text-xs text-[var(--color-text-muted)]">Conversion tracking</p></Link>
        <Link href="/admin/status" className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group"><div className="flex items-center justify-between mb-3"><CheckCircle className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]" /><ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" /></div><h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Status</h3><p className="text-xs text-[var(--color-text-muted)]">Manage status page</p></Link>
      </div>

      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]"><h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent Leads</h2><Link href="/admin/leads" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link></div>
        {stats?.recentLeads && stats.recentLeads.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">{stats.recentLeads.map((lead) => (<div key={lead.id} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium text-[var(--color-text-primary)]">{lead.name || "Unknown"}</p><p className="text-xs text-[var(--color-text-muted)]">{lead.email} · {lead.source || "direct"}</p></div><span className="text-xs text-[var(--color-text-muted)]">{new Date(lead.created_at).toLocaleDateString()}</span></div>))}</div>
        ) : (<div className="px-5 py-8 text-center"><p className="text-sm text-[var(--color-text-muted)]">No leads yet.</p></div>)}
      </div>
    </div>
  );
}

function SC({ label, value, icon: Icon, sub, isText }: { label: string; value: number | string; icon: any; sub: string; isText?: boolean }) {
  return (<div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]"><div className="flex items-center justify-between mb-2"><Icon className="w-4 h-4 text-[var(--color-text-muted)]" /></div><p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{isText ? value : (typeof value === "number" ? value.toLocaleString() : value)}</p><p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p><p className="text-[10px] text-[var(--color-text-muted)] mt-1">{sub}</p></div>);
}