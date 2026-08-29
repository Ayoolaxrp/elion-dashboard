"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Landing Pages", href: "/landing", icon: Globe },
      { label: "Demo", href: "/demo", icon: PlayCircle },
      { label: "Support", href: "/landing/support", icon: LifeBuoy },
    ],
  },
];

export function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname.startsWith("/landing");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLanding) {
    return <>{children}</>;
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">E</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-zinc-900 tracking-tight text-sm">ELION</span>
          )}
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto p-1 rounded hover:bg-zinc-100 text-zinc-400 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 py-3 px-2.5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-1.5">
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
                      isActive ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-zinc-900" : "text-zinc-400")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-2.5 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center justify-center gap-2 px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors text-xs cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white border border-zinc-200 shadow-sm cursor-pointer hover:bg-zinc-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-zinc-600" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 z-50 h-screen border-r border-zinc-200 bg-white transition-all duration-200 flex flex-col",
          mobileOpen ? "w-[256px] translate-x-0" : "w-[256px] -translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-zinc-200 bg-white transition-all duration-200 flex-col",
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
