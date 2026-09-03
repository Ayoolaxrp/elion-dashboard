"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, CheckCircle2, Zap, Mail, Calendar,
  RotateCcw, Settings, Shield, Activity, Search, ChevronDown,
  Circle, CircleDot, PlayCircle, Users, Layers, ServerCog,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { ElionLogo } from "@/components/elion-logo";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Solutions", href: "#systems" },
  { label: "How It Works", href: "#how" },
  { label: "Audit", href: "/audit" },
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/landing/pricing" },
  { label: "About", href: "/landing/about" },
];

const SYSTEM_FLOW = [
  { label: "Lead", desc: "An enquiry arrives from any channel." },
  { label: "Capture", desc: "Every lead is recorded the moment it appears." },
  { label: "Qualify", desc: "The lead is scored against your criteria." },
  { label: "Respond", desc: "An immediate, on-brand response is sent." },
  { label: "Follow Up", desc: "Prospects who go quiet are re-engaged automatically." },
  { label: "Book", desc: "Conversations turn into scheduled appointments." },
  { label: "Recover", desc: "Dormant opportunities are systematically revived." },
  { label: "Measure", desc: "You see what is happening and what is working." },
];

const SYSTEMS = [
  {
    icon: Zap,
    title: "Lead Response",
    problem: "Leads arrive but responses are slow and inconsistent.",
    outcome: "Every enquiry gets an immediate, on-brand response.",
  },
  {
    icon: Mail,
    title: "Follow-Up",
    problem: "Interested prospects disappear because nobody follows up.",
    outcome: "Consistent follow-up happens automatically, on schedule.",
  },
  {
    icon: Calendar,
    title: "Booking",
    problem: "Manual scheduling creates friction and missed appointments.",
    outcome: "Conversations convert into confirmed bookings without back-and-forth.",
  },
  {
    icon: RotateCcw,
    title: "Revenue Recovery",
    problem: "Existing opportunities and dormant customers are not re-engaged.",
    outcome: "Lost revenue is systematically chased and recovered.",
  },
  {
    icon: Settings,
    title: "Operations",
    problem: "Your team spends hours on repetitive manual work.",
    outcome: "Internal workflows run themselves, consistently.",
  },
];

const PROCESS = [
  { n: "01", title: "Discover", desc: "ELION examines your business and finds where opportunities are being lost." },
  { n: "02", title: "Diagnose", desc: "Gaps become specific, evidence-based automation opportunities." },
  { n: "03", title: "Design", desc: "Systems are configured around how your business actually operates." },
  { n: "04", title: "Build", desc: "The automation is implemented, connected, and tested." },
  { n: "05", title: "Operate", desc: "Systems run continuously while you retain full ownership." },
];

const LEAKS = [
  { text: "A lead waits." },
  { text: "A follow-up gets forgotten." },
  { text: "A booking requires another message." },
  { text: "A team member misses the handoff." },
];

const FAQ_CATEGORIES = [
  {
    category: "General",
    items: [
      { q: "What is ELION?", a: "ELION is a business automation company. We audit where businesses lose leads, time, and revenue, then build and operate the automation systems that fix those leaks." },
      { q: "Is ELION an agency or a software product?", a: "Both, intentionally. We operate like a company that deploys reusable automation infrastructure: audit, diagnose, design, build, and operate, with a real product layer for visibility and control." },
    ],
  },
  {
    category: "Audit",
    items: [
      { q: "Is the audit actually free?", a: "Yes. We analyze publicly available information about your business and deliver evidence-based findings at no cost. No credit card required." },
      { q: "What happens after the audit?", a: "We review your information, identify the most relevant automation opportunities, and contact you to discuss findings and next steps." },
    ],
  },
  {
    category: "Implementation",
    items: [
      { q: "How long does implementation take?", a: "Once we understand your workflow, we provide a timeline after the audit. Most systems move from diagnosis to live operation without unnecessary layers." },
      { q: "Do I need to change my existing software?", a: "No. ELION works around your existing stack, connecting WhatsApp, email, CRM, calendar, forms, and the tools you already use." },
    ],
  },
  {
    category: "Integrations",
    items: [
      { q: "What tools can ELION integrate with?", a: "WhatsApp, email providers, CRMs, Google Calendar, booking tools, spreadsheets, and custom APIs. We only claim integrations we genuinely support." },
      { q: "Are third-party software costs included?", a: "No. ELION builds the automation. Third-party tools remain separate subscriptions you own and control, with costs disclosed up front." },
    ],
  },
  {
    category: "Ownership",
    items: [
      { q: "Do I own the automation?", a: "Yes. Your workflows are documented and your systems are yours. No artificial lock-in, no dependency on ELION to keep running." },
      { q: "What happens if I cancel?", a: "Your automation continues running. You own it. Optional support can be renewed or dropped at any time." },
    ],
  },
  {
    category: "Security",
    items: [
      { q: "Is my business data secure?", a: "Yes. Data is handled through secure, industry-standard infrastructure. We do not sell or share your information." },
      { q: "Who can access my systems?", a: "Only you and the ELION team members you authorize. Every system is scoped to your organization." },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Motion presets (critically damped, interruptible, reduced-motion)  */
/* ------------------------------------------------------------------ */

const spring = { type: "spring" as const, damping: 30, stiffness: 300, mass: 0.8 };
const reveal = { opacity: 0, y: 24 };
const show = { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 30, stiffness: 260, mass: 0.8 } };

/* ------------------------------------------------------------------ */
/*  Small shared pieces                                                */
/* ------------------------------------------------------------------ */

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4">
      {children}
    </p>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
      <span className="text-xs font-medium text-[var(--color-accent)]">{children}</span>
    </span>
  );
}

