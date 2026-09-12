"use client";

import Link from "next/link";
import { ElionLogo } from "@/components/elion-logo";
import { ArrowRight, CalendarDays, LifeBuoy, SearchCheck } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/support" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Audit Guide", href: "/docs/getting-started/running-your-free-audit" },
      { label: "Automation Guide", href: "/docs/automations/lead-response" },
      { label: "FAQ", href: "/#faq" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Acceptable Use", href: "/acceptable-use" },
    ],
  },
];

const NEXT_STEPS = [
  {
    icon: SearchCheck,
    title: "I need clarity",
    description: "Start with a free business audit.",
    action: "Find the leak",
    href: "/audit",
  },
  {
    icon: CalendarDays,
    title: "I know the problem",
    description: "Book a discovery call about implementation.",
    action: "Discuss implementation",
    href: "/book",
  },
  {
    icon: LifeBuoy,
    title: "I am already a client",
    description: "Get help from the ELION team.",
    action: "Open support",
    href: "/support",
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(240px,1.25fr)_minmax(0,2fr)] lg:gap-20">
          <div>
            <ElionLogo size="md" className="mb-5" />
            <p className="max-w-xs text-sm leading-7 text-[var(--color-text-muted)]">
              AI operations for growing businesses. Find the leaks in your business. Then automate them.
            </p>
            <p className="mt-8 max-w-xs text-xs leading-6 text-[var(--color-text-muted)]">
              Audit first. Evidence before implementation. Systems your business owns.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-primary)]">
                  {column.title}
                </p>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label + link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <section className="mt-16 border-y border-[var(--color-border)] py-10 sm:mt-20" aria-labelledby="footer-next-step">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">
              Choose your next step
            </p>
            <h2 id="footer-next-step" className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[var(--color-text-primary)]">
              Start where you are.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-text-muted)]">
              Not sure what you need? Start with diagnosis. Already know the problem? Talk implementation. Already a client? Get support.
            </p>
          </div>

          <div className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {NEXT_STEPS.map(({ icon: Icon, title, description, action, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[150px] flex-col justify-between py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-bright)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
                  </div>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-bright)]">
                  {action}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-10 border-t border-[var(--color-border)] pt-7">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-[var(--color-text-muted)]">© 2026 ELION. All rights reserved.</p>
            <p className="text-xs text-[var(--color-text-muted)]">ELION™ · AI operations for growing businesses.</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] leading-6 text-[var(--color-text-muted)]/80">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("elion:open-cookie-preferences"))}
              className="underline underline-offset-2 transition-colors hover:text-[var(--color-text-primary)]"
            >
              Cookie settings
            </button>
            <p>
              ELION and its associated software, systems, automation workflows, processes, frameworks, designs,
              documentation, trademarks, and other materials constitute proprietary intellectual property owned
              by or licensed to ELION. Unauthorized use is prohibited. See our{" "}
              <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-[var(--color-text-primary)]">
                Terms of Service
              </Link>{" "}
              for details.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
