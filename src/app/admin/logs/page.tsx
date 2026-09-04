"use client";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, Activity } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

interface LogEntry {
  id: string;
  type: "provision" | "activity";
  created_at: string;
  client: string;
  automation: string | null;
  action: string;
  status: string;
  error_message: string | null;
  details: string;
  duration_ms: number | null;
  steps: { step?: string; time?: string }[];
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => setLogs(d.logs || []))
      .catch(() => setError("Failed to load execution logs"))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: string) => {
    if (s === "passed" || s === "success" || s === "completed") return "text-emerald-400 bg-emerald-400/10 border border-emerald-500/20";
    if (s === "failed" || s === "blocked") return "text-red-400 bg-red-400/10 border border-red-500/20";
    if (s === "running" || s === "pending") return "text-amber-400 bg-amber-400/10 border border-amber-500/20";
    return "text-gray-400 bg-gray-400/10 border border-gray-500/20";
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Execution Logs</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Real provisioning and activity records — no sample data</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <Activity className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No executions yet</p>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto">
                When automations are provisioned, activated, tested or paused — and when leads are captured — the records appear here.
              </p>
            </div>
          ) : (
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-5 py-3 border-b border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                <span>Client</span>
                <span>Automation</span>
                <span>Action</span>
                <span>Status</span>
                <span>Duration</span>
                <span>Details</span>
                <span>Time</span>
              </div>
              {logs.map((log) => (
                <div key={log.id} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-5 py-4 border-b border-[var(--color-border)]/50 text-sm items-start">
                  <span className="text-xs text-[var(--color-text-secondary)] truncate">{log.client}</span>
                  <span className="text-xs text-[var(--color-text-primary)] font-medium truncate">{log.automation || (log.type === "activity" ? "—" : "—")}</span>
                  <span className="text-xs text-[var(--color-text-muted)] truncate">{log.action}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${statusBadge(log.status)}`}>
                    {log.status === "failed" || log.status === "blocked" ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {log.status}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{log.duration_ms ? (log.duration_ms / 1000).toFixed(1) + "s" : "—"}</span>
                  <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[220px]" title={log.details + (log.error_message ? ` :: ${log.error_message}` : "")}>
                    {log.error_message || log.details || "—"}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{new Date(log.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}