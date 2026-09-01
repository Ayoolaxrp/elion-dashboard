"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Check, CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read_all: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Notifications</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{unread > 0 ? unread + " unread" : "All caught up"}</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] text-sm font-medium border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">You will be notified when new audit submissions arrive.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={"p-4 rounded-xl border transition-colors " + (n.read ? "bg-[var(--color-surface-raised)] border-[var(--color-border)]" : "bg-[var(--color-surface-raised)] border-[var(--color-accent)]/20")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />}
                    <span className={"px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider " + (n.type === "new_lead" ? "bg-blue-500/10 text-blue-400" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]")}>
                      {n.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {new Date(n.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{n.title}</h3>
                  {n.message && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.message}</p>}
                  {(n.metadata as any)?.lead_id && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                      Lead: <span className="font-mono">{String((n.metadata as any).lead_id)}</span>
                    </p>
                  )}
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors shrink-0" title="Mark as read">
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
