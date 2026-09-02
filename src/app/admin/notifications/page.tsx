"use client";
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff, CheckCheck, FileText, Shield, CreditCard, Mail, Settings, Handshake, Eye } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  document_viewed: { icon: Eye, color: "#3B66E8" },
  document_accepted: { icon: CheckCheck, color: "#10B981" },
  document_signed: { icon: Shield, color: "#8B5CF6" },
  document_paid: { icon: CreditCard, color: "#F59E0B" },
  onboarding_complete: { icon: Handshake, color: "#10B981" },
  provisioning_failed: { icon: FileText, color: "#EF4444" },
};

const DOC_ICONS: Record<string, any> = {
  proposal: FileText, contract: Shield, invoice: CreditCard,
  welcome: Mail, portal: Settings, thankyou: Handshake,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setUnread(d.unread || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id?: string) => {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { mark_all: true }),
    });
    load();
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                Notifications
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
            {unread > 0 && (
              <button onClick={() => markRead()} className="px-4 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm flex items-center gap-1.5 hover:text-white transition-colors">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
              <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">You will see alerts when clients view or interact with documents.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => {
                const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.document_viewed;
                const Icon = tc.icon;
                const DocIcon = n.document_type ? DOC_ICONS[n.document_type] : null;
                const client = n.clients;

                return (
                  <div key={n.id} className={"p-4 rounded-xl border transition-all " + (n.is_read ? "bg-[var(--color-surface-raised)] border-[var(--color-border)]/50 opacity-60" : "bg-[var(--color-surface-raised)] border-[var(--color-border)]")}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tc.color + "15" }}>
                        <Icon className="w-4 h-4" style={{ color: tc.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[var(--color-text-primary)]">{n.title}</p>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />}
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{n.message}</p>
                        {client && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            {client.company_name} / {client.contact_name}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {new Date(n.created_at).toLocaleString("en-NG")}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button onClick={() => markRead(n.id)} className="text-xs text-[var(--color-accent)] hover:underline shrink-0">
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
