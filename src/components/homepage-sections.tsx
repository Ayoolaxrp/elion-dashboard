"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  motion, AnimatePresence, useReducedMotion, useScroll,
  useTransform, useMotionValueEvent,
} from "framer-motion";
import { useSafeReduced } from "@/components/home/use-safe-reduced";
import {
  ArrowRight, ArrowUpRight, CheckCircle2, Zap, Mail, Calendar,
  RotateCcw, Settings, Activity, ChevronDown, PlayCircle, Users,
  Layers, ServerCog, Globe, FileSearch, Gauge, Boxes, ScanLine,
} from "lucide-react";
import { EnvBackdrop, EnvRingMotif } from "@/components/home/env";
import { ELION_TIERS } from "@/lib/pricing";

const spring = { type: "spring" as const, damping: 30, stiffness: 300, mass: 0.8 };
const reveal = { opacity: 0, y: 24 };
const show = { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 30, stiffness: 260, mass: 0.8 } };

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

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4">
      {children}
    </p>
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
/* Problem : editorial statement with staggered line reveals.          */
/* ------------------------------------------------------------------ */
export function ProblemSection() {
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

          <motion.div variants={{ hidden: reveal, visible: show }} className="mt-12 space-y-4 max-w-3xl">
            {LEAKS.map((l, i) => (
              <motion.div
                key={l.text}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring" as const, damping: 26, stiffness: 240, delay: 0.15 + i * 0.12 }}
                className="flex items-baseline gap-4 group"
              >
                <span
                  aria-hidden
                  className="w-8 h-px shrink-0 translate-y-[-4px] bg-gradient-to-r from-[var(--color-accent)]/70 to-transparent group-hover:w-12 transition-all duration-500"
                />
                <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] leading-relaxed">
                  {l.text}
                </p>
              </motion.div>
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
                <motion.span
                  key={tag}
                  whileHover={{ y: -2 }}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)]/60 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] transition-colors cursor-default"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* One-system pipeline : sticky scroll story (Lead -> Measure).        */
