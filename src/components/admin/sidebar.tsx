"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, Zap, FileText, Settings, LogOut, ChevronLeft, Menu, BarChart3, CheckCircle, FileSignature, Receipt, CreditCard, Wrench, Layers, Activity, Globe, TrendingUp, Bell, Database } from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/leads", label: "Leads", icon: UserPlus },
  { href: "/admin/proposals", label: "Proposals", icon: FileSignature },
  { href: "/admin/contracts", label: "Contracts", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/templates", label: "Templates", icon: Layers },
  { href: "/admin/provisioning", label: "Provisioning", icon: Wrench },
  { href: "/admin/automations", label: "Automations", icon: Zap },
  { href: "/admin/onboarding", label: "Onboarding", icon: Receipt },
  { href: "/admin/integrations", label: "Integrations", icon: Globe },
  { href: "/admin/logs", label: "Logs", icon: Activity },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/status", label: "Status", icon: CheckCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/migrations", label: "Migrations", icon: Database },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notifications").then(r => r.json()).then(d => setUnread(d.unread || 0)).catch(() => {});
  }, []);
  const handleSignOut = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; };

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]" aria-label="Open menu"><Menu className="w-5 h-5 text-[var(--color-text-primary)]" /></button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}
      <aside className={"fixed top-0 left-0 bottom-0 z-50 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-all duration-200 " + (collapsed ? "w-16" : "w-60") + " " + (mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className={"h-16 flex items-center border-b border-[var(--color-border)] " + (collapsed ? "justify-center px-2" : "px-5 gap-2.5")}>
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: "Space Grotesk,sans-serif" }}>E</div>
            {!collapsed && <span className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex ml-auto p-1 rounded hover:bg-[var(--color-surface-raised)] transition-colors" aria-label={collapsed ? "Expand" : "Collapse"}>
            <ChevronLeft className={"w-4 h-4 text-[var(--color-text-muted)] transition-transform " + (collapsed ? "rotate-180" : "")} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto" role="navigation" aria-label="Admin navigation">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " + (active ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]") + " " + (collapsed ? "justify-center" : "")} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[var(--color-border)]">
          <Link href="/admin/notifications" className={"flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors relative " + (collapsed ? "justify-center" : "")}>
            <Bell className="w-4 h-4 shrink-0" />
            {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-error)] text-white text-[9px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
            {!collapsed && <span>Notifications</span>}
          </Link>
          <Link href="/" className={"flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] transition-colors " + (collapsed ? "justify-center" : "")}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            {!collapsed && <span>View Site</span>}
          </Link>
          <button onClick={handleSignOut} className={"flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors " + (collapsed ? "justify-center" : "")} aria-label="Sign out">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
