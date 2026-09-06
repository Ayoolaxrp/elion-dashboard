"use client";

import { LandingNav } from "@/components/landing-nav";
import { SiteFooter } from "@/components/site-footer";

/**
 * Shared shell for canonical marketing pages (/pricing, /about, /support, /book)
 * and the legacy /landing/* routes. Pages that need their own chrome compose
 * this directly instead of relying on a path-based layout.
 */
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <LandingNav />
      <main>{children}</main>
    </div>
  );
}
