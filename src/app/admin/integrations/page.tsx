"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AlertTriangle, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface ClientIntegration {
  integration_type: string;
  provider?: string | null;
  status: string;
  last_verified_at?: string | null;
}

interface Client {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  client_integrations?: ClientIntegration[];
}

type Integration = ClientIntegration & {
  id: string;
  client: string;
};

const STATUS_LABELS: Record<string, string> = {
  connected: "Connected",
  needs_attention: "Needs attention",
  not_connected: "Not connected",
  not_configured: "Not configured",
  failed: "Failed",
};

const STATUS_ORDER = ["connected", "needs_attention", "failed", "not_connected", "not_configured"];

function displayStatus(status: string) {
  return STATUS_LABELS[status] || status.replace(/_/g, " ");
}

function statusColor(status: string) {
  switch (status) {
    case "connected":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    case "needs_attention":
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-400";
    default:
      return "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "connected") return <Wifi className="h-4 w-4 text-emerald-400" />;
  if (status === "needs_attention") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  return <WifiOff className={`h-4 w-4 ${status === "failed" ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />;
}

function formatVerified(value?: string | null) {
  if (!value) return "Not verified";
  return new Date(value).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function IntegrationsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/clients");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load integrations");
      setClients(data.clients || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const integrations = useMemo<Integration[]>(
    () => clients.flatMap((client) => (client.client_integrations || []).map((integration, index) => ({
      ...integration,
      id: `${client.id}-${integration.integration_type}-${index}`,
      client: client.company_name || client.contact_name || "Unnamed client",
    }))),
    [clients]
  );

  const filtered = statusFilter === "all" ? integrations : integrations.filter((integration) => integration.status === statusFilter);
  const statusCounts = integrations.reduce<Record<string, number>>((counts, integration) => {
    counts[integration.status] = (counts[integration.status] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="workspace-shell">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="admin-content-gutter">
          <header className="workspace-header mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="workspace-kicker">Delivery health</p>
              <h1 className="mt-3 page-title text-[var(--color-text-primary)]">Integration health</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">Review the connection state of every client integration. Only real records returned by the workspace are shown.</p>
            </div>
            <button type="button" onClick={() => void load()} className="workspace-action workspace-action-secondary">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </header>

          {error && <div role="alert" className="mb-6 border-l-2 border-[var(--color-error)] pl-3 text-sm text-[var(--color-error)]">{error}</div>}

          {loading ? (
            <div className="flex items-center gap-2 py-20 text-sm text-[var(--color-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading integration records…</div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-4">
                {[
                  ["connected", "Connected"],
                  ["needs_attention", "Needs attention"],
                  ["failed", "Failed"],
                  ["not_configured", "Not configured"],
                ].map(([status, label]) => (
                  <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`bg-[var(--color-surface)] p-4 text-left transition-colors hover:bg-[var(--color-surface-raised)] ${statusFilter === status ? "ring-1 ring-inset ring-[var(--color-accent)]" : ""}`}>
                    <p className="system-label text-[var(--color-text-muted)]">{label}</p>
                    <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${status === "connected" ? "text-emerald-400" : status === "needs_attention" ? "text-amber-400" : status === "failed" ? "text-red-400" : "text-[var(--color-text-primary)]"}`}>{statusCounts[status] || 0}</p>
                  </button>
                ))}
              </div>

              <div className="mb-5 flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-3">
                {["all", ...STATUS_ORDER].filter((status) => status === "all" || (statusCounts[status] || 0) > 0).map((status) => (
                  <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`shrink-0 rounded-[var(--radius-control)] px-3 py-2 text-xs font-semibold transition-colors ${statusFilter === status ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>{status === "all" ? "All records" : displayStatus(status)}</button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="border-y border-dashed border-[var(--color-border)] py-20 text-center">
                  <WifiOff className="mx-auto h-7 w-7 text-[var(--color-text-muted)]" />
                  <p className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{integrations.length === 0 ? "No integration records yet" : "No records match this filter"}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">{integrations.length === 0 ? "Integrations will appear here after a real client account is created and configured." : "Choose another status to continue reviewing the delivery surface."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto border-y border-[var(--color-border)]">
                  <table className="w-full min-w-[680px] text-left">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                        <th className="px-4 py-3 system-label">Client</th>
                        <th className="px-4 py-3 system-label">Integration</th>
                        <th className="px-4 py-3 system-label">Status</th>
                        <th className="px-4 py-3 system-label">Last verified</th>
                        <th className="px-4 py-3 system-label">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((integration) => (
                        <tr key={integration.id} className="border-b border-[var(--color-border)]/70 text-sm last:border-0 hover:bg-[var(--color-surface-raised)]">
                          <td className="px-4 py-4 font-medium text-[var(--color-text-primary)]">{integration.client}</td>
                          <td className="px-4 py-4 text-[var(--color-text-secondary)]">{integration.provider || integration.integration_type}</td>
                          <td className="px-4 py-4"><span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${statusColor(integration.status)}`}><StatusIcon status={integration.status} />{displayStatus(integration.status)}</span></td>
                          <td className="px-4 py-4 text-[var(--color-text-muted)]">{formatVerified(integration.last_verified_at)}</td>
                          <td className="px-4 py-4"><button type="button" disabled title="Verification action is not connected to a backend route" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]"><RefreshCw className="h-3.5 w-3.5" /> Verify unavailable</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
