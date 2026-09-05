"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  Users, AlertTriangle, CheckCircle, XCircle, ArrowRight, Eye, FileText, CreditCard,
  Shield, Handshake, Wrench, Zap, Mail, Loader2, Bell, BellRing, CheckCheck, TrendingUp,
  Activity, Send
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsData {
  totalClients: number; activeClients: number; totalLeads: number; todayLeads: number;
  totalAutomations: number; activeAutomations: number; totalRevenue: number; mrr: number;
  conversionRate: number;
  recentLeads: Array<{ id: string; name: string; email: string; company: string; status: string; created_at: string }>;
}
interface Notif { id: string; type: string; title: string; message: string; is_read: boolean; created_at: string; clients?: { company_name?: string; contact_name?: string } | null }

const TYPE_UI: Record<string, { icon: LucideIcon; color: string }> = {
  document_viewed: { icon: Eye, color: "#3B66E8" },
  document_accepted: { icon: CheckCircle, color: "#10B981" },
  document_signed: { icon: Shield, color: "#8B5CF6" },
  document_paid: { icon: CreditCard, color: "#F59E0B" },
  onboarding_complete: { icon: Handshake, color: "#10B981" },
  provisioning_failed: { icon: XCircle, color: "#EF4444" },
  new_lead: { icon: Mail, color: "#3B66E8" },
  onboarding_email_sent: { icon: Send, color: "#06B6D4" },
  payment_recorded: { icon: CreditCard, color: "#F59E0B" },
  contract_signed: { icon: FileText, color: "#8B5CF6" },
};

const QUICK_LINKS = [
  { href: "/admin/leads", label: "Leads", icon: Mail, color: "#10B981" },
  { href: "/admin/clients", label: "Clients", icon: Users, color: "#3B66E8" },
  { href: "/admin/proposals", label: "Proposals", icon: FileText, color: "#8B5CF6" },
  { href: "/admin/automations", label: "Automations", icon: Zap, color: "#F59E0B" },
  { href: "/admin/onboarding", label: "Onboarding", icon: Send, color: "#06B6D4" },
  { href: "/admin/integrations", label: "Integrations", icon: Wrench, color: "#6366F1" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, color: "#EC4899" },
  { href: "/admin/status", label: "Status", icon: Activity, color: "#14B8A6" },
];

const fromNow = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d === 1 ? "1d ago" : `${d}d ago`;
};

