"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle,
  ChevronLeft,
  Database,
  ExternalLink,
  FileSignature,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Receipt,
  Rocket,
  SearchCheck,
  Settings,
  ListChecks,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ElionLogo } from "@/components/elion-logo";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Today",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/sales", label: "Morning Queue", icon: ListChecks },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { href: "/admin/leads", label: "Leads", icon: UserPlus },
      { href: "/admin/audits", label: "Audits", icon: SearchCheck },
      { href: "/admin/proposals", label: "Proposals", icon: FileSignature },
      { href: "/admin/contracts", label: "Contracts", icon: FileText },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/payments", label: "Payments", icon: Receipt },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Users },
      { href: "/admin/onboarding", label: "Onboarding", icon: CheckCircle },
      { href: "/admin/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/admin/deployments", label: "Deployments", icon: Rocket },
      { href: "/admin/automations", label: "Automations", icon: Zap },
      { href: "/admin/integrations", label: "Integrations", icon: Globe },
      { href: "/admin/logs", label: "Logs", icon: Activity },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/prospecting", label: "Prospecting", icon: SearchCheck },
      { href: "/admin/content", label: "Content Studio", icon: FileText },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/status", label: "Status", icon: CheckCircle },
      { href: "/admin/templates", label: "Templates", icon: Layers },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/migrations", label: "Migrations", icon: Database },
      { href: "/admin/provisioning", label: "Provisioning", icon: Wrench },
      { href: "/admin/support-chat", label: "Support Chat", icon: MessageCircle },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((response) => response.json())
      .then((data) => setUnread(data.unread || 0))
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const sidebarContent = (
    <>
      <div className={`flex h-16 shrink-0 items-center border-b border-[var(--color-border)] ${collapsed ? "justify-center px-2" : "gap-2.5 px-5"}`}>
        <Link href="/admin" className="shrink-0" aria-label="ELION admin home" onClick={() => setMobileOpen(false)}>
          <ElionLogo size={collapsed ? "sm" : "md"} variant={collapsed ? "symbol" : "full"} />
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="ml-auto hidden rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] lg:flex"
          aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto rounded-md p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] lg:hidden" aria-label="Close admin menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-4" aria-label="Admin workspace navigation" data-lenis-prevent>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            {!collapsed && <p className="system-label px-3 pb-2 text-[var(--color-text-muted)]">{section.label}</p>}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${collapsed ? "justify-center" : ""} ${active ? "bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"}`}
                  >
                    {active && <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-r-full bg-[var(--color-accent)]" aria-hidden />}
                    <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-[var(--color-accent-bright)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.href === "/admin/notifications" && unread > 0 && <span className="ml-auto min-w-5 rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[var(--color-border)] p-2">
        <Link href="/" onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] ${collapsed ? "justify-center" : ""}`} title={collapsed ? "View site" : undefined}>
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && <span>View site</span>}
        </Link>
        <button type="button" onClick={handleSignOut} className={`flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] ${collapsed ? "justify-center" : ""}`} title={collapsed ? "Sign out" : undefined}>
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div aria-hidden="true" className={`hidden shrink-0 transition-all duration-200 lg:block ${collapsed ? "w-16" : "w-60"}`} />
      <button type="button" onClick={() => setMobileOpen(true)} className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] lg:hidden" aria-label="Open admin menu" aria-expanded={mobileOpen} aria-controls="admin-sidebar">
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <aside id="admin-sidebar" data-admin-sidebar="true" aria-label="Admin workspace navigation" className={`fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 lg:translate-x-0 ${collapsed ? "w-16" : "w-60"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
