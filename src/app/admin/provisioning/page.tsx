"use client";
import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Clock, CheckCircle, AlertCircle, Loader2, RotateCcw, Zap,
  Play, Pause, ShieldAlert, Cpu, RefreshCw,
} from "lucide-react";

interface LastAttempt {
  action: string;
  status: string;
  at: string | null;
  error: string | null;
}
interface ProvisionRow {
  automation_id: string;
  automation_name: string;
  template_slug: string;
  template_category: string | null;
  client_id: string | null;
  client_name: string | null;
  plan: string | null;
  entitled: boolean;
  status: string;
  derived_state: string;
  missing_requirements: string[];
  configuration: string;
  credentials: string;
  integrations: string;
  provisioning: string;
  tests: string;
  created_at: string | null;
  deployed_at: string | null;
  last_run_at: string | null;
  total_runs: number;
  last_attempt: LastAttempt | null;
}

const STATE_STYLE: Record<string, { color: string; icon: LucideIcon; label: string }> = {
  live: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle, label: "Live" },
  paused: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Pause, label: "Paused" },
  testing: { color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Loader2, label: "Testing" },
  ready_to_activate: { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Zap, label: "Ready to activate" },
  needs_credentials: { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: ShieldAlert, label: "Needs credentials" },
  needs_integration: { color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: AlertCircle, label: "Needs integration" },
  needs_configuration: { color: "text-gray-300 bg-gray-400/10 border-gray-400/20", icon: Clock, label: "Needs configuration" },
  pending: { color: "text-gray-300 bg-gray-400/10 border-gray-400/20", icon: Clock, label: "Pending" },
  pending_activation: { color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: Zap, label: "Pending activation" },
  failed: { color: "text-red-400 bg-red-400/10 border-red-400/20", icon: AlertCircle, label: "Failed" },
  configuring: { color: "text-gray-300 bg-gray-400/10 border-gray-400/20", icon: Cpu, label: "Configuring" },
};

const requirementLabel = (req: string): { kind: string; label: string } => {
  if (req.startsWith("config:")) return { kind: "config", label: req.slice(7).replace(/_/g, " ") };
  if (req.startsWith("credential:")) return { kind: "credential", label: req.slice(11).replace(/_/g, " ") };
  if (req.startsWith("integration:")) return { kind: "integration", label: req.slice(12).replace(/_/g, " ") };
  return { kind: "other", label: req };
};

export default function ProvisioningPage() {
  const [rows, setRows] = useState<ProvisionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchState = async (): Promise<ProvisionRow[]> => {
    const res = await fetch("/api/admin/provision");
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Failed to load");
    return data.automations || [];
  };

  useEffect(() => {
    let cancelled = false;
    fetchState()
      .then((r) => { if (!cancelled) { setRows(r); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Could not load provisioning state"); });
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(() => {
    fetchState()
      .then((r) => { setRows(r); setError(null); })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load provisioning state"));
  }, []);

  const run = async (label: string, body: Record<string, string>) => {
    setBusyId(body.automation_id || body.client_id || "all");
    setNotice(null);
    try {
      const res = await fetch("/api/admin/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Action failed");
      const detail =
        data.automation_id || data.results?.length
          ? data.results
            ? `${data.results.length} automation(s) processed`
            : "Done"
          : "Done";
      setNotice(`${label}: ${detail}`);
    } catch (e) {
      setNotice(`${label} failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setBusyId(null);
      load();
    }
  };

  const attention = (rows || []).filter((r) => ["needs_credentials", "needs_integration", "needs_configuration", "failed", "pending"].includes(r.derived_state)).length;
  const liveCount = (rows || []).filter((r) => r.derived_state === "live").length;

  const kindColor: Record<string, string> = {
    config: "bg-gray-400/10 text-gray-300 border-gray-400/20",
    credential: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    integration: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    other: "bg-gray-400/10 text-gray-400 border-gray-400/20",
  };

  return (
    <div className="max-w-6xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
            Provisioning
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {rows === null ? "Loading live provisioning state..." : `${liveCount} live · ${attention} need attention`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={rows === null}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rows === null ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {notice && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-400">
          {error}
        </div>
      )}

      {rows === null && !error && (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading provisioning state...
        </div>
      )}

      {rows !== null && rows.length === 0 && !error && (
        <div className="p-10 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 text-center">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">No automation instances yet</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Create a client with a plan (Starter/Growth/Scale) or deploy systems to generate instances here.
          </p>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[880px]">
              <thead>
                <tr className="border-b border-[var(--color-border)]/60 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Automation</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Missing requirement</th>
                  <th className="px-4 py-3 font-semibold">Last attempt</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = STATE_STYLE[r.derived_state] || STATE_STYLE.pending;
                  const Icon = st.icon;
                  const busy = busyId === r.automation_id;
                  const needsProvision =
                    ["needs_credentials", "needs_integration", "needs_configuration", "pending", "failed", "ready_to_activate", "pending_activation", "configuring"].includes(r.derived_state);
                  const canPause = ["live", "ready_to_activate", "pending_activation", "testing"].includes(r.derived_state);
                  const canActivate = r.derived_state === "paused";
                  const isBusyAll = busyId === "all";
                  return (
                    <tr key={r.automation_id} className="border-b border-[var(--color-border)]/40 last:border-0 align-top hover:bg-[var(--color-surface)]/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-[var(--color-text-primary)]">{r.client_name || r.client_id || "Unknown"}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mt-0.5">
                          {r.plan || "No plan"}{r.entitled ? "" : " · outside plan"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">{r.automation_name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {r.template_slug}{r.template_category ? ` · ${r.template_category}` : ""}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {r.total_runs || 0} run(s){r.last_run_at ? ` · last ${new Date(r.last_run_at).toLocaleString("en-NG")}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${st.color}`}>
                          <Icon className={`w-3 h-3 ${r.derived_state === "testing" ? "animate-spin" : ""}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.missing_requirements.length === 0 ? (
                          <span className="text-[11px] text-emerald-400">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {r.missing_requirements.map((req) => {
                              const parsed = requirementLabel(req);
                              return (
                                <span key={req} className={`px-2 py-0.5 rounded border text-[10px] font-medium ${kindColor[parsed.kind]}`}>
                                  {parsed.kind}: {parsed.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {r.last_attempt ? (
                          <div className="text-[11px]">
                            <p className="text-[var(--color-text-secondary)] capitalize">{r.last_attempt.action}</p>
                            <p className={`text-[10px] mt-0.5 ${r.last_attempt.status === "failed" || r.last_attempt.status === "blocked" ? "text-red-400" : "text-[var(--color-text-muted)]"}`}>
                              {r.last_attempt.status}
                              {r.last_attempt.at ? ` · ${new Date(r.last_attempt.at).toLocaleString("en-NG")}` : ""}
                            </p>
                            {r.last_attempt.error && (
                              <p className="text-[10px] text-red-400/80 mt-0.5 max-w-[200px] truncate" title={r.last_attempt.error}>
                                {r.last_attempt.error}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-muted)]">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {needsProvision && r.entitled && (
                            <button
                              onClick={() => run("Provision", { client_id: r.client_id || "", template_slug: r.template_slug })}
                              disabled={busy || isBusyAll || !r.client_id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                            >
                              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                              {r.derived_state === "failed" || r.derived_state === "ready_to_activate" ? "Retry" : "Provision"}
                            </button>
                          )}
                          {!r.entitled && (
                            <span className="text-[10px] text-[var(--color-text-muted)]">No entitlement</span>
                          )}
                          {canPause && (
                            <button
                              onClick={() => run("Pause", { automation_id: r.automation_id, action: "pause" })}
                              disabled={busy || isBusyAll}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors disabled:opacity-40"
                            >
                              <Pause className="w-3 h-3" /> Pause
                            </button>
                          )}
                          {canActivate && (
                            <button
                              onClick={() => run("Activate", { automation_id: r.automation_id, action: "activate" })}
                              disabled={busy || isBusyAll}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors disabled:opacity-40"
                            >
                              <Play className="w-3 h-3" /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-[10px] text-[var(--color-text-muted)]">
        Statuses come from the real provisioning engine. Nothing is marked live unless configuration, credentials and (when required) the n8n workflow all pass. Provisioning is idempotent: retrying never creates duplicates.
      </p>
    </div>
  );
}
