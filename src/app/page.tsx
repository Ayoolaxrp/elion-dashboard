"use client";

import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle, Activity } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { ElionLogo } from "@/components/elion-logo";
import { Hero } from "@/components/home/hero";

// Lazy-load below-fold sections so the initial bundle stays small
const ProblemSection = dynamic(() => import("@/components/homepage-sections").then(m => m.ProblemSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const SystemMap = dynamic(() => import("@/components/homepage-sections").then(m => m.SystemMap), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const AuditSection = dynamic(() => import("@/components/homepage-sections").then(m => m.AuditSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const DashboardPreview = dynamic(() => import("@/components/homepage-sections").then(m => m.DashboardPreview), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const AdminSection = dynamic(() => import("@/components/homepage-sections").then(m => m.AdminSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const HowItWorks = dynamic(() => import("@/components/homepage-sections").then(m => m.HowItWorks), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const OwnershipSection = dynamic(() => import("@/components/homepage-sections").then(m => m.OwnershipSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const PricingSection = dynamic(() => import("@/components/homepage-sections").then(m => m.PricingSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const FaqSection = dynamic(() => import("@/components/homepage-sections").then(m => m.FaqSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const FinalCta = dynamic(() => import("@/components/homepage-sections").then(m => m.FinalCta), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });

const NAV_LINKS = [
  { label: "Solutions", href: "#systems" },
  { label: "How It Works", href: "#how" },
  { label: "Audit", href: "/audit" },
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/landing/pricing" },
  { label: "About", href: "/landing/about" },
];

/* ------------------------------- Nav --------------------------------- */

function SiteNav() {
  const [open, setOpen] = useState(false);
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
              href={l.href}
              className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
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
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
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
              onClick={() => setOpen(false)}
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

/* ------------------------- Product preview --------------------------- */

function ProductPreview() {
  const reduced = useReducedMotion();
  const metrics = [
    { label: "Leads processed", value: "127", note: "this week" },
    { label: "Responses sent", value: "94", note: "automated" },
    { label: "Follow-ups triggered", value: "31", note: "on schedule" },
  ];
  const automations = [
    { name: "Lead Response", status: "Live", tone: "success" as const },
    { name: "Follow-Up", status: "Live", tone: "success" as const },
    { name: "Booking", status: "Not configured", tone: "muted" as const },
  ];

  const entrance = (i: number) => ({
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, damping: 30, stiffness: 260, delay: reduced ? 0 : i * 0.06 },
    },
  });

  return (
    <motion.section
      className="px-6 pb-24 md:pb-32"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div variants={entrance(0)} className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Product Preview (Illustrative)
          </p>
        </motion.div>

        <motion.div
          variants={entrance(1)}
          className="relative rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden"
        >
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/60">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="ml-3 text-[11px] text-[var(--color-text-muted)] font-medium">ELION Operations</span>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
            <motion.div
              variants={entrance(2)}
              className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Automation Health</p>
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-success)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-node-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)]" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-success)]" />
                  </span>
                  Operational
                </span>
              </div>
              <div className="space-y-3">
                {automations.map((a) => (
                  <div key={a.name} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/40 last:border-0">
                    <span className="text-sm text-[var(--color-text-secondary)]">{a.name}</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                        a.tone === "success"
                          ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
                          : "text-[var(--color-text-muted)] bg-[var(--color-border)]/40"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={entrance(3)} className="grid grid-cols-1 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">{m.label}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{m.note}</p>
                  </div>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{m.value}</span>
                </div>
              ))}
              <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Activity</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">last 24 hours</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                  <Activity className="w-4 h-4" />
                  8 executions
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ------------------------------- Page -------------------------------- */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a href="#main" className="skip-to-content">Skip to content</a>
      <SiteNav />
      <main id="main">
        <Hero />
        <ProductPreview />
        <ProblemSection />
        <SystemMap />
        <AuditSection />
        <DashboardPreview />
        <AdminSection />
        <HowItWorks />
        <OwnershipSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
