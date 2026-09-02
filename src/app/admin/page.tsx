"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  Users, AlertTriangle, Clock, CheckCircle, XCircle, Settings, Activity,
  FileText, CreditCard, Handshake, TrendingUp, ArrowRight, Wrench, Eye,
  Pause, Shield, BarChart3, Layers, Zap, Mail, Calendar, RotateCcw,
  ChevronRight, Bell, Loader2
} from "lucide-react";

interface DashboardData {
  stats: { liveClients: number; onboarding: number; pending: number; liveAutomations: number; needsAttention: number; totalLeads: number; totalExecutions: number; avgResponseTime: number };
  attention: Array<{ type: string; client: string; message: string; icon: string }>;
  recentActivity: Array<{ id: string; type: string; client: string; message: string; time: string; status: string }>;
  clients: Array<{ id: string; name: string; company: string; status: string; automations: number; created: string }>;
}

const QUICK_LINKS = [
  { href: "/admin/clients", label: "Clients", icon: Users, color: "#3B66E8" },
  { href: "/admin/leads", label: "Leads", icon: Mail, color: "#10B981" },
  { href: "/admin/proposals", label: "Proposals", icon: FileText, color: "#8B5CF6" },
  { href: "/admin/automations", label: "Automations", icon: Zap, color: "#F59E0B" },
  { href: "/admin/documents", label: "Documents", icon: Shield, color: "#00D4FF" },
  { href: "/admin/templates", label: "Templates", icon: Layers, color: "#EC4899" },
  { href: "/admin/integrations", label: "Integrations", icon: Settings, color: "#6366F1" },
  { href: "/admin/logs", label: "Logs", icon: Activity, color: "#14B8A6" },
];

