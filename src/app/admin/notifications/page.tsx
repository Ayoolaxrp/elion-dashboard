"use client";
import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff, BellRing, CheckCheck, FileText, Shield, CreditCard, Mail, Handshake, Eye, Send, XCircle, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Notif { id: string; type: string; title: string; message: string; is_read: boolean; created_at: string; clients?: { company_name?: string; contact_name?: string } | null }

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  document_viewed: { icon: Eye, color: "#3B66E8" },
  document_accepted: { icon: CheckCheck, color: "#10B981" },
  document_signed: { icon: Shield, color: "#8B5CF6" },
  document_paid: { icon: CreditCard, color: "#F59E0B" },
  onboarding_complete: { icon: Handshake, color: "#10B981" },
  provisioning_failed: { icon: XCircle, color: "#EF4444" },
  new_lead: { icon: Mail, color: "#3B66E8" },
  onboarding_email_sent: { icon: Send, color: "#06B6D4" },
  payment_recorded: { icon: CreditCard, color: "#F59E0B" },
  contract_signed: { icon: FileText, color: "#8B5CF6" },
};

const fromNow = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d === 1 ? "yesterday" : `${d}d ago`;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [tab, setTab] = useState<"unread" | "all">("unread");
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setUnread(d.unread || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id?: string) => {
    setBusy(id || "all");
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { mark_all: true }),
    });
    load();
    setBusy(null);
  };

  const visible = tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadTabCount = tab === "unread" ? notifications.filter((n) => !n.is_read).length : 0;

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Operations
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Notifications</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {unread > 0 ? `${unread} unread — clicking an item marks it read` : "All caught up"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1">
              <button onClick={() => setTab("unread")} className={"inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all " + (tab === "unread" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]")}>
                <BellRing className="w-3.5 h-3.5" /> Unread {unreadTabCount > 0 && <span className="text-xs opacity-80">({unreadTabCount})</span>}
              </button>
              <button onClick={() => setTab("all")} className={"inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all " + (tab === "all" ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]")}>
                <Bell className="w-3.5 h-3.5" /> All
              </button>
            </div>
            {unread > 0 && (
              <button onClick={() => markRead()} disabled={!!busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-50 transition-all">
                {busy === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />} Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin mx-auto" /></div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 bg-[var(--color-surface-raised)] rounded-2xl border border-[var(--color-border)]">
              {tab === "unread" ? <BellOff className="w-10 h-10 text-[var(--color-text-muted)]/50 mx-auto mb-4" /> : <Bell className="w-10 h-10 text-[var(--color-text-muted)]/50 mx-auto mb-4" />}
              <p className="text-sm text-[var(--color-text-muted)]">{tab === "unread" ? "No unread notifications." : "No notifications yet."}</p>
              {tab === "unread" && unread === 0 && notifications.length > 0 && (
                <button onClick={() => setTab("all")} className="text-xs text-[var(--color-accent)] hover:underline mt-2">View all notifications</button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((n) => {
                const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.document_viewed;
                const Icon = tc.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    disabled={n.is_read || !!busy}
                    className={"w-full text-left p-4 rounded-xl border transition-all " + (n.is_read ? "bg-[var(--color-surface-raised)] border-[var(--color-border)]/40 opacity-50" : "bg-[var(--color-surface-raised)] border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/40 cursor-pointer")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tc.color + "15" }}>
                        <Icon className="w-4 h-4" style={{ color: tc.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={"text-sm font-medium " + (n.is_read ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]")}>{n.title}</p>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0 animate-pulse" />}
                          <span className="text-[10px] text-[var(--color-text-muted)]/60">{fromNow(n.created_at)}</span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.message}</p>
                        {n.clients?.company_name && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{n.clients.company_name} / {n.clients.contact_name}</p>
                        )}
                      </div>
                      {!n.is_read && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-accent)] shrink-0 mt-1">
                          {busy === n.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />} Read
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
