"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Mail, Calendar, RotateCcw, Settings, Plus, Activity, CheckCircle2, AlertCircle, Clock, ArrowRight, Loader2, TrendingUp } from "lucide-react";

interface Automation {
  id: string;
  custom_name: string;
  status: string;
  template_id: string;
  deployed_at: string | null;
  total_runs?: number;
  last_run_at?: string;
  workflow_templates?: { name: string; category: string };
}

interface ClientInfo {
  company_name: string;
  contact_name: string;
  onboarding_status: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof CheckCircle2; label: string; pulse: boolean }> = {
  live: { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: CheckCircle2, label: "Operational", pulse: true },
  pending_activation: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Clock, label: "Awaiting Activation", pulse: false },
  configuring: { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Clock, label: "Configuring", pulse: false },
  testing: { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Activity, label: "Testing", pulse: true },
  pending: { color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20", icon: AlertCircle, label: "Pending Setup", pulse: false },
  paused: { color: "text-gray-400", bg: "bg-gray-400/10", border: "border-gray-400/20", icon: AlertCircle, label: "Paused", pulse: false },
  failed: { color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", icon: AlertCircle, label: "Issue Detected", pulse: false },
};

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  lead_response: Zap, follow_up: Mail, booking: Calendar,
  revenue_recovery: RotateCcw, operations: Settings,
};

const AVAILABLE_MODULES = [
  { key: "lead_response", name: "Lead Response", description: "Capture, qualify, and respond to new leads instantly" },
  { key: "follow_up", name: "Follow-Up", description: "Automated sequences for leads who didn't convert" },
  { key: "booking", name: "Booking", description: "Calendar sync and automated appointment scheduling" },
  { key: "revenue_recovery", name: "Revenue Recovery", description: "Find dormant customers and re-engage them" },
  { key: "operations", name: "Operations", description: "Internal workflows, notifications, and reporting" },
];

export default function DashboardPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) { setLoading(false); return; }
        const me = await meRes.json();
        if (me.isClient && me.organizationId) {
          const autoRes = await fetch("/api/client/automations");
          if (autoRes.ok) {
            const data = await autoRes.json();
            setAutomations(data.automations || []);
            setClient(data.client || null);
          }
        } else if (me.isSuperAdmin || me.isAdmin) {
          window.location.href = "/admin";
          return;
        }
      } catch { /* silent */ } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  const activeAutomations = automations.filter(a => a.status === "live");
  const activeKeys = new Set(activeAutomations.map(a => a.workflow_templates?.category).filter(Boolean));
  const ownedKeys = new Set(automations.map(a => a.workflow_templates?.category).filter(Boolean));

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-1">Dashboard</p>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
            {client?.company_name || "Your Dashboard"}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {["go_live","completed"].includes(client?.onboarding_status || "")
              ? "Your automations are live and processing leads."
              : "Your ELION systems are being set up."}
          </p>
        </div>

        {/* Stats Bento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Active Systems", value: activeAutomations.length, icon: Zap, color: "text-emerald-400" },
            { label: "Total Systems", value: automations.length, icon: Settings, color: "text-blue-400" },
            { label: "Leads Processed", value: "-", icon: Users, color: "text-purple-400" },
            { label: "Avg Response", value: "8s", icon: TrendingUp, color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[var(--color-surface-raised)] rounded-xl p-4 border border-[var(--color-border)] group hover:border-[var(--color-accent)]/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                {stat.label === "Active Systems" && activeAutomations.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                {stat.value}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Your Systems */}
        {automations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Your ELION Systems</h2>
              <Link href="/dashboard/onboarding" className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                Onboarding <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {automations.map((auto) => {
                const Icon = CATEGORY_ICONS[auto.workflow_templates?.category || ""] || Zap;
                const config = STATUS_CONFIG[auto.status] || STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                return (
                  <div key={auto.id} className={`flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border ${config.border} transition-all hover:bg-[var(--color-surface-elevated)]/50`}>
                    <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--color-text-primary)]">
                        {auto.custom_name || auto.workflow_templates?.name || "Automation"}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                        {config.label}
                        {auto.total_runs ? <span className="text-[var(--color-text-muted)]">· {auto.total_runs} runs</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {config.pulse && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {automations.length === 0 && (
          <div className="p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Your automation is on its way</h3>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mb-4">
              Once ELION deploys your systems, they'll appear here with real-time status and results.
            </p>
            <Link href="/dashboard/onboarding" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-all">
              View Onboarding <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Available Systems */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Available Systems</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {AVAILABLE_MODULES.map((mod) => {
              const isOwned = ownedKeys.has(mod.key);
              const isActive = activeKeys.has(mod.key);
              const Icon = CATEGORY_ICONS[mod.key] || Zap;
              return (
                <div key={mod.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isOwned ? "bg-[var(--color-surface-raised)] border-[var(--color-accent)]/20" : "bg-[var(--color-surface-raised)] border-[var(--color-border)] opacity-50"
                }`}>
                  <div className={`p-1.5 rounded-lg ${isOwned ? "bg-[var(--color-accent)]/10" : "bg-[var(--color-surface)]"} shrink-0`}>
                    <Icon className={`w-4 h-4 ${isOwned ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{mod.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{mod.description}</div>
                  </div>
                  {isOwned ? (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                      {isActive ? "Active" : "Provisioning"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Available
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
