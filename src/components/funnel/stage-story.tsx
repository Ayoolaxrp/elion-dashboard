"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSafeReduced } from "@/components/home/use-safe-reduced";
import { cn } from "@/lib/utils";

/**
 * Funnel method section — a sticky, scroll-driven story that transforms one
 * object through five states: Discover → Diagnose → Design → Build → Operate.
 *
 * Desktop: a tall scroll track holds the story in view; the stage index is
 * derived from scroll progress (01/05 … 05/05) and the visual panel changes
 * per stage. Mobile & reduced-motion: a plain vertical sequence, all content
 * visible with no sticky behavior.
 */

interface StageDef {
  n: string;
  title: string;
  kicker: string;
  copy: string;
}

const STAGES: StageDef[] = [
  {
    n: "01",
    title: "Discover",
    kicker: "We are looking at the business.",
    copy: "Your website, channels, enquiries and customer touchpoints become signals. ELION maps where operational activity actually happens.",
  },
  {
    n: "02",
    title: "Diagnose",
    kicker: "Operational noise becomes identifiable leaks.",
    copy: "Signals that matter are separated from noise. Response delays, missing follow-up, manual booking — each becomes a specific, evidence-based opportunity.",
  },
  {
    n: "03",
    title: "Design",
    kicker: "The leak becomes a system blueprint.",
    copy: "A workflow is architected around how your business actually operates — not a template bolted on. Configuration panels take shape for your real tools.",
  },
  {
    n: "04",
    title: "Build",
    kicker: "Blueprint becomes connected infrastructure.",
    copy: "WhatsApp, email, calendar and CRM are connected, configured and tested against the workflow. Real deployments stay gated until required providers are connected.",
  },
  {
    n: "05",
    title: "Operate",
    kicker: "Construction becomes continuous operation.",
    copy: "The system runs quietly: leads responded to, follow-ups scheduled, bookings created, activity recorded. Your business keeps moving — ELION keeps the workflow moving with it.",
  },
];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/* ------------------------------------------------------------------ */
/* Per-stage visual panels (illustrative product states)               */
/* ------------------------------------------------------------------ */

function Node({ label, tone = "idle", delay = 0 }: { label: string; tone?: "idle" | "accent" | "danger" | "ok"; delay?: number }) {
  const dot =
    tone === "accent" ? "bg-[var(--color-accent)]" : tone === "danger" ? "bg-[var(--color-error)]" : tone === "ok" ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]/40";
  const ring =
    tone === "accent"
      ? "border-[var(--color-accent)]/40 text-[var(--color-accent)]"
      : tone === "danger"
        ? "border-[var(--color-error)]/40 text-[var(--color-error)]"
        : tone === "ok"
          ? "border-[var(--color-success)]/40 text-[var(--color-success)]"
          : "border-[var(--color-border)] text-[var(--color-text-secondary)]";
  return (
    <div className={cn("flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border bg-[var(--color-surface)]/60 backdrop-blur-sm min-w-0", ring)} style={{ transitionDelay: `${delay}ms` }}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
      <span className="text-xs font-medium truncate">{label}</span>
    </div>
  );
}

function SceneDiscover() {
  const channels = ["Website", "WhatsApp", "Instagram", "Facebook", "Google Ads"];
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      <div className="flex flex-wrap justify-center gap-2">
        {channels.map((c) => (
          <Node key={c} label={c} />
        ))}
      </div>
      <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--color-accent)]/50" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-semibold">signals collected</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--color-accent)]/50" />
      </div>
      <div className="w-40 h-24 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.06] flex items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent-bright)] font-bold">Business signal map</span>
      </div>
    </div>
  );
}

function SceneDiagnose() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 px-2">
      <div className="flex flex-col items-center gap-3">
        <Node label="New lead" tone="accent" />
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.16em]">no instant response</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-error)]">Response delay — leak</span>
        </div>
        <Node label="Opportunity cools" tone="danger" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <Node label="Interested prospect" tone="accent" />
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.16em]">no follow-up sequence</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-error)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-error)]">Silence — leak</span>
        </div>
        <Node label="Prospect disappears" tone="danger" />
      </div>
    </div>
  );
}

const BLUEPRINT = ["LEAD", "QUALIFY", "RESPOND", "FOLLOW UP", "BOOK", "MEASURE"];

function SceneDesign() {
  return (
    <div className="flex items-start justify-center gap-1.5 py-8 px-2 overflow-x-auto">
      {BLUEPRINT.map((b, i) => (
        <div key={b} className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-center gap-2 w-20">
            <div className="w-full px-2 py-3 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.08] text-center">
              <span className="text-[9px] font-bold text-[var(--color-accent-bright)] uppercase tracking-[0.14em]">{b}</span>
            </div>
            <span className="text-[9px] text-[var(--color-text-muted)]">{String(i + 1).padStart(2, "0")}</span>
          </div>
          {i < BLUEPRINT.length - 1 && <span className="w-4 h-px bg-[var(--color-accent)]/50 mt-1" />}
        </div>
      ))}
    </div>
  );
}

const CHANNELS = ["WhatsApp", "Email", "Calendar", "CRM", "AI", "Database"];
const BUILD_STATUS = ["CONFIGURING", "CONNECTED", "TESTING"];

function SceneBuild() {
  return (
    <div className="py-6 px-2">
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {CHANNELS.map((c, i) => (
          <div key={c} className="flex flex-col items-center gap-1.5">
            <Node label={c} tone={i === 2 ? "idle" : "accent"} />
            <span className={cn("text-[8px] font-bold tracking-[0.14em]", i === 2 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]")}>{i === 2 ? "CONFIGURING" : "CONNECTED"}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {BUILD_STATUS.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("w-1 h-1 rounded-full", i < 2 ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]/40")} />
            {s}
            {i < BUILD_STATUS.length - 1 && <span className="ml-1.5 text-[var(--color-border)]">→</span>}
          </span>
        ))}
      </div>
      <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-5">Illustrative deployment states — nothing is marked live until real provider connections pass.</p>
    </div>
  );
}

function SceneOperate() {
  const events = ["Lead received", "AI responded", "Follow-up scheduled", "Booking created", "Activity recorded", "Outcome measured"];
  return (
    <div className="py-7 px-2">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-success)] font-bold">Running continuously</span>
      </div>
      <div className="flex flex-col items-center gap-1.5 max-w-xs mx-auto">
        {events.map((e, i) => (
          <div key={e} className="flex items-center gap-2.5 w-full">
            <span className="text-[9px] text-[var(--color-text-muted)] w-6 text-right font-mono">{String(i + 1).padStart(2, "0")}</span>
            <span className={cn("flex-1 text-xs px-3 py-1.5 rounded-md border", i % 2 ? "bg-[var(--color-surface)]/70 border-[var(--color-border)]/60 text-[var(--color-text-secondary)]" : "bg-[var(--color-success)]/[0.06] border-[var(--color-success)]/20 text-[var(--color-text-primary)]")}>{e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageScene({ index }: { index: number }) {
  if (index === 0) return <SceneDiscover />;
  if (index === 1) return <SceneDiagnose />;
  if (index === 2) return <SceneDesign />;
  if (index === 3) return <SceneBuild />;
  return <SceneOperate />;
}

/* ------------------------------------------------------------------ */
/* Sticky story (desktop, motion allowed)                              */
/* ------------------------------------------------------------------ */

function StickyStory() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useSafeReduced();
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [index, setIndex] = useState(0);

  // Map 0..1 progress onto 0..(STAGES.length-1) with settled edges.
  const step = useTransform(scrollYProgress, (v) => {
    if (v <= 0) return 0;
    if (v >= 1) return STAGES.length - 1;
    return Math.min(STAGES.length - 1, Math.floor(v * STAGES.length));
  });
  useEffect(() => step.on("change", (v) => setIndex(v)), [step]);

  const stage = STAGES[index];

  return (
    <div ref={trackRef} className="relative" style={{ height: `${STAGES.length * 110}vh` }}>
      <div className="sticky top-0 flex items-center min-h-screen overflow-hidden">
        <div className="w-full grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center py-24 px-4 sm:px-6">
          {/* Left — stage copy + progress */}
          <div>
            <div className="flex items-center gap-3 mb-8 text-xs text-[var(--color-text-muted)]">
              <span className="font-mono text-[var(--color-accent-bright)]">{stage.n}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">/ {STAGES.length} — {stage.title}</span>
              <span className="flex-1 h-px bg-[var(--color-border)]/60" />
            </div>
            <motion.h3 key={stage.n} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3" style={{ letterSpacing: "-0.02em" }}>
              {stage.title}
            </motion.h3>
            <motion.p key={stage.n + "-k"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.08 }} className="text-sm font-medium text-[var(--color-accent-bright)] mb-3">
              {stage.kicker}
            </motion.p>
            <motion.p key={stage.n + "-c"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.16 }} className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-md">
              {stage.copy}
            </motion.p>

            {/* Stage rail */}
            <div className="mt-10 flex flex-col gap-0 max-w-xs" aria-hidden="true">
              {STAGES.map((s, i) => (
                <div key={s.n} className="flex items-center gap-3 h-8">
                  <span className={cn("w-1.5 h-1.5 rounded-full transition-colors duration-300", i <= index ? "bg-[var(--color-accent)]" : "bg-[var(--color-text-muted)]/25")} />
                  <span className={cn("text-[10px] uppercase tracking-[0.16em] font-semibold transition-colors duration-300", i === index ? "text-[var(--color-text-primary)]" : i < index ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-muted)]/50")}>
                    {s.n} {s.title}
                  </span>
                  {i === index && <span className="h-px flex-1 bg-[var(--color-accent)]/40" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right — changing scene */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-[var(--color-accent)]/[0.04] blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)]/80 overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]/50">
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] font-semibold">ELION Automation Architecture</span>
                <span className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                  stage {stage.n} / 05
                </span>
              </div>
              <div key={stage.n} data-stage={index + 1} className="relative min-h-[300px] sm:min-h-[340px] flex items-center justify-center px-4">
                <motion.div key={stage.n + "-scene"} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="w-full">
                  <StageScene index={index} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Static fallback (mobile + reduced motion)                           */
/* ------------------------------------------------------------------ */

function StaticSequence() {
  return (
    <div className="space-y-3">
      {STAGES.map((s, i) => (
        <div key={s.n} className="flex gap-5 p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
          <span className="font-mono text-lg font-bold text-[var(--color-accent)]/40 shrink-0">{s.n}</span>
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">{s.title}</h4>
            <p className="text-xs text-[var(--color-accent-bright)] mb-1.5">{s.kicker}</p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{s.copy}</p>
            <div className="mt-4 border border-[var(--color-border)]/50 rounded-lg bg-[var(--color-surface)]/50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)]/40">
                <span className="text-[9px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">ELION Automation Architecture</span>
                <span className="text-[9px] text-[var(--color-text-muted)]">stage {s.n} / 05</span>
              </div>
              <div data-stage={i + 1}>
                <StageScene index={i} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StageStory() {
  const desktop = useIsDesktop();
  const reduced = useSafeReduced();
  const interactive = desktop && !reduced;
  return <>{interactive ? <StickyStory /> : <StaticSequence />}</>;
}
