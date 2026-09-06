"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle, Activity } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <SiteHeader />
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
