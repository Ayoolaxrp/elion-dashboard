"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ElionLogo } from "@/components/elion-logo";

/**
 * Global ELION public-site header.
 * One component for every public page; only the active-page state differs.
 * Solutions/How It Works scroll in-page on the homepage and navigate to
 * /#systems and /#how from any other page.
 * `ctaAction` lets a page override the primary CTA (e.g. /audit resets +
 * scrolls to its form instead of navigating).
 */
const NAV_LINKS = [
  { label: "Solutions", anchor: "systems" },
  { label: "How It Works", anchor: "how" },
  { label: "Audits", href: "/audit" },
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
] as const;

interface SiteHeaderProps {
  ctaAction?: () => void;
}

export function SiteHeader({ ctaAction }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";

  const hrefFor = (l: (typeof NAV_LINKS)[number]) =>
    "anchor" in l ? (onHome ? `#${l.anchor}` : `/#${l.anchor}`) : l.href;

  const isActive = (l: (typeof NAV_LINKS)[number]) =>
    "href" in l && (pathname === l.href || pathname.startsWith(l.href + "/"));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="ELION home" className="flex items-center">
          <ElionLogo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={hrefFor(l)}
              className={`text-sm transition-colors ${
                isActive(l)
                  ? "text-white font-medium"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/audit"
            onClick={ctaAction ? (e) => { e.preventDefault(); ctaAction(); setOpen(false); } : undefined}
            className="px-5 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
          >
            Run Free Audit
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/95 backdrop-blur-xl">
          <div className="px-6 py-5 space-y-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={hrefFor(l)}
                onClick={() => setOpen(false)}
                className={`block py-2.5 text-sm transition-colors ${
                  isActive(l) ? "text-white font-medium" : "text-[var(--color-text-secondary)] hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/audit"
              onClick={ctaAction ? (e) => { e.preventDefault(); ctaAction(); setOpen(false); } : () => setOpen(false)}
              className="mt-3 block w-full text-center px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold"
            >
              Run Free Audit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
