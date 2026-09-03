"use client";

import Link from "next/link";
import { ElionLogo } from "@/components/elion-logo";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Home", href: "/" },
      { label: "Free Business Audit", href: "/audit" },
      { label: "Demo", href: "/demo" },
      { label: "Pricing", href: "/landing/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/landing/about" },
      { label: "Support", href: "/landing/support" },
      { label: "Contact", href: "/landing/support" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", href: "/demo" },
      { label: "FAQ", href: "/funnel#faq" },
      { label: "Case Studies", href: "/landing/about" },
      { label: "Documentation", href: "/landing/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/landing/privacy" },
      { label: "Terms of Service", href: "/landing/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)]/40 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand block */}
          <div className="col-span-2">
            <ElionLogo size="md" className="mb-5" />
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              AI operations for growing businesses. Find the leaks in your
              business. Then automate them.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label + l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--color-border)]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} ELION. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Find the leaks. Fix what matters. Automate what repeats.
          </p>
        </div>
      </div>
    </footer>
  );
}