function PrimaryCta({ href, children, size = "lg" }: { href: string; children: React.ReactNode; size?: "md" | "lg" }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97] ${
        size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"
      }`}
    >
      {children}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

function SecondaryCta({ href, children, size = "lg" }: { href: string; children: React.ReactNode; size?: "md" | "lg" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:text-white transition-all active:scale-[0.97] ${
        size === "lg" ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"
      }`}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Nav                                                                */
/* ------------------------------------------------------------------ */

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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="md:hidden overflow-hidden border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/95 backdrop-blur-xl"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  1. HERO                                                            */
/* ------------------------------------------------------------------ */

function Hero() {
  const reduced = useReducedMotion();
  const heroMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
      };
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden">
      {/* Ambient glow (restrained) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full bg-[var(--color-accent)]/[0.07] blur-[140px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full bg-[var(--color-accent-cyan)]/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div {...heroMotion}>
          <Eyebrow>AI Operations for Growing Businesses</Eyebrow>
        </motion.div>

        <motion.h1
          {...heroMotion}
          className="mt-8 text-5xl md:text-7xl font-bold text-[var(--color-text-primary)] leading-[1.04] tracking-[-0.03em]"
        >
          Find the leaks in your business.
          <br />
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">
            Then automate them.
          </span>
        </motion.h1>

        <motion.p
          {...heroMotion}
          className="mt-7 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed"
        >
          ELION identifies where leads, follow-ups, bookings, and operational
          workflows are breaking down, then deploys systems to fix them.
        </motion.p>

        <motion.div {...heroMotion} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <PrimaryCta href="/audit">Run Your Free Business Audit</PrimaryCta>
          <SecondaryCta href="/demo">
            <PlayCircle className="w-4 h-4" />
            See ELION in Action
          </SecondaryCta>
        </motion.div>

        <motion.p {...heroMotion} className="mt-8 text-xs text-[var(--color-text-muted)]">
          No credit card. No commitment. Evidence-based findings.
        </motion.p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  2. PRODUCT VISUALIZATION (illustrative)                            */
/* ------------------------------------------------------------------ */

function ProductPreview() {
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
  return (
    <section className="px-6 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Product Preview (Illustrative)
          </p>
        </div>

        <div className="relative rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/60">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="ml-3 text-[11px] text-[var(--color-text-muted)] font-medium">ELION Operations</span>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
            {/* Automation health */}
            <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Automation Health</h3>
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-success)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
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
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">{m.label}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]/70 mt-0.5">{m.note}</p>
                  </div>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{m.value}</span>
                </div>
              ))}
              <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Activity</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]/70 mt-0.5">last 24 hours</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                  <Activity className="w-4 h-4" />
                  8 executions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  3. PROBLEM                                                         */
/* ------------------------------------------------------------------ */

