"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Activity,
  Globe,
  X,
} from "lucide-react";
import { useState, useRef } from "react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, description: "Overview & analytics" },
  { label: "Leak Audit", href: "/audit", icon: Search, description: "Find automation opportunities" },
  { label: "Lead Response", href: "/leads", icon: Zap, description: "Instant lead processing" },
  { label: "Follow-Up Engine", href: "/followup", icon: Mail, description: "Automated sequences" },
  { label: "Revenue Recovery", href: "/recovery", icon: RotateCcw, description: "Reactivate dormant leads" },
  { label: "Booking Engine", href: "/booking", icon: Calendar, description: "Appointment automation" },
  { label: "Operations", href: "/operations", icon: Settings, description: "Workflow automation" },
  { label: "Landing Pages", href: "/landing", icon: Globe, description: "Public offer pages" },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 68;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);



  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-foreground tracking-tight">Elion</p>
            <p className="text-[11px] text-muted-foreground">Automations</p>
          </div>
        )}
        {/* Mobile close button */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 rounded hover:bg-secondary text-muted-foreground cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )} title={collapsed ? item.label : undefined}>
              <item.icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="font-medium leading-tight">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">{item.description}</p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 shrink-0">
        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors text-sm cursor-pointer">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg cursor-pointer">
        <Settings className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={cn(
        "md:hidden fixed left-0 top-0 z-50 h-screen border-r border-border bg-card/95 backdrop-blur-xl transition-all duration-300 flex flex-col",
        mobileOpen ? "w-[260px] translate-x-0" : "w-[260px] -translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 z-40 h-screen border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 flex-col",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED };
