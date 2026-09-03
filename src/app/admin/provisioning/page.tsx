"use client";
import { useEffect, useState } from "react";
import { provisioningRecords } from "@/lib/mock-operations";
import { Clock, CheckCircle, AlertCircle, Loader2, ArrowRight, RotateCcw, Database } from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; description: string }> = {
  not_started: { color: "text-gray-400 bg-gray-400/10", icon: Clock, label: "Not Started", description: "Waiting to begin provisioning" },
  waiting_client: { color: "text-amber-400 bg-amber-400/10", icon: Clock, label: "Waiting for Client", description: "Client needs to provide information" },
  waiting_credentials: { color: "text-amber-400 bg-amber-400/10", icon: AlertCircle, label: "Waiting for Credentials", description: "Integration credentials required" },
  provisioning: { color: "text-blue-400 bg-blue-400/10", icon: Loader2, label: "Provisioning", description: "Building automation instance" },
  testing: { color: "text-purple-400 bg-purple-400/10", icon: Loader2, label: "Testing", description: "Running validation tests" },
  failed: { color: "text-red-400 bg-red-400/10", icon: AlertCircle, label: "Failed", description: "Provisioning failed" },
  ready: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Ready for Launch", description: "Passed all tests, awaiting activation" },
  live: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Live", description: "Automation is active and running" },
  paused: { color: "text-yellow-400 bg-yellow-400/10", icon: Clock, label: "Paused", description: "Temporarily stopped by admin" },
  archived: { color: "text-gray-500 bg-gray-500/10", icon: Clock, label: "Archived", description: "No longer active" },
};

// client_automations.status -> provisioning view status
const REAL_STATUS_MAP: Record<string, string> = {
  pending: "not_started",
  configuring: "waiting_credentials",
  testing: "testing",
  pending_activation: "ready",
  live: "live",
  paused: "paused",
  failed: "failed",
  archived: "archived",
};

interface RealAutomation {
  id: string;
  status: string;
  custom_name: string | null;
  deployed_at: string | null;
  created_at: string;
  clients: { id: string; contact_name: string | null; company_name: string | null } | null;
  workflow_templates: { name: string; category: string | null; description: string | null } | null;
}

export default function ProvisioningPage() {
  const [real, setReal] = useState<RealAutomation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/automations")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setReal(d.automations || []);
      })
      .catch(() => setError("Could not load automations"));
  }, []);

  const pendingReal = (real || []).filter((a) => ["pending", "configuring", "testing", "failed", "paused"].includes(a.status));
  const liveReal = (real || []).filter((a) => a.status === "live");
  const demoPending = provisioningRecords.filter((p) => ["waiting_client", "waiting_credentials", "provisioning", "testing", "failed"].includes(p.status));

  const renderCard = (key: string, name: string, company: string, contact: string | null, version: string, statusKey: string, errorMsg?: string | null, createdAt?: string, startedAt?: string) => {
    const sc = STATUS_CONFIG[statusKey] || STATUS_CONFIG.not_started;
    const Icon = sc.icon;
    return (
      <div key={key} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{name}</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{company}{contact ? ` · ${contact}` : ""}{version ? ` · ${version}` : ""}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
            <Icon className={`w-3 h-3 ${statusKey === "provisioning" || statusKey === "testing" ? "animate-spin" : ""}`} />
            {sc.label}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">{sc.description}</p>
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
            <p className="text-xs font-semibold text-red-400 mb-1">Error</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{errorMsg}</p>
            <button className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"><RotateCcw className="w-3 h-3" />Retry</button>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-text-muted)]">
            <span>Created: {new Date(createdAt).toLocaleDateString("en-NG")}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Provisioning</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {real === null ? "Loading automations…" : `${pendingReal.length} need attention · ${liveReal.length} live`}
        </p>
      </div>

      {/* Lifecycle Visual */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Provisioning Lifecycle</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["Purchased", "Entitlement", "Configuration", "Credentials", "Provision", "Test", "Activate"].map((step, i) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">{step}</div>
              {i < 6 && <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Real automation instances from the database */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2"><Database className="w-4 h-4 text-[var(--color-accent)]" /> Client automations</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 uppercase tracking-wide">Live database</span>
      </div>

      {real === null && !error && (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading automations…
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400 mb-4">
          Could not load automations: {error}
        </div>
      )}
      {real !== null && real.length === 0 && !error && (
        <div className="p-8 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 text-center">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">No automations yet</p>
          <p className="text-xs text-[var(--color-text-muted)]">Automation instances appear here after a client is deployed through the Deploy Systems flow.</p>
        </div>
      )}
      {real !== null && real.length > 0 && (
        <div className="space-y-3">
          {real.map((a) =>
            renderCard(
              a.id,
              a.custom_name || a.workflow_templates?.name || "Automation",
              a.clients?.company_name || a.clients?.id || "Unknown client",
              a.clients?.contact_name || null,
              "v1.0",
              REAL_STATUS_MAP[a.status] || a.status,
              null,
              a.created_at
            )
          )}
        </div>
      )}

      {/* Demo scenarios (fixed sample data, not real clients) */}
      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Demo scenarios</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wide">Sample data</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">Illustrative records used to preview every provisioning state. They are not real client automations.</p>
      <div className="space-y-3">
        {provisioningRecords.map((p) =>
          renderCard(
            p.id,
            p.automation_name,
            p.company_name,
            p.client_name,
            p.template_version,
            p.status,
            p.error,
            p.created_at
          )
        )}
      </div>
    </div>
  );
}
