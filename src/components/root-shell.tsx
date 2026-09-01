"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Search, Zap, Mail, RotateCcw, Calendar,
  Settings, ChevronLeft, ChevronRight, Globe, X, Menu,
  PlayCircle, LifeBuoy, LogOut, Users, Shield, BarChart3,
} from "lucide-react";

// Route definitions by role
const clientSections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Automations",
    items: [
      { label: "Leads", href: "/leads", icon: Zap },
      { label: "Follow-Up", href: "/followup", icon: Mail },
      { label: "Booking", href: "/booking", icon: Calendar },
      { label: "Recovery", href: "/recovery", icon: RotateCcw },
      { label: "Operations", href: "/operations", icon: Settings },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Demo", href: "/demo", icon: PlayCircle },
      { label: "Support", href: "/landing/support", icon: LifeBuoy },
    ],
  },
];

const adminSections = [
  {
    label: "Overview",
    items: [
      { label: "Admin Home", href: "/admin", icon: Shield },
      { label: "Leads", href: "/admin/leads", icon: Users },
    ],
  },
  {
    label: "Clients",
    items: [
      { label: "All Clients", href: "/admin/clients", icon: Users },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Leak Audit", href: "/audit", icon: Search },
      { label: "Demo", href: "/demo", icon: PlayCircle },
      { label: "Marketing", href: "/funnel", icon: Globe },
      { label: "Analytics", href: "/status", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Support", href: "/landing/support", icon: LifeBuoy },
    ],
  },
];

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = !pathname || pathname.startsWith("/landing") || pathname === "/funnel" || pathname === "/login" || pathname === "/audit" || pathname === "/demo" || pathname === "/status";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLabel, setRoleLabel] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setIsAdmin(d.isSuperAdmin || d.isAdmin);
        setRoleLabel(d.isSuperAdmin ? "Super Admin" : d.isAdmin ? "Admin" : d.role === "owner" ? "Owner" : "");
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  if (isLanding) {
    return <>{children}</>;
  }

  const sections = isAdmin ? adminSections : clientSections;

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/"><Image src="/brand/elion-e-icon.png" alt="ELION" width={24} height={24} priority /></Link>
          {!collapsed && (
            <div>
              <span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm">ELION</span>
              {roleLabel && (
                <span className="ml-1.5 text-[9px] font-medium text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-1.5 py-0.5 rounded">
                  {roleLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto p-1 rounded hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors",
                      isActive
                        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--color-border)] p-2.5 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface)] transition-colors text-xs cursor-pointer mb-2"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center justify-center gap-2 px-3 py-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors text-xs cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-sm cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 z-50 h-screen border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-all duration-200 flex flex-col",
          mobileOpen ? "w-[256px] translate-x-0" : "w-[256px] -translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-all duration-200 flex-col",
          collapsed ? "w-[64px]" : "w-[256px]"
        )}
      >
        {sidebarContent}
      </aside>

      <main
        className={cn(
          "min-h-screen transition-all duration-200 p-4 md:p-6 pt-16 md:pt-6",
          collapsed ? "md:ml-[64px]" : "md:ml-[256px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