function ProblemSection() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={{ hidden: reveal, visible: show }}>
            <SectionTag>The Problem</SectionTag>
            <h2 className="text-4xl md:text-6xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.08]">
              Revenue doesn&apos;t always disappear loudly.
            </h2>
          </motion.div>

          <motion.div variants={{ hidden: reveal, visible: show }} className="mt-12 space-y-3 max-w-3xl">
            {LEAKS.map((l) => (
              <p key={l.text} className="text-xl md:text-2xl text-[var(--color-text-secondary)] leading-relaxed">
                {l.text}
              </p>
            ))}
          </motion.div>

          <motion.div variants={{ hidden: reveal, visible: show }} className="mt-12">
            <p className="text-base text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              These aren&apos;t isolated problems. They&apos;re operational leaks,
              and they compound quietly until they become the difference between
              a business that grows and one that stalls.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Slow lead response", "Forgotten follow-up", "Missed bookings", "Manual processes", "Poor handoffs"].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-lg border border-[var(--color-border)]/60 text-sm text-[var(--color-text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  4. ELION SYSTEM: interactive workflow map                          */
/* ------------------------------------------------------------------ */

function SystemMap() {
  const [active, setActive] = useState(2);
  const reduced = useReducedMotion();
  return (
    <section id="systems" className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionTag>One System</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            Every operational leak, covered.
          </h2>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
            ELION is built from reusable automation systems, configured around
            how each business operates. One architecture. Every leak.
          </p>
        </div>

        {/* Flow map */}
        <div className="relative rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 md:p-10">
          <div className="hidden lg:block absolute top-[52px] left-16 right-16 h-px bg-gradient-to-r from-transparent via-[var(--color-border-light)]/60 to-transparent" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-2">
            {SYSTEM_FLOW.map((s, i) => {
              const isActive = active === i;
              return (
                <button
                  key={s.label}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className="group flex flex-col items-center gap-3 cursor-pointer text-center relative z-10"
                  aria-pressed={isActive}
                >
                  <motion.div
                    animate={reduced ? {} : { scale: isActive ? 1.06 : 1 }}
                    transition={spring}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                      isActive
                        ? "bg-[var(--color-accent)]/15 border-[var(--color-accent)]/50"
                        : "bg-[var(--color-surface-raised)] border-[var(--color-border)] group-hover:border-[var(--color-border-light)]"
                    }`}
                  >
                    {isActive ? (
                      <CircleDot className="w-5 h-5 text-[var(--color-accent)]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--color-text-muted)]" />
                    )}
                  </motion.div>
                  <span className={`text-xs font-semibold ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"} transition-colors`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active node detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={spring}
              className="mt-8 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[var(--color-accent)] uppercase tracking-wider">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {SYSTEM_FLOW[active].label}
                </h3>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {SYSTEM_FLOW[active].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Systems grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {SYSTEMS.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 28, stiffness: 240, delay: i * 0.05 } },
              }}
              className="group p-6 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] hover:border-[var(--color-border-light)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent)]/20 transition-colors">
                <s.icon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                <span className="text-[var(--color-text-secondary)] font-medium">The leak: </span>
                {s.problem}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mt-1.5">
                <span className="text-[var(--color-success)] font-medium">The fix: </span>
                {s.outcome}
              </p>
            </motion.div>
          ))}

          {/* Custom systems card */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 28, stiffness: 240 } },
            }}
            className="group p-6 rounded-xl border border-dashed border-[var(--color-accent)]/25 bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">Custom Systems</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              For businesses requiring more complex workflows, ELION designs
              systems around the specific process.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  5. FREE BUSINESS AUDIT (centerpiece)                               */
/* ------------------------------------------------------------------ */

