"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Loader2, CheckCircle, AlertCircle, Clock, Pause } from "lucide-react";

interface Automation {
  id: string;
  client_id: string;
  template_id: string;
  status: string;
  template_version: string;
  created_at: string;
  clients: { company_name: string; contact_name: string } | null;
  workflow_templates: { name: string; category: string; version: string } | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  active: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle, label: "Active" },
  provisioning: { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Clock, label: "Provisioning" },
  testing: { color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Clock, label: "Testing" },
  paused: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Pause, label: "Paused" },
  failed: { color: "text-red-400 bg-red-400/10 border-red-400/20", icon: AlertCircle, label: "Failed" },
  configured: { color: "text-gray-400 bg-gray-400/10 border-gray-400/20", icon: Clock, label: "Configured" },
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/automations")
      .then((r) => r.json())
      .then((d) => { setAutomations(d.automations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
    </div>
  );

  const activeCount = automations.filter(a => a.status === "active").length;

  return (
    <div className="max-w-5xl p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Automations</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{activeCount} active · {automations.length} total</p>
        </div>
      </div>

      {automations.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
          <Zap className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No automations yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">Automations appear here after client provisioning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => {
            const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.configured;
            const Icon = sc.icon;
            return (
              <div key={a.id} className="p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {a.workflow_templates?.name || "Unknown Template"}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {a.clients?.company_name || "Unknown Client"} · v{a.template_version || "?"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${sc.color}`}>
                    <Icon className="w-3 h-3" />
                    {sc.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                  <span>Category: <span className="text-[var(--color-text-secondary)]">{a.workflow_templates?.category || "—"}</span></span>
                  <span>Created: <span className="text-[var(--color-text-secondary)]">{new Date(a.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}