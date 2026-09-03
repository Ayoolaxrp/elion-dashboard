"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

const landingNav = [
  { label: "Home", href: "/landing" },
  { label: "Pricing", href: "/landing/pricing" },
  { label: "About", href: "/landing/about" },
  { label: "Support", href: "/landing/support" },
];

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      {/* Nav */}
      <nav className="border-b border-[var(--color-border)] sticky top-0 z-40 bg-[var(--color-surface-raised)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/elion-e-icon.svg" alt="ELION" width={24} height={24} priority />
            <span className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">ELION</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {landingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/audit"
              className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Free Audit
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded hover:bg-[var(--color-surface-elevated)] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[var(--color-text-secondary)]" /> : <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
            <div className="px-6 py-4 space-y-3">
              {landingNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block text-sm font-medium ${
                    pathname === item.href ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/audit"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-2.5 bg-[var(--color-surface)] text-white text-sm font-medium rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Free Audit
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
