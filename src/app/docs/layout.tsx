import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { DocsMobileChips, DocsSidebar } from "@/components/docs-nav";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides and reference for ELION: what the platform does, how to run an audit, connect Google Calendar, configure AI agents, and understand pricing.",
  alternates: { canonical: "/docs" },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2" aria-label="ELION home">
            <Image src="/brand/elion-e-icon.svg" alt="" width={22} height={22} priority />
            <span className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">ELION</span>
          </Link>
          <Link
            href="/docs"
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Documentation
          </Link>
          <div className="ml-auto hidden md:flex items-center gap-6">
            <Link
              href="/landing/support"
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Support
            </Link>
            <Link
              href="/audit"
              className="px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Run Free Audit
            </Link>
          </div>
        </div>
      </header>

      <DocsMobileChips />

      <div className="max-w-7xl mx-auto px-6">
        <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-16 lg:py-12 py-8">
          <DocsSidebar />
          <main id="docs-content" className="min-w-0">
            {children}
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