/* The visual anchors while the visitor scrolls; each stage activates. */
/* Mobile renders a simple non-sticky progression.                     */
/* ------------------------------------------------------------------ */
function OneSystemPipeline() {
  const reduced = useSafeReduced();
  const outerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ["start 0.9", "end 0.1"],
  });
  const [active, setActive] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(SYSTEM_FLOW.length - 1, Math.max(0, Math.floor(v * SYSTEM_FLOW.length)));
    setActive((prev) => (prev === next ? prev : next));
  });

  if (reduced) {
    return (
      <div className="hidden md:grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">The operating loop</p>
          <ul className="mt-6 space-y-4">
            {SYSTEM_FLOW.map((s) => (
              <li key={s.label} className="flex gap-4">
                <span className="text-[11px] font-bold text-[var(--color-accent-bright)] pt-0.5 tabular-nums">
                  {String(SYSTEM_FLOW.indexOf(s) + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.label}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div ref={outerRef} className="relative hidden md:block" style={{ height: "260vh" }}>
      <div className="sticky top-24 h-[calc(100vh-7rem)] flex items-center">
        <div className="w-full grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-14 items-center">
          {/* Copy column */}
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-bright)] mb-4">
              The operating loop
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-5xl font-bold text-[var(--color-accent)]/15 tabular-nums tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {String(active + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-[-0.02em]">
                    {active >= 0 ? SYSTEM_FLOW[active].label : "Lead"}
                  </h3>
                </div>
                <p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-md">
                  {active >= 0 ? SYSTEM_FLOW[active].desc : SYSTEM_FLOW[0].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 max-w-xs">
              <div className="h-1 rounded-full bg-[var(--color-border)]/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] origin-left"
                  style={{ scaleX: scrollYProgress }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[var(--color-text-muted)]" data-pipeline-caption>
                Stage {Math.min(active + 1, 8)} of {SYSTEM_FLOW.length}  · keep scrolling
              </p>
            </div>
          </div>

          {/* Visual column : pipeline */}
          <div className="rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)]/70 p-6 md:p-8 relative overflow-hidden">
            <div aria-hidden className="env-grid-line absolute inset-0 opacity-60" />
            <div className="relative">
              {SYSTEM_FLOW.map((s, i) => {
                const state = i < active ? "done" : i === active ? "now" : "todo";
                return (
                  <div key={s.label} className="relative flex items-center gap-4 py-[7px]">
                    {i < SYSTEM_FLOW.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[9px] top-[30px] bottom-[-6px] w-px"
                        style={{
                          background:
                            i < active
                              ? "var(--color-success)"
                              : "var(--color-border)",
                        }}
                      />
                    )}
                    <span
                      className={`relative z-10 w-[19px] h-[19px] rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                        state === "done"
                          ? "border-[var(--color-success)] bg-[var(--color-success)]/15"
                          : state === "now"
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20 shadow-[0_0_0_4px_rgba(59,102,232,0.12)]"
                            : "border-[var(--color-border-light)] bg-[var(--color-surface)]"
                      }`}
                    >
                      {state === "done" && <span className="w-1 h-1 rounded-full bg-[var(--color-success)]" />}
                      {state === "now" && <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-node-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)]" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-accent)]" />
                      </span>}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold transition-colors duration-300 ${
                          state === "now"
                            ? "text-[var(--color-text-primary)]"
                            : state === "done"
                              ? "text-[var(--color-text-secondary)]"
                              : "text-[var(--color-text-muted)]/70"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                    <span
                      className={`ml-auto text-[10px] uppercase tracking-wider tabular-nums transition-colors ${
                        state === "now"
                          ? "text-[var(--color-accent-bright)]"
                          : state === "done"
                            ? "text-[var(--color-success)]"
                            : "text-[var(--color-text-muted)]/50"
                      }`}
                    >
                      {state === "done" ? "Done" : state === "now" ? "Active" : String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product stack : sticky-stacking cards for the automation systems.   */
/* Mobile renders as a normal stacked list with sequential reveals.    */
/* ------------------------------------------------------------------ */
function ProductStack() {
  const reduced = useSafeReduced();
  type SystemCard = (typeof SYSTEMS)[number] & { custom?: boolean };
  const items: SystemCard[] = [
    ...SYSTEMS,
    {
      icon: Layers,
      title: "Custom Systems",
      problem: "Complex workflows need more than an off-the-shelf template.",
      outcome: "Systems designed around your specific process, still on ELION's architecture.",
      custom: true,
    },
  ];

  return (
    <div className="mt-10 md:mt-0 relative">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-bright)]">
          The building blocks
        </p>
        <p className="mt-3 text-xl md:text-2xl text-[var(--color-text-secondary)]">
          Reusable systems, configured around how your business actually operates.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-5 md:space-y-0">
        {items.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="md:stack-card"
              style={reduced ? undefined : { top: `calc(84px + ${i * 18}px)`, zIndex: items.length - i }}
            >
              <motion.div
                initial={reduced ? undefined : { opacity: 0, y: 26, scale: 0.985 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring" as const, damping: 28, stiffness: 240 }}
                className={`rounded-2xl border p-6 md:p-7 bg-[var(--color-surface-raised)] ${
                  s.custom
                    ? "border-dashed border-[var(--color-accent)]/30"
                    : "border-[var(--color-border)]/60 shadow-xl shadow-black/30"
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
                        {s.title}
                      </h3>
                      {s.custom && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)] border border-[var(--color-accent)]/20">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      <span className="text-[var(--color-text-secondary)] font-medium">The leak: </span>
                      {s.problem}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mt-1.5">
                      <span className="text-[var(--color-success)] font-medium">The fix: </span>
                      {s.outcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Stack tail : everything converges on one operational system */}
      <div className="mt-12 text-center">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, scale: 0.96 }}
          whileInView={reduced ? undefined : { opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ type: "spring" as const, damping: 24, stiffness: 200 }}
          className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border border-[var(--color-border)]/60 bg-gradient-to-b from-[var(--color-surface-raised)] to-[var(--color-surface)]"
        >
          <Boxes className="w-6 h-6 text-[var(--color-accent-cyan)]" aria-hidden />
          <p className="text-base md:text-lg text-[var(--color-text-primary)] font-semibold">
            One architecture. Every leak covered.
          </p>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md">
            The same parts : configured per business, operated as one system you own.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function SystemMap() {
  const reduced = useReducedMotion();
  return (
    <section id="systems" className="pt-24 md:pt-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 20 }}
            whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
          >
            <SectionTag>One System</SectionTag>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
              Every operational leak, covered.
            </h2>
            <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
              Follow one lead through the system ELION operates, then see the
              reusable systems each business can deploy.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Sticky pipeline story (desktop) + sequential list (mobile/reduced) */}
      <div className="max-w-6xl mx-auto">
        <OneSystemPipeline />
        <div className="md:hidden max-w-3xl mx-auto">
          {SYSTEM_FLOW.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduced ? undefined : { opacity: 0, y: 14 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring" as const, damping: 28, stiffness: 250 }}
              className="flex gap-4 py-4 border-b border-[var(--color-border)]/30 last:border-0"
            >
              <span className="text-[11px] font-bold text-[var(--color-accent-bright)] pt-1 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.label}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Product stack */}
      <div className="max-w-6xl mx-auto md:py-10 pb-24 md:pb-32">
        <ProductStack />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Audit : free-audit section with investigation sequence + report.    */
/* ------------------------------------------------------------------ */
export function AuditSection() {
  const reduced = useReducedMotion();
  const findings = [
    { sev: "Critical", title: "Lead Response Gap", color: "#EF4444", desc: "Visitors can contact you, but there is no visible automated immediate response system." },
    { sev: "High", title: "No Follow-Up System", color: "#F59E0B", desc: "No automated follow-up was detected for prospects who do not convert on first contact." },
    { sev: "Opportunity", title: "Manual Booking Process", color: "#00D4FF", desc: "The customer journey requires manual interaction before booking is possible." },
  ];
  const steps = [
    { icon: Globe, label: "Website" },
    { icon: ScanLine, label: "Investigate" },
    { icon: FileSearch, label: "Evidence" },
    { icon: Gauge, label: "Gaps" },
    { icon: Boxes, label: "Systems" },
  ];
  const bullets = [
    "We examine publicly accessible information about your business",
    "We identify observable operational gaps",
    "You receive a prioritized list of findings and opportunities",
  ];

  const staggerItem = (i: number) => ({
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: "spring" as const, damping: 28, stiffness: 240, delay: reduced ? 0 : i * 0.09 },
    },
  });

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-70px" }}
            variants={{ hidden: {}, visible: {} }}
          >
            <motion.div variants={staggerItem(0)}>
              <SectionTag>Free Business Audit</SectionTag>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.08]">
                See what ELION sees.
              </h2>
            </motion.div>
            <motion.p variants={staggerItem(1)} className="mt-6 text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
              Run a free audit of your business and uncover where your current
              systems are leaking leads, time, and revenue. Evidence-based
              findings, no guesswork.
            </motion.p>
            <div className="mt-8 space-y-3">
              {bullets.map((t, i) => (
                <motion.div key={t} variants={staggerItem(2 + i)} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0 mt-0.5" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{t}</span>
                </motion.div>
              ))}
            </div>
            <motion.div variants={staggerItem(5)} className="mt-10">
              <PrimaryCta href="/audit">Run Your Free Business Audit</PrimaryCta>
            </motion.div>
            <motion.div variants={staggerItem(6)} className="mt-6 flex flex-wrap gap-5 text-xs text-[var(--color-text-muted)]">
              <span>No credit card</span>
              <span>No commitment</span>
              <span>Evidence-based findings</span>
            </motion.div>
          </motion.div>

          <div className="relative">
            {/* investigation sequence */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
              className="flex items-center justify-between gap-2 mb-4 px-2"
            >
              {steps.map((st, i) => (
                <div key={st.label} className="flex items-center gap-2 flex-1 last:flex-none">
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: { opacity: 1, scale: 1, transition: spring },
                    }}
                    className="flex flex-col items-center gap-1.5 text-center"
                  >
                    <span className="w-9 h-9 rounded-full border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] flex items-center justify-center">
                      <st.icon className="w-4 h-4 text-[var(--color-accent-bright)]" />
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] hidden sm:block">
                      {st.label}
                    </span>
                  </motion.div>
                  {i < steps.length - 1 && (
                    <motion.span
                      aria-hidden
                      variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.5, delay: 0.2 + i * 0.1 } } }}
                      className="hidden sm:block flex-1 h-px origin-left bg-gradient-to-r from-[var(--color-accent)]/60 to-[var(--color-border)]"
                    />
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 30 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring" as const, damping: 28, stiffness: 240 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-[var(--color-accent)]/[0.06] to-transparent rounded-3xl pointer-events-none" aria-hidden />
              <div className="relative rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)]/50 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Business Audit</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Lagos Real Estate Agency</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)]/15 text-[var(--color-accent-bright)] border border-[var(--color-accent)]/25">
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
                      <motion.div
                        initial={reduced ? { width: "42%" } : { width: 0 }}
                        whileInView={{ width: "42%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {findings.map((f, i) => (
                      <motion.div
                        key={f.title}
                        initial={reduced ? undefined : { opacity: 0, x: 14 }}
                        whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ type: "spring" as const, damping: 26, stiffness: 220, delay: 0.25 + i * 0.14 }}
                        className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: f.color }}>
                            {f.sev}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{f.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{f.desc}</p>
                      </motion.div>
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
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Client dashboard : interface progressively assembles + floats.      */
/* ------------------------------------------------------------------ */
export function DashboardPreview() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const floatY = useTransform(scrollYProgress, [0, 0.5, 1], [26, 0, -26]);

  const rows = [
    { name: "Adaeze O.", source: "WhatsApp", status: "Responded", time: "2 min ago" },
    { name: "Tunde B.", source: "Website", status: "Qualified", time: "14 min ago" },
    { name: "Chiamaka N.", source: "Instagram", status: "Follow-up", time: "1 hr ago" },
    { name: "Emeka U.", source: "Referral", status: "Booked", time: "3 hrs ago" },
  ];
  const stats = [
    { label: "Active Automations", value: "3" },
    { label: "Leads", value: "127" },
    { label: "Follow-Ups", value: "31" },
    { label: "Bookings", value: "12" },
  ];
  const staggerItem = (i: number) => ({
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 14 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: "spring" as const, damping: 26, stiffness: 240, delay: reduced ? 0 : i * 0.07 },
    },
  });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-70px" }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.div variants={staggerItem(0)}>
            <SectionTag>Client Experience</SectionTag>
          </motion.div>
          <motion.div variants={staggerItem(1)}>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
              Your business. One operational view.
            </h2>
          </motion.div>
          <motion.div variants={staggerItem(2)}>
            <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
              ELION gives you a single place to see what is working: automations,
              leads, follow-ups, bookings, and activity. No technical complexity.
              No infrastructure jargon.
            </p>
          </motion.div>
        </motion.div>          <motion.div
            style={reduced ? undefined : { y: floatY }}
            className="relative"
          >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-70px" }}
            variants={{ hidden: {}, visible: {} }}
            className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Shell header */}
            <motion.div variants={staggerItem(0)} className="px-6 py-4 border-b border-[var(--color-border)]/50 flex items-center justify-between">
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
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-node-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)]" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-success)]" />
                </span>
                All systems live
              </span>
            </motion.div>

            <div className="p-6 md:p-8">
              {/* Stats assemble */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {stats.map((m, i) => (
                  <motion.div
                    key={m.label}
                    variants={staggerItem(1 + i * 0.6)}
                    className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50"
                  >
                    <motion.p
                      initial={reduced ? undefined : { opacity: 0 }}
                      whileInView={reduced ? undefined : { opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 + i * 0.12 }}
                      className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight"
                    >
                      {m.value}
                    </motion.p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{m.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Activity list */}
              <motion.div variants={staggerItem(2)} className="rounded-xl border border-[var(--color-border)]/50 overflow-hidden">
                <div className="px-4 py-3 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Recent Activity</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">Sample data (illustrative)</span>
                </div>
                <div className="divide-y divide-[var(--color-border)]/40">
                  {rows.map((r, i) => (
                    <motion.div
                      key={r.name}
                      initial={reduced ? undefined : { opacity: 0, x: 16 }}
                      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ type: "spring" as const, damping: 26, stiffness: 240, delay: 0.15 + i * 0.09 }}
                      className="px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--color-accent-bright)]">{r.name[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[var(--color-text-primary)] truncate">{r.name}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{r.source}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-[11px] font-medium px-2 py-1 rounded-md ${
                          r.status === "Responded" ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
                          : r.status === "Qualified" ? "text-[var(--color-accent-bright)] bg-[var(--color-accent)]/10"
                          : r.status === "Follow-up" ? "text-[var(--color-warning)] bg-[var(--color-warning)]/10"
                          : "text-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10"
                        }`}>
                          {r.status}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">{r.time}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={staggerItem(3)} className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-[var(--color-text-muted)]">
                  Product preview (illustrative). Real metrics appear once your systems are live.
                </p>
                <SecondaryCta href="/demo" size="md">See the Full Demo</SecondaryCta>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Control plane : admin infrastructure with live connection feel.     */
/* ------------------------------------------------------------------ */
export function AdminSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const floatY = useTransform(scrollYProgress, [0, 0.5, 1], [-22, 0, 22]);

  const items = [
    { icon: Users, title: "Clients", desc: "What each client purchased, configured, and activated." },
    { icon: Layers, title: "Automations", desc: "Provisioning, testing, activation, and health across the base." },
    { icon: ServerCog, title: "Integrations", desc: "Connection status and credential health per client." },
    { icon: Activity, title: "Execution Logs", desc: "Every automation run, its outcome, and its errors." },
  ];
  const staggerItem = (i: number) => ({
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 },
    visible: {
      opacity: 1, y: 0,
      transition: { type: "spring" as const, damping: 28, stiffness: 250, delay: reduced ? 0 : i * 0.08 },
    },
  });

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-70px" }}
            style={reduced ? undefined : { y: floatY }}
            variants={{ hidden: {}, visible: {} }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] overflow-hidden">
              <motion.div variants={staggerItem(0)} className="px-6 py-4 border-b border-[var(--color-border)]/50">
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Control Plane</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">ELION Operations</p>
              </motion.div>
              <div className="p-6 space-y-3">
                {[
                  { label: "Provisioning", value: "1 pending · 3 live", tone: "#00D4FF" },
                  { label: "Integration Health", value: "2 healthy · 1 attention", tone: "#F59E0B" },
                  { label: "Automation Status", value: "5 live · 2 testing", tone: "#10B981" },
                  { label: "Support", value: "1 open ticket", tone: "#F8FAFC" },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    variants={staggerItem(1 + i * 0.5)}
                    className="relative flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 overflow-hidden"
                  >
                    <motion.span
                      aria-hidden
                      initial={reduced ? undefined : { scaleY: 0 }}
                      whileInView={reduced ? undefined : { scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: 0.25 + i * 0.1 }}
                      className="absolute left-0 top-0 bottom-0 w-[2px] origin-top bg-gradient-to-b from-[var(--color-accent)] to-[var(--color-accent-cyan)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)] pl-2">{row.label}</span>
                    <span className="text-xs font-semibold" style={{ color: row.tone }}>{row.value}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={staggerItem(4)} className="px-6 pb-5">
                <p className="text-[11px] text-[var(--color-text-muted)]">Illustrative admin view</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-70px" }}
            variants={{ hidden: {}, visible: {} }}
            className="order-1 lg:order-2"
          >
            <motion.div variants={staggerItem(0)}>
              <SectionTag>Built for Operators</SectionTag>
            </motion.div>
            <motion.div variants={staggerItem(1)}>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.08]">
                The infrastructure behind the automation.
              </h2>
            </motion.div>
            <motion.p variants={staggerItem(2)} className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-lg">
              ELION isn&apos;t just building workflows. It&apos;s the platform that
              deploys and operates them at scale, without rebuilding software
              for every client.
            </motion.p>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {items.map((it, i) => (
                <motion.div
                  key={it.title}
                  variants={staggerItem(3 + i * 0.6)}
                  whileHover={reduced ? undefined : { y: -3 }}
                  className="p-5 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] hover:border-[var(--color-border-light)] transition-colors"
                >
                  <it.icon className="w-5 h-5 text-[var(--color-accent)] mb-3" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{it.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{it.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How ELION Works : pipeline progress driven by scroll.               */
/* ------------------------------------------------------------------ */
export function HowItWorks() {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.85", "end 0.55"],
  });

  return (
    <section id="how" className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <SectionTag>How ELION Works</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            From finding the leak to fixing it.
          </h2>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
            Evidence before automation. We identify the problem first, then
            determine what should be automated.
          </p>
        </motion.div>

        <div ref={trackRef} className="relative">
          {/* scroll progress rail */}
          <div aria-hidden className="hidden lg:block h-px bg-[var(--color-border)]/40 absolute top-0 left-0 right-0">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)]"
              style={{ scaleX: reduced ? 1 : scrollYProgress }}
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-4 pt-0 lg:pt-10">
            {PROCESS.map((p, i) => (
              <motion.div
                key={p.n}
                initial={reduced ? undefined : { opacity: 0, y: 24 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ type: "spring" as const, damping: 26, stiffness: 230, delay: reduced ? 0 : i * 0.08 }}
                whileHover={reduced ? undefined : { y: -4 }}
                className="relative p-6 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] hover:border-[var(--color-border-light)] hover:shadow-lg hover:shadow-black/20 transition-all group"
              >
                <span
                  aria-hidden
                  className="absolute top-4 right-5 text-3xl font-bold text-[var(--color-accent)]/12 tracking-tight group-hover:text-[var(--color-accent)]/25 transition-colors"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {p.n}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4 border border-[var(--color-accent)]/15 group-hover:bg-[var(--color-accent)]/20 transition-colors">
                  <span className="text-xs font-bold text-[var(--color-accent-bright)]">{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ownership : layers separate, then fold together under one idea.     */
/* ------------------------------------------------------------------ */
export function OwnershipSection() {
  const reduced = useReducedMotion();
  const items = [
    { title: "Workflows", desc: "Documented and yours to keep.", offset: -40, rotate: -1.6 },
    { title: "Configurations", desc: "Your settings, your control.", offset: 40, rotate: 1.6 },
    { title: "Data", desc: "Your leads, your records, your information.", offset: -32, rotate: 1.2 },
    { title: "Documentation", desc: "Handover materials when you need them.", offset: 32, rotate: -1.2 },
  ];
  return (
    <section className="py-24 md:py-32 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
        >
          <SectionTag>Ownership</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            You own the system.
          </h2>
          <p className="mt-6 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto">
            No lock-in. No mysterious black box. No dependency on ELION to keep
            your business running.
          </p>
        </motion.div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={
                reduced
                  ? undefined
                  : { opacity: 0, x: it.offset, y: 14, rotate: it.rotate, scale: 0.96 }
              }
              whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                type: "spring" as const, damping: 18, stiffness: 140,
                delay: reduced ? 0 : 0.1 + i * 0.07,
              }}
              whileHover={reduced ? undefined : { y: -4 }}
              className="p-5 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] hover:border-[var(--color-border-light)] transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] mb-3" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{it.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{it.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={reduced ? undefined : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
        >
          Workflows · Configurations · Data · Documentation : all yours.
        </motion.p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing : restrained entrance + depth.                              */
/* ------------------------------------------------------------------ */
export function PricingSection() {
  const reduced = useReducedMotion();
  // Canonical pricing lives in src/lib/pricing.ts (ELION_TIERS) , the same
  // model as /funnel and /landing/pricing, so no page can drift.
  const plans = ELION_TIERS.map((t) => ({
    name: t.name,
    price: t.price,
    note: t.bestFor.charAt(0).toUpperCase() + t.bestFor.slice(1) + " : one-time implementation fee. " + t.supportDays + ".",
    featured: t.popular,
  }));
  return (
    <section className="py-24 md:py-32 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <SectionTag>Pricing</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            Automation that pays for itself.
          </h2>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] leading-relaxed">
            One-time implementation fee. Optional monthly support. Pricing
            depends on the systems and scope your business needs : start with
            the free audit to find out what&apos;s actually leaking.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={reduced ? undefined : { opacity: 0, y: 26 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring" as const, damping: 26, stiffness: 220, delay: reduced ? 0 : i * 0.1 }}
              whileHover={reduced ? undefined : { y: -5 }}
              className={`relative p-6 rounded-xl border transition-colors ${
                p.featured
                  ? "border-[var(--color-accent)]/40 bg-[var(--color-surface)] shadow-xl shadow-[var(--color-accent)]/10"
                  : "border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] hover:border-[var(--color-border-light)]"
              } ${p.featured ? "md:-translate-y-2" : ""}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[var(--color-accent)]/30">
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
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={reduced ? undefined : { opacity: 0, y: 10 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center text-xs text-[var(--color-text-muted)]"
        >
          Every implementation: Discover → Configure → Build → Test → Deploy → Handover. Optional ongoing support from ₦50,000/month.
        </motion.p>

        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Not sure what you need? That&apos;s what the audit is for.
          </p>
          <PrimaryCta href="/audit">Find Out What Your Business Needs</PrimaryCta>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ : accessible premium accordion.                                 */
/* ------------------------------------------------------------------ */
export function FaqSection() {
  const [open, setOpen] = useState<{ cat: number; item: number } | null>({ cat: 0, item: 0 });
  const reduced = useReducedMotion();
  return (
    <section id="faq" className="py-24 md:py-32 px-6 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
          className="text-center mb-14"
        >
          <SectionTag>FAQ</SectionTag>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
            Questions, answered.
          </h2>
        </motion.div>

        <div className="space-y-8">
          {FAQ_CATEGORIES.map((cat, ci) => (
            <div key={cat.category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                {cat.category}
              </h3>
              <div className="space-y-2">
                {cat.items.map((f, ii) => {
                  const key = { cat: ci, item: ii };
                  const uid = `faq-${ci}-${ii}`;
                  const isOpen = open?.cat === ci && open.item === ii;
                  return (
                    <motion.div
                      key={f.q}
                      initial={reduced ? undefined : { opacity: 0, y: 12 }}
                      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ type: "spring" as const, damping: 28, stiffness: 250, delay: (ci + ii) * 0.03 }}
                      className={`rounded-xl border transition-colors overflow-hidden ${
                        isOpen ? "border-[var(--color-accent)]/25 bg-[var(--color-surface-raised)]/60" : "border-[var(--color-border)]/50"
                      }`}
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : key)}
                        aria-expanded={isOpen}
                        aria-controls={uid}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{f.q}</span>
                        <motion.span
                          animate={reduced ? undefined : { rotate: isOpen ? 180 : 0 }}
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
                            id={uid}
                            role="region"
                            aria-label={f.q}
                            initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                            transition={spring}
                            style={{ overflow: "hidden", transformOrigin: "top" }}
                          >
                            <div className="px-5 pb-4">
                              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
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
/* Final CTA , the environment returns.                                */
/* ------------------------------------------------------------------ */
export function FinalCta() {
  const reduced = useSafeReduced();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end end"],
  });
  const oBackdrop = useTransform(scrollYProgress, [0, 0.55, 1], [0.35, 1, 1]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <section ref={sectionRef} className="relative py-32 md:py-44 px-6 overflow-hidden border-t border-[var(--color-border)]/30">
      {/* The hero environment returns */}
      <motion.div
        aria-hidden
        style={reduced ? undefined : { opacity: oBackdrop, y: yGlow }}
        className="absolute inset-0"
      >
        <EnvBackdrop />
      </motion.div>
      {!reduced && (
        <motion.div style={{ opacity: oBackdrop }} className="absolute inset-0">
          <EnvRingMotif className="left-[6%] top-1/3 w-64 h-64 hidden lg:block" />
        </motion.div>
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-b from-transparent to-[var(--color-surface)]"
      />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent-bright)] mb-6">
            Back where we started
          </p>
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
          <p className="mt-8 text-xs text-[var(--color-text-muted)]">
            One system. Every operational leak. Owned by you.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
