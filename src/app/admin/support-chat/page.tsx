"use client";
// Admin viewer for support assistant Q&A logs.
// Read-only, real data only, honest empty state. Shows what visitors actually
// ask, which answers failed, and overall volume.

import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { MessageCircle, RefreshCw, Loader2, CheckCircle2, XCircle, Inbox } from "lucide-react";

interface ChatLog {
  id: string;
  question: string;
  answer_summary: string | null;
  outcome: string;
  escalated_to_form: boolean;
  created_at: string;
}

const fromNow = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d === 1 ? "yesterday" : `${d}d ago`;
};

export default function SupportChatPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [stats, setStats] = useState({ total: 0, last24h: 0 });
  const [outcome, setOutcome] = useState<"all" | "answered" | "error">("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/support-chat?outcome=${outcome}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setStats({ total: d.total || 0, last24h: d.last24h || 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [outcome]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-10 max-w-5xl">
          <div className="flex items-center gap-3 mb-1">
            <MessageCircle className="w-6 h-6 text-[var(--color-accent)]" />
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Support Chat Logs</h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            What visitors ask the AI assistant on the support page. Use it to spot gaps between what people want and what the site explains.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
              {(["all", "answered", "error"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={`px-4 py-2 text-sm font-medium capitalize cursor-pointer transition-colors ${
                    outcome === o
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <span className="text-xs text-[var(--color-text-muted)] ml-auto">
              {stats.total} total · {stats.last24h} in last 24h
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading chat logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--color-border)] rounded-xl">
              <Inbox className="w-10 h-10 text-[var(--color-text-muted)] mb-3" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">No chat logs yet</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Visitor questions appear here as people use the assistant on the support page.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer hover:bg-[var(--color-surface-raised)] transition-colors"
                    aria-expanded={expanded === log.id}
                  >
                    {log.outcome === "answered" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {log.question}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {fromNow(log.created_at)}
                        {log.escalated_to_form ? " · escalated to form" : ""}
                      </p>
                    </div>
                  </button>
                  {expanded === log.id && log.answer_summary && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                      <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
                        Assistant reply
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {log.answer_summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