const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [readBusy, setReadBusy] = useState(false);

  const loadNotifications = useCallback(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => { setNotifs(d.notifications || []); setUnread(d.unread || 0); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((b) => { if (b) setStats(b); setLoading(false); })
      .catch(() => setLoading(false));
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id?: string) => {
    setReadBusy(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { mark_all: true }),
      });
      loadNotifications();
    } finally {
      setReadBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--color-surface)]">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" /></main>
      </div>
    );
  }

  const feed = notifs.slice(0, 6);
  const s = stats;

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-5 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-7 flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Operations</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}  · what needs you today.
              </p>
            </div>
            <Link href="/admin/notifications" className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)] transition-all">
              {unread > 0 ? <BellRing className="w-4 h-4 text-amber-400" /> : <Bell className="w-4 h-4" />}
              Notifications
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>
              )}
            </Link>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
            {[
              { label: "Active clients", value: s?.activeClients ?? 0, sub: `${s?.totalClients ?? 0} total`, icon: Users, color: "text-emerald-400", href: "/admin/clients" },
              { label: "Contract value (est.)", value: naira(s?.totalRevenue ?? 0), sub: "one-time setups", icon: FileText, color: "text-blue-400", href: "/admin/proposals" },
              { label: "MRR (est.)", value: naira(s?.mrr ?? 0), sub: "active clients", icon: TrendingUp, color: "text-purple-400", href: "/admin/payments" },
              { label: "Live automations", value: `${s?.activeAutomations ?? 0}/${s?.totalAutomations ?? 0}`, sub: "configured systems", icon: Zap, color: "text-amber-400", href: "/admin/automations" },
              { label: "Total leads", value: s?.totalLeads ?? 0, sub: `${s?.todayLeads ?? 0} today · ${s?.conversionRate ?? 0}% → client`, icon: Mail, color: "text-cyan-400", href: "/admin/leads" },
              { label: "Unread alerts", value: unread, sub: "inbox", icon: Bell, color: unread > 0 ? "text-amber-400" : "text-[var(--color-text-muted)]", href: "/admin/notifications" },
            ].map((stat) => (
              <Link key={stat.label} href={stat.href} className="group bg-[var(--color-surface-raised)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-accent)]/25 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{stat.value}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{stat.label}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]/60 mt-0.5 truncate">{stat.sub}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Notification feed */}
            <div className="lg:col-span-2 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Latest notifications</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{unread > 0 ? `${unread} unread : click an item to mark it read` : "All caught up"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={() => markRead()} disabled={readBusy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-all">
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  <Link href="/admin/notifications" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link>
                </div>
              </div>
              <div>
                {feed.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="w-8 h-8 text-[var(--color-text-muted)]/50 mx-auto mb-3" />
                    <p className="text-sm text-[var(--color-text-muted)]">No notifications yet</p>
                    <p className="text-xs text-[var(--color-text-muted)]/60 mt-1">Lifecycle events (onboarding sends, document activity, payments) will appear here.</p>
                  </div>
                ) : (
                  feed.map((n) => {
                    const t = TYPE_UI[n.type] || TYPE_UI.document_viewed;
                    const Icon = t.icon;
                    return (
                      <button
                        key={n.id}
                        onClick={() => !n.is_read && markRead(n.id)}
                        disabled={n.is_read}
                        className={"w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[var(--color-border)]/50 last:border-0 transition-all " + (n.is_read ? "opacity-45 hover:opacity-70" : "hover:bg-[var(--color-accent)]/[0.03] cursor-pointer")}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + "14" }}>
                          <Icon className="w-4 h-4" style={{ color: t.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={"text-sm font-medium truncate " + (n.is_read ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]")}>{n.title}</p>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />}
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-1">{n.message}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]/60 mt-1">
                            {n.clients?.company_name ? n.clients.company_name + " · " : ""}{fromNow(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && <span className="text-[10px] text-[var(--color-accent)] shrink-0 mt-1 font-medium">Tap to read</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent leads */}
            <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent leads</h2>
                <Link href="/admin/leads" className="text-xs text-[var(--color-accent)] hover:underline">View all</Link>
              </div>
              <div className="divide-y divide-[var(--color-border)]/50">
                {(s?.recentLeads || []).slice(0, 6).map((l) => (
                  <Link key={l.id} href={`/admin/leads?lead=${l.id}`} className="block px-4 py-3 hover:bg-[var(--color-accent)]/[0.03] transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{l.name || l.email}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] capitalize shrink-0">{l.status || "new"}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{l.company || l.email}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]/60 mt-1">{fromNow(l.created_at)}</p>
                  </Link>
                ))}
                {(!s?.recentLeads || s.recentLeads.length === 0) && (
                  <div className="text-center py-10">
                    <Mail className="w-8 h-8 text-[var(--color-text-muted)]/50 mx-auto mb-3" />
                    <p className="text-sm text-[var(--color-text-muted)]">No leads captured yet</p>
                    <Link href="/admin/leads" className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block">Open Leads</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick access */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Workspace</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/25 transition-all group">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: link.color + "15" }}>
                    <link.icon className="w-4 h-4" style={{ color: link.color }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Lifecycle warning strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.04]">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <span className="text-[var(--color-text-primary)] font-medium">Sales flow:</span>{" "}
              Audit → Proposal → Contract → Payment → Client → Onboarding. Start from{" "}
              <Link href="/admin/leads" className="text-[var(--color-accent)] hover:underline">Leads</Link>, move qualified leads through{" "}
              <Link href="/admin/proposals" className="text-[var(--color-accent)] hover:underline">Proposals</Link>, and run onboarding from{" "}
              <Link href="/admin/onboarding" className="text-[var(--color-accent)] hover:underline">Onboarding</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
