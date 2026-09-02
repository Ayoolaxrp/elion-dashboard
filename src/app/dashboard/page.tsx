"use client";

import { useEffect, useState } from "react";
import { Zap, Mail, Calendar, RotateCcw, Settings, Plus, Activity, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/sidebar";

interface Automation {
  id: string;
  custom_name: string;
  status: string;
  template_id: string;
  deployed_at: string | null;
  workflow_templates?: { name: string; category: string };
}

interface ClientInfo {
  company_name: string;
  onboarding_status: string;
}

const statusColors: Record<string, string> = {
  live: "text-[var(--color-success)]",
  pending_activation: "text-[var(--color-warning)]",
  configuring: "text-[var(--color-warning)]",
  testing: "text-[var(--color-accent)]",
  pending: "text-[var(--color-text-muted)]",
  paused: "text-[var(--color-text-muted)]",
  failed: "text-[var(--color-error)]",
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  live: CheckCircle2, pending_activation: Clock, configuring: Clock,
  testing: Activity, pending: AlertCircle, paused: AlertCircle, failed: AlertCircle,
};

const statusLabels: Record<string, string> = {
  live: "Operational", pending_activation: "Awaiting Activation", configuring: "Configuring",
  testing: "Testing", pending: "Pending Setup", paused: "Paused", failed: "Issue Detected",
};

const categoryIcons: Record<string, typeof Zap> = {
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
        <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeAutomations = automations.filter(a => a.status === "live");
  const activeKeys = new Set(activeAutomations.map(a => a.workflow_templates?.category).filter(Boolean));
  const ownedKeys = new Set(automations.map(a => a.workflow_templates?.category).filter(Boolean));

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <DashboardSidebar />
      <div className="lg:ml-60 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
          {client?.company_name || "Your Dashboard"}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {["go_live","completed"].includes(client?.onboarding_status || "")
            ? "Your automations are live and processing."
            : "Your ELION systems are being set up."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{activeAutomations.length}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Active Systems</div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{automations.length}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Total Systems</div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>—</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Leads Processed</div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>—</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">Responses Sent</div>
        </div>
      </div>

      {automations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Your ELION Systems</h2>
          <div className="space-y-2">
            {automations.map((auto) => {
              const Icon = categoryIcons[auto.workflow_templates?.category || ""] || Zap;
              const StatusIcon = statusIcons[auto.status] || AlertCircle;
              const color = statusColors[auto.status] || "text-[var(--color-text-muted)]";
              return (
                <div key={auto.id} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                  <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 shrink-0">
                    <Icon className="w-4 h-4 text-[var(--color-accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{auto.custom_name || auto.workflow_templates?.name || "Automation"}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{statusLabels[auto.status] || auto.status}</div>
                  </div>
                  <StatusIcon className={`w-4 h-4 shrink-0 ${color}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {automations.length === 0 && (
        <div className="p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Your automation is ready</h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">Once ELION deploys your systems, they'll appear here with real-time status and results.</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Available Systems</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_MODULES.map((mod) => {
            const isOwned = ownedKeys.has(mod.key);
            const isActive = activeKeys.has(mod.key);
            const Icon = categoryIcons[mod.key] || Zap;
            return (
              <div key={mod.key} className={`p-4 rounded-xl border transition-colors ${isOwned ? "bg-[var(--color-surface-raised)] border-[var(--color-accent)]/20" : "bg-[var(--color-surface-raised)] border-[var(--color-border)] opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-surface)] shrink-0"><Icon className="w-4 h-4 text-[var(--color-text-muted)]" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{mod.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{mod.description}</div>
                  </div>
                  {isOwned ? (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${isActive ? "text-[var(--color-success)] bg-[var(--color-success)]/10" : "text-[var(--color-warning)] bg-[var(--color-warning)]/10"}`}>{isActive ? "Active" : "Provisioning"}</span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded flex items-center gap-1"><Plus className="w-3 h-3" /> Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