function AuditSection() {
  const findings = [
    { sev: "Critical", title: "Lead Response Gap", color: "#EF4444", desc: "Visitors can contact you, but there is no visible automated immediate response system." },
    { sev: "High", title: "No Follow-Up System", color: "#F59E0B", desc: "No automated follow-up was detected for prospects who do not convert on first contact." },
    { sev: "Opportunity", title: "Manual Booking Process", color: "#00D4FF", desc: "The customer journey requires manual interaction before booking is possible." },
  ];
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTag>Free Business Audit</SectionTag>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.08]">
              See what ELION sees.
            </h2>
            <p className="mt-6 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
              Run a free audit of your business and uncover where your current
              systems are leaking leads, time, and revenue. Evidence-based
              findings, no guesswork.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "We examine publicly accessible information about your business",
                "We identify observable operational gaps",
                "You receive a prioritized list of findings and opportunities",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <PrimaryCta href="/audit">Run Your Free Business Audit</PrimaryCta>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-xs text-[var(--color-text-muted)]">
              <span>No credit card</span>
              <span>No commitment</span>
              <span>Evidence-based findings</span>
            </div>
          </div>

          {/* Audit preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[var(--color-accent)]/[0.06] to-transparent rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)]/50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Business Audit</p>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Lagos Real Estate Agency</p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/25">
                  Illustrative
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-4 mb-6">
                  <div>
                    <p className="text-5xl font-bold text-[var(--color-text-primary)] tracking-tight">42</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Automation Score / 100</p>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-border)]/50 overflow-hidden">
                    <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)]" />
                  </div>
                </div>
                <div className="space-y-3">
                  {findings.map((f) => (
                    <div key={f.title} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: f.color }}>
                          {f.sev}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{f.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-muted)]">Illustrative example, not a real client</span>
                  <Link href="/audit" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline">
                    View full audit <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  6. CLIENT DASHBOARD PREVIEW                                        */
/* ------------------------------------------------------------------ */

function DashboardPreview() {
  const rows = [
    { name: "Adaeze O.", source: "WhatsApp", status: "Responded", time: "2 min ago" },
    { name: "Tunde B.", source: "Website", status: "Qualified", time: "14 min ago" },
    { name: "Chiamaka N.", source: "Instagram", status: "Follow-up", time: "1 hr ago" },
    { name: "Emeka U.", source: "Referral", status: "Booked", time: "3 hrs ago" },
  ];
  return (
    <section className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionTag>Client Experience</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            Your business. One operational view.
          </h2>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
            ELION gives you a single place to see what is working: automations,
            leads, follow-ups, bookings, and activity. No technical complexity.
            No infrastructure jargon.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Client Dashboard</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">What ELION is doing for your business</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-[var(--color-success)] bg-[var(--color-success)]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              All systems live
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Active Automations", value: "3" },
                { label: "Leads", value: "127" },
                { label: "Follow-Ups", value: "31" },
                { label: "Bookings", value: "12" },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                  <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{m.value}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--color-border)]/50 overflow-hidden">
              <div className="px-4 py-3 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Recent Activity</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">Sample data (illustrative)</span>
              </div>
              <div className="divide-y divide-[var(--color-border)]/40">
                {rows.map((r) => (
                  <div key={r.name} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[var(--color-accent)]">{r.name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--color-text-primary)] truncate">{r.name}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{r.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${
                        r.status === "Responded" ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
                        : r.status === "Qualified" ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                        : r.status === "Follow-up" ? "text-[var(--color-warning)] bg-[var(--color-warning)]/10"
                        : "text-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10"
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">{r.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Product preview (illustrative). Real metrics appear once your systems are live.
              </p>
              <SecondaryCta href="/demo" size="md">See the Full Demo</SecondaryCta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  7. ADMIN CONTROL PLANE                                             */
/* ------------------------------------------------------------------ */

function AdminSection() {
  const items = [
    { icon: Users, title: "Clients", desc: "What each client purchased, configured, and activated." },
    { icon: Layers, title: "Automations", desc: "Provisioning, testing, activation, and health across the base." },
    { icon: ServerCog, title: "Integrations", desc: "Connection status and credential health per client." },
    { icon: Activity, title: "Execution Logs", desc: "Every automation run, its outcome, and its errors." },
  ];
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)]/50">
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Control Plane</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">ELION Operations</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { label: "Provisioning", value: "1 pending · 3 live", tone: "#00D4FF" },
                  { label: "Integration Health", value: "2 healthy · 1 attention", tone: "#F59E0B" },
                  { label: "Automation Status", value: "5 live · 2 testing", tone: "#10B981" },
                  { label: "Support", value: "1 open ticket", tone: "#F8FAFC" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                    <span className="text-sm text-[var(--color-text-secondary)]">{row.label}</span>
                    <span className="text-xs font-semibold" style={{ color: row.tone }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5">
                <p className="text-[11px] text-[var(--color-text-muted)]">Illustrative admin view</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionTag>Built for Operators</SectionTag>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.08]">
              The infrastructure behind the automation.
            </h2>
            <p className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
              ELION isn&apos;t just building workflows. It&apos;s the platform that
              deploys and operates them at scale, without rebuilding software
              for every client.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {items.map((it) => (
                <div key={it.title} className="p-5 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)]">
                  <it.icon className="w-5 h-5 text-[var(--color-accent)] mb-3" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{it.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{it.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  8. HOW IT WORKS                                                    */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionTag>How ELION Works</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            From finding the leak to fixing it.
          </h2>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
            Evidence before automation. We identify the problem first, then
            determine what should be automated.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PROCESS.map((p, i) => (
            <motion.div
              key={p.n}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 28, stiffness: 240, delay: i * 0.06 } },
              }}
              className="relative p-6 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] hover:border-[var(--color-border-light)] transition-colors"
            >
              <span className="absolute top-4 right-5 text-3xl font-bold text-[var(--color-accent)]/12 tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {p.n}
              </span>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
                <span className="text-xs font-bold text-[var(--color-accent)]">{i + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{p.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  9. OWNERSHIP                                                       */
/* ------------------------------------------------------------------ */

function OwnershipSection() {
  const items = [
    { title: "Workflows", desc: "Documented and yours to keep." },
    { title: "Configurations", desc: "Your settings, your control." },
    { title: "Data", desc: "Your leads, your records, your information." },
    { title: "Documentation", desc: "Handover materials when you need them." },
  ];
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <SectionTag>Ownership</SectionTag>
        <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
          You own the system.
        </h2>
        <p className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto">
          No lock-in. No mysterious black box. No dependency on ELION to keep
          your business running.
        </p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {items.map((it) => (
            <div key={it.title} className="p-5 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)]">
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] mb-3" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{it.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  10. PRICING                                                        */
/* ------------------------------------------------------------------ */

function PricingSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionTag>Pricing</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            Automation that pays for itself.
          </h2>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
            Pricing depends on the systems and scope your business needs. Start
            with the free audit to find out what&apos;s actually leaking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Starter", price: "NGN 100,000", note: "One automation system, implemented and handed over." },
            { name: "Growth", price: "NGN 350,000", note: "Multiple systems working together, with optional support.", featured: true },
            { name: "Scale", price: "NGN 750,000", note: "Full operations layer across lead, booking, and recovery." },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative p-6 rounded-xl border transition-colors ${
                p.featured
                  ? "border-[var(--color-accent)]/40 bg-[var(--color-surface)] shadow-xl shadow-[var(--color-accent)]/10"
                  : "border-[var(--color-border)]/50 bg-[var(--color-surface-raised)]"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-wider">
                  Most Common
                </span>
              )}
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{p.name}</h3>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{p.price}</p>
              <p className="mt-3 text-xs text-[var(--color-text-muted)] leading-relaxed">{p.note}</p>
              <Link
                href="/landing/pricing"
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  p.featured ? "text-[var(--color-accent)] hover:underline" : "text-[var(--color-text-secondary)] hover:text-white"
                }`}
              >
                View details <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Not sure what you need? That&apos;s what the audit is for.
          </p>
          <PrimaryCta href="/audit">Find Out What Your Business Needs</PrimaryCta>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  11. FAQ                                                            */
/* ------------------------------------------------------------------ */

function FaqSection() {
  const [open, setOpen] = useState<{ cat: number; item: number } | null>({ cat: 0, item: 0 });
  const reduced = useReducedMotion();
  return (
    <section id="faq" className="py-24 md:py-32 px-6 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <SectionTag>FAQ</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            Questions, answered.
          </h2>
        </div>

        <div className="space-y-8">
          {FAQ_CATEGORIES.map((cat, ci) => (
            <div key={cat.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                {cat.category}
              </h3>
              <div className="space-y-2">
                {cat.items.map((f, ii) => {
                  const key = { cat: ci, item: ii };
                  const isOpen = open?.cat === ci && open.item === ii;
                  return (
                    <div key={f.q} className="rounded-xl border border-[var(--color-border)]/50 overflow-hidden">
                      <button
                        onClick={() => setOpen(isOpen ? null : key)}
                        aria-expanded={isOpen}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{f.q}</span>
                        <motion.span
                          animate={reduced ? {} : { rotate: isOpen ? 180 : 0 }}
                          transition={spring}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isOpen ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={spring}
                            style={{ overflow: "hidden", transformOrigin: "top" }}
                          >
                            <div className="px-5 pb-4">
                              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  12. FINAL CTA                                                      */
/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="py-28 md:py-36 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-accent)]/[0.05] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[var(--color-accent)]/[0.06] blur-[120px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.06]">
          Your next operational leak is probably already costing you money.
        </h2>
        <p className="mt-7 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto">
          See what&apos;s breaking. Fix what matters. Automate what repeats.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <PrimaryCta href="/audit">Run Your Free Business Audit</PrimaryCta>
          <SecondaryCta href="/demo">
            <PlayCircle className="w-4 h-4" />
            See ELION in Action
          </SecondaryCta>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

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