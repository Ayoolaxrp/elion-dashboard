"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Shared shell for canonical marketing pages (/pricing, /about, /support, /book)
 * and the legacy /landing/* routes. Pages that need their own chrome compose
 * this directly instead of relying on a path-based layout.
 */
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