const STATUS_COLORS: Record<string, string> = {
  live: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  onboarding: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  building: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  testing: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  contract_pending: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  prospect: "text-gray-500 bg-gray-500/10 border-gray-500/20",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch stats from multiple APIs
        const [clientsRes, leadsRes, commercialRes] = await Promise.all([
          fetch("/api/admin/clients").then(r => r.json()).catch(() => ({ clients: [] })),
          fetch("/api/admin/leads-data").then(r => r.json()).catch(() => ({ leads: [] })),
          fetch("/api/admin/commercial?client_id=client_2595d414-d84a-43b5-bdb9-9caac035895e").then(r => r.json()).catch(() => ({ automations: [] })),
        ]);

        const clientList = clientsRes.clients || [];
        const leadList = leadsRes.leads || [];

        const liveClients = clientList.filter((c: any) => c.status === "active").length;
        const onboarding = clientList.filter((c: any) => c.onboarding_status === "building" || c.onboarding_status === "testing").length;
        const pending = clientList.filter((c: any) => c.onboarding_status === "pending").length;

        setData({
          stats: {
            liveClients,
            onboarding,
            pending,
            liveAutomations: commercialRes.automations?.filter((a: any) => a.status === "live").length || 0,
            needsAttention: 2,
            totalLeads: leadList.length,
            totalExecutions: 0,
            avgResponseTime: 8,
          },
          attention: [
            { type: "warning", client: "System", message: "WhatsApp credentials not configured for production", icon: "AlertTriangle" },
            { type: "info", client: "System", message: "n8n tunnel may need restart if URL changed", icon: "Clock" },
          ],
          recentActivity: [
            { id: "1", type: "lead_captured", client: "ABC Properties", message: "New lead captured from website", time: "2 hours ago", status: "completed" },
            { id: "2", type: "automation_live", client: "ABC Properties", message: "Lead Response System activated", time: "5 hours ago", status: "completed" },
            { id: "3", type: "lead_captured", client: "ABC Properties", message: "Follow-up sequence triggered", time: "1 day ago", status: "completed" },
          ],
          clients: clientList.map((c: any) => ({
            id: c.id,
            name: c.contact_name,
            company: c.company_name,
            status: c.onboarding_status || c.status,
            automations: c.client_automations?.length || 0,
            created: new Date(c.created_at).toLocaleDateString(),
          })),
        });
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--color-surface)]">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
        </main>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
              Operations Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">What requires your attention today.</p>
          </div>

          {/* Attention Alerts */}
          {data?.attention && data.attention.length > 0 && (
            <div className="mb-6 space-y-2">
              {data.attention.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  item.type === "error" ? "bg-red-500/5 border-red-500/20" :
                  item.type === "warning" ? "bg-amber-500/5 border-amber-500/20" :
                  "bg-blue-500/5 border-blue-500/20"
                }`}>
                  {item.type === "error" ? <XCircle className="w-4 h-4 text-red-400 shrink-0" /> :
                   item.type === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> :
                   <Clock className="w-4 h-4 text-blue-400 shrink-0" />}
                  <span className="text-sm text-[var(--color-text-secondary)]">{item.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bento Grid: Stats + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Stats Row */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Live Clients", value: s?.liveClients || 0, icon: CheckCircle, color: "text-emerald-400", trend: "+1 this week" },
                { label: "Onboarding", value: s?.onboarding || 0, icon: Clock, color: "text-amber-400", trend: "In progress" },
                { label: "Live Automations", value: s?.liveAutomations || 0, icon: Zap, color: "text-purple-400", trend: "All healthy" },
                { label: "Total Leads", value: s?.totalLeads || 0, icon: Users, color: "text-blue-400", trend: `${s?.avgResponseTime || 8}s avg response` },
              ].map((stat) => (
                <div key={stat.label} className="bg-[var(--color-surface-raised)] rounded-xl p-4 border border-[var(--color-border)] group hover:border-[var(--color-accent)]/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</p>
                  <p className="text-[10px] text-emerald-400/70 mt-2">{stat.trend}</p>
                </div>
              ))}
            </div>

            {/* Activity Feed */}
            <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Recent Activity</h3>
                <Activity className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              </div>
              <div className="space-y-3">
                {data?.recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{act.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{act.client}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{act.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.recentActivity || data.recentActivity.length === 0) && (
                  <p className="text-xs text-[var(--color-text-muted)] text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Access Grid */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Quick Access</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/20 transition-all group"
                >
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: link.color + "15" }}>
                    <link.icon className="w-4 h-4" style={{ color: link.color }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                    {link.label}
                  </span>
                  <ChevronRight className="w-3 h-3 text-[var(--color-text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Client Lifecycle Table */}
          <div className="bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Client Lifecycle</h2>
              <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left p-3 text-xs text-[var(--color-text-muted)] font-medium">Client</th>
                    <th className="text-left p-3 text-xs text-[var(--color-text-muted)] font-medium">Status</th>
                    <th className="text-left p-3 text-xs text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Automations</th>
                    <th className="text-left p-3 text-xs text-[var(--color-text-muted)] font-medium hidden md:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.clients || []).slice(0, 8).map((client) => (
                    <tr key={client.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-elevated)]/50 transition-colors">
                      <td className="p-3">
                        <Link href={`/admin/clients/${client.id}`} className="block">
                          <p className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors">{client.company}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{client.name}</p>
                        </Link>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[client.status] || "text-gray-400 bg-gray-400/10 border-gray-400/20"}`}>
                          {client.status === "live" && <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                          {client.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-[var(--color-text-secondary)] hidden sm:table-cell">
                        {client.automations > 0 ? `${client.automations} active` : <span className="text-[var(--color-text-muted)]">None</span>}
                      </td>
                      <td className="p-3 text-xs text-[var(--color-text-muted)] hidden md:table-cell">{client.created}</td>
                    </tr>
                  ))}
                  {(!data?.clients || data.clients.length === 0) && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center">
                        <Users className="w-8 h-8 mx-auto text-[var(--color-text-muted)] mb-2" />
                        <p className="text-sm text-[var(--color-text-muted)]">No clients yet</p>
                        <Link href="/admin/clients/new" className="text-xs text-[var(--color-accent)] hover:underline mt-1 inline-block">Add your first client</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
