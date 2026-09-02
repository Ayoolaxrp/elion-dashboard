"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Zap, Calendar, Settings, LogOut, ChevronLeft, Menu, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface Entitlements {
  features: string[];
  hasLeadResponse: boolean;
  hasFollowUp: boolean;
  hasBooking: boolean;
  hasRecovery: boolean;
  hasOperations: boolean;
  client: { company_name: string } | null;
}

const ALL_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, always: true },
  { href: "/dashboard/leads", label: "Leads", icon: Users, feature: "lead_response" },
  { href: "/dashboard/automations", label: "Automations", icon: Zap, always: true },
  { href: "/dashboard/follow-up", label: "Follow-Up", icon: Calendar, feature: "follow_up" },
  { href: "/dashboard/booking", label: "Booking", icon: Calendar, feature: "booking" },
  { href: "/dashboard/recovery", label: "Recovery", icon: BarChart3, feature: "revenue_recovery" },
  { href: "/dashboard/onboarding", label: "Onboarding", icon: Calendar, always: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, always: true },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  useEffect(() => {
    fetch("/api/client/entitlements").then(r => r.json()).then(setEntitlements).catch(() => {});
  }, []);

  const navItems = ALL_NAV.filter(item => {
    if (item.always) return true;
    if (!item.feature) return true;
    return entitlements?.features?.includes(item.feature) || false;
  });

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]" aria-label="Open menu">
        <Menu className="w-5 h-5 text-[var(--color-text-primary)]" />
      </button>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed top-0 left-0 bottom-0 z-50 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transition-all duration-200 ${collapsed ? "w-16" : "w-60"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className={`h-16 flex items-center border-b border-[var(--color-border)] ${collapsed ? "justify-center px-2" : "px-5 gap-2.5"}`}>
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: "Space Grotesk,sans-serif" }}>E</div>
            {!collapsed && <span className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span>}
          </Link>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex ml-auto p-1 rounded hover:bg-[var(--color-surface-raised)] transition-colors" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <ChevronLeft className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {!collapsed && entitlements?.client?.company_name && (
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">Signed in as</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{entitlements.client.company_name}</p>
          </div>
        )}

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto" role="navigation" aria-label="Dashboard navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]"} ${collapsed ? "justify-center" : ""}`} aria-current={isActive ? "page" : undefined} title={collapsed ? item.label : undefined}>
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[var(--color-border)]">
          <button onClick={handleSignOut} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors ${collapsed ? "justify-center" : ""}`} aria-label="Sign out">
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
