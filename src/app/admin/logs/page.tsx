"use client";
import { executionLogs } from "@/lib/mock-operations";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Execution Logs</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{executionLogs.length} executions</p>
      </div>
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="grid grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-5 py-3 border-b border-[var(--color-border)] text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          <span>Client</span>
          <span>Automation</span>
          <span>Trigger</span>
          <span>Status</span>
          <span>Duration</span>
          <span>Details</span>
          <span>Time</span>
        </div>
        {executionLogs.map(log => (
          <div key={log.id} className="grid grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4 px-5 py-4 border-b border-[var(--color-border)]/50 text-sm items-start">
            <span className="text-xs text-[var(--color-text-secondary)]">{log.client_name}</span>
            <span className="text-xs text-[var(--color-text-primary)] font-medium">{log.automation_name}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{log.trigger}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${log.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {log.status === "success" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {log.status}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">{log.duration_ms ? (log.duration_ms / 1000).toFixed(1) + "s" : "—"}</span>
            <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[200px]" title={log.details}>{log.details}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{new Date(log.started_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}