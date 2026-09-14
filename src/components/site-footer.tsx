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
    title: "Solutions",
    links: [
      { label: "AI Sales Employee", href: "/products" },
      { label: "AI Support Employee", href: "/products" },
      { label: "AI Receptionist", href: "/products" },
      { label: "Workflow Automation", href: "/products" },
      { label: "Business Audit", href: "/audit" },
    ],
  },
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
      { label: "Documentation", href: "/docs" },
      { label: "Guides", href: "/docs/getting-started/running-your-free-audit" },
      { label: "FAQ", href: "/#faq" },
      { label: "Automation Guide", href: "/docs/automations/lead-response" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Acceptable Use", href: "/acceptable-use" },
    ],
  },
];

const NEXT_STEPS = [
  {
    icon: SearchCheck,
    title: "Run AI Assessment",
    description: "Find the operational leak before you invest in a system.",
    action: "Start assessment",
    href: "/audit",
  },
  {
    icon: CalendarDays,
    title: "Book Consultation",
    description: "Talk through the problem and the right implementation path.",
    action: "Book a call",
    href: "/book",
  },
  {
    icon: LifeBuoy,
    title: "Existing Client Support",
    description: "Get help from the ELION team with a live system.",
    action: "Open support",
    href: "/support",
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="content-gutter py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(220px,1.1fr)_minmax(0,2.4fr)] lg:gap-16">
          <div>
            <ElionLogo size="md" className="mb-5" />
            <p className="max-w-xs text-sm leading-7 text-[var(--color-text-secondary)]">
              AI employees and automation systems for ambitious businesses.
            </p>
            <p className="mt-6 max-w-xs text-xs leading-6 text-[var(--color-text-muted)]">
              Audit first. Evidence before implementation. Systems your business owns.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-8">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-primary)]">
                  {column.title}
                </p>
                <ul className="space-y-2.5">
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

        <section className="mt-14 border-y border-[var(--color-border)] py-9 sm:mt-16" aria-labelledby="footer-next-step">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent-bright)]">
                Choose your next step
              </p>
              <h2 id="footer-next-step" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
                Need help choosing the right automation?
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--color-text-muted)] sm:text-right">
              Start with clarity, talk to the team, or get support for a system already in operation.
            </p>
          </div>

          <div className="mt-7 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {NEXT_STEPS.map(({ icon: Icon, title, description, action, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-[132px] flex-col justify-between py-5 sm:px-5 sm:first:pl-0 sm:last:pr-0"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-bright)]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
                  </div>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent-bright)]">
                  {action}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-8 border-t border-[var(--color-border)] pt-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-[var(--color-text-muted)]">© 2026 ELION. All rights reserved.</p>
            <p className="text-xs text-[var(--color-text-muted)]">Built for businesses across Nigeria and Africa.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] leading-6 text-[var(--color-text-muted)]/80">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("elion:open-cookie-preferences"))}
              className="underline underline-offset-2 transition-colors hover:text-[var(--color-text-primary)]"
            >
              Cookie settings
            </button>
            <p>
              ELION and its associated software, systems, workflows, documentation, and designs are proprietary.
              See our{" "}
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
