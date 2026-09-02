"use client";
import { provisioningRecords } from "@/lib/mock-operations";
import { Clock, CheckCircle, AlertCircle, Loader2, ArrowRight, RotateCcw } from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string; description: string }> = {
  not_started: { color: "text-gray-400 bg-gray-400/10", icon: Clock, label: "Not Started", description: "Waiting to begin provisioning" },
  waiting_client: { color: "text-amber-400 bg-amber-400/10", icon: Clock, label: "Waiting for Client", description: "Client needs to provide information" },
  waiting_credentials: { color: "text-amber-400 bg-amber-400/10", icon: AlertCircle, label: "Waiting for Credentials", description: "Integration credentials required" },
  provisioning: { color: "text-blue-400 bg-blue-400/10", icon: Loader2, label: "Provisioning", description: "Building automation instance" },
  testing: { color: "text-purple-400 bg-purple-400/10", icon: Loader2, label: "Testing", description: "Running validation tests" },
  failed: { color: "text-red-400 bg-red-400/10", icon: AlertCircle, label: "Failed", description: "Provisioning failed" },
  ready: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Ready for Launch", description: "Passed all tests, awaiting activation" },
  live: { color: "text-emerald-400 bg-emerald-400/10", icon: CheckCircle, label: "Live", description: "Automation is active and running" },
};

export default function ProvisioningPage() {
  const pending = provisioningRecords.filter(p => ["waiting_client", "waiting_credentials", "provisioning", "testing", "failed"].includes(p.status));

  return (
    <div className="max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Provisioning</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{pending.length} need attention · {provisioningRecords.filter(p => p.status === "live").length} live</p>
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

      {/* All Records */}
      <div className="space-y-3">
        {provisioningRecords.map(p => {
          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.not_started;
          const Icon = sc.icon;
          return (
            <div key={p.id} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{p.automation_name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{p.company_name} · {p.client_name} · {p.template_version}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.color}`}>
                  <Icon className={`w-3 h-3 ${p.status === "provisioning" || p.status === "testing" ? "animate-spin" : ""}`} />
                  {sc.label}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">{sc.description}</p>
              {p.error && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <p className="text-xs font-semibold text-red-400 mb-1">Error</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{p.error}</p>
                  <button className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline"><RotateCcw className="w-3 h-3" />Retry</button>
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-text-muted)]">
                {p.started_at && <span>Started: {new Date(p.started_at).toLocaleDateString("en-NG")}</span>}
                {p.completed_at && <span>Completed: {new Date(p.completed_at).toLocaleDateString("en-NG")}</span>}
                {p.retry_count > 0 && <span className="text-amber-400">{p.retry_count} retries</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}