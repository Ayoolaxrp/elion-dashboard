"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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
          <Link href="/landing" className="flex items-center gap-2">
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
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Image src="/brand/elion-e-icon.svg" alt="ELION" width={24} height={24} priority />
                <span className="text-sm font-bold text-[var(--color-text-primary)]">ELION</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                business automation for SMEs in Nigeria and beyond.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/landing" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Home</Link>
                <Link href="/landing/pricing" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Pricing</Link>
                <Link href="/demo" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Demo</Link>
                <Link href="/audit" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Free Audit</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">Company</h4>
              <div className="space-y-2">
                <Link href="/landing/about" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">About</Link>
                <Link href="/landing/support" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Support</Link>
                <Link href="/landing/privacy" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Privacy Policy</Link>
                <Link href="/landing/terms" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Terms of Service</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-3">Contact</h4>
              <div className="space-y-2">
                <a href="/funnel" className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">/Contact us</a>
                <a href="/funnel">Get Started</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">&copy; {new Date().getFullYear()} ELION. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
