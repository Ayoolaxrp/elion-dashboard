"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ElionLogo } from "@/components/elion-logo";
import {
  LayoutDashboard,
  Search,
  Zap,
  Mail,
  RotateCcw,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  Menu,
  PlayCircle,
  LifeBuoy,
} from "lucide-react";
import { useState } from "react";

const sections = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Leak Audit", href: "/audit", icon: Search },
    ],
  },
  {
    label: "Automations",
    items: [
      { label: "Lead Response", href: "/leads", icon: Zap },
      { label: "Follow-Up", href: "/followup", icon: Mail },
      { label: "Booking", href: "/booking", icon: Calendar },
      { label: "Revenue Recovery", href: "/recovery", icon: RotateCcw },
      { label: "Operations", href: "/operations", icon: Settings },
      { label: "Landing Pages", href: "/landing", icon: Globe },
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

const SIDEBAR_WIDTH = 256;
const SIDEBAR_COLLAPSED = 64;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--color-border)] shrink-0">
        <ElionLogo size={collapsed ? "sm" : "md"} variant={collapsed ? "symbol" : "full"} />
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 rounded hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
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
                        ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-medium"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--color-border)] p-2.5 shrink-0">
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
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-sm cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 z-50 h-screen border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-all duration-200 flex flex-col",
          mobileOpen ? "w-[256px] translate-x-0" : "w-[256px] -translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-all duration-200 flex-col",
          collapsed ? "w-[64px]" : "w-[256px]",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED };
