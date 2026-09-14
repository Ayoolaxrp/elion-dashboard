"use client";
import { Shield, Zap, Users, Globe, CheckCircle, ArrowRight, Target, Wrench, BarChart3 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const reveal = { opacity: 0, y: 24 };
const show = { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 30, stiffness: 260, mass: 0.8 } };

const values = [
  { icon: <Zap className="w-6 h-6" />, title: "Results First", desc: "We don't sell automation projects. We sell business outcomes. Every system we build is tied to a measurable business result." },
  { icon: <Shield className="w-6 h-6" />, title: "Transparency", desc: "No hidden fees, no jargon, no smoke and mirrors. We tell you exactly what we'll build, what it costs, and what results to expect." },
  { icon: <Users className="w-6 h-6" />, title: "Done-For-You", desc: "You don't need to learn new tools. We handle everything from strategy to implementation to ongoing optimization." },
  { icon: <Target className="w-6 h-6" />, title: "Industry Focus", desc: "We design automation for businesses across real estate, healthcare, education, e-commerce, and professional services." },
];

const process_steps = [
  { step: "01", title: "Free audit", desc: "We inspect your current customer and operational workflow to find where you are losing time, leads, or money." },
  { step: "02", title: "See your leaks", desc: "We identify where you are losing leads, time, and money with specific evidence." },
  { step: "03", title: "We build your system", desc: "ELION designs, builds, and connects the automation around your existing tools. You get dashboard access to monitor it." },
  { step: "04", title: "Go live, you own it", desc: "Your system goes live. You own it. Optional ongoing support and optimization is available if you want it." },
];

const confirmedIntegrations = [
  "WhatsApp Business API",
  "Email (SMTP)",
  "Google Calendar",
  "Custom APIs",
];

const supportedPlatforms = [
  "n8n",
  "HubSpot",
  "Pipedrive",
  "Slack",
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      {/* Hero */}
      <motion.div initial={reveal} animate={show} className="text-center mb-20 pt-8">
        <p className="public-eyebrow mb-4">About ELION</p>
        <h1 className="display-type mx-auto mb-6 max-w-4xl text-[var(--color-text-primary)]">
          We Fix Operational Leaks<br className="hidden md:block" /> That Cost Businesses Money
        </h1>
        <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
          ELION is a business automation company. We identify where your business loses leads, time, and revenue, then build systems to fix those gaps.
        </p>
      </motion.div>

      {/* What We Do */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
        <div>
          <h2 className="section-title mb-4 text-[var(--color-text-primary)]">What ELION Does</h2>
          <p className="text-[var(--color-text-muted)] mb-4 leading-relaxed">
            Too many businesses lose leads because nobody responds fast enough. They lose revenue because follow-ups never happen. They waste hours on tasks that should be automated.
          </p>
          <p className="text-[var(--color-text-muted)] mb-4 leading-relaxed">
            ELION builds automation systems that fix these problems. We don&apos;t sell software subscriptions. We build, deploy, and hand over systems that your business owns.
          </p>
          <p className="text-[var(--color-text-muted)] leading-relaxed">
            Every engagement starts with a free audit. We look at your digital presence, identify operational gaps, and recommend the specific automation that will have the biggest impact on your business.
          </p>
        </div>
        <div className="border-y border-[var(--color-border)] py-8">
          <h3 className="public-eyebrow mb-4 text-[var(--color-text-primary)]">Our Approach</h3>
          <div className="space-y-4">
            {[
              { label: "Free audit first", desc: "No commitment required. We analyse your business and show you the gaps." },
              { label: "Evidence-based recommendations", desc: "Every finding is backed by observable data from your website and digital presence." },
              { label: "Fixed-scope implementation", desc: "Clear deliverables, clear timeline, clear cost. No surprises." },
              { label: "You own everything", desc: "No platform lock-in. The automations we build belong to your business." },
            ].map((item) => (
              <div key={item.label} className="grid grid-cols-[1.25rem_1fr] gap-3 border-t border-[var(--color-border)] py-4 first:border-t-0">
                <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--color-success)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-24">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-8 text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="border-t border-[var(--color-border)] py-7 first:border-t-0">
              <div className="mb-4 flex h-7 w-7 items-center justify-center border-l border-[var(--color-border-light)] text-[var(--color-text-secondary)]">
                {v.icon}
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{v.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-24">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-8 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {process_steps.map((s) => (
            <div key={s.step} className="border-t border-[var(--color-border)] py-6 first:border-t-0">
              <div className="mb-4 flex h-7 w-7 items-center justify-center border-l border-[var(--color-border-light)] text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]">
                {s.step}
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{s.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      
      {/* What This Looks Like In Practice */}
      <div className="mb-24">
        <div className="text-center mb-10">
        <p className="public-eyebrow mb-2">Illustrative example</p>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">What This Looks Like in Practice</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">A representative scenario, not a real client.</p>
        </div>
        <div className="border-y border-[var(--color-border)] py-8 md:py-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Lagos Real Estate Business, Illustrative Scenario</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-error)] mb-4 flex items-center gap-2"><div className="w-5 h-5 rounded bg-[var(--color-error)]/10 flex items-center justify-center"><span className="text-[10px] font-semibold">!</span></div>Before ELION</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">-</span>Leads arrive through WhatsApp and website forms. Responses depend on staff availability.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">-</span>Follow-ups are inconsistent. Some prospects never receive a second message.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">-</span>Booking requires manual back-and-forth: &quot;Are you available Thursday?&quot; &quot;How about Friday?&quot;</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">-</span>No visibility into which leads are active, which are stale, or how many were lost.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-success)] mb-4 flex items-center gap-2"><div className="w-5 h-5 rounded bg-[var(--color-success)]/10 flex items-center justify-center"><span className="text-[10px] font-semibold">✓</span></div>After ELION</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">-</span>New leads trigger an immediate automated response across WhatsApp and email.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">-</span>Follow-ups happen on a defined schedule. No lead falls through the cracks.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">-</span>Prospects self-book through an automated scheduling link. Zero back-and-forth.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">-</span>Every lead, follow-up, and booking is tracked in a single dashboard the client owns.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* Integrations */}
      <div className="mb-24">
        <h2 className="section-title mb-4 text-center text-[var(--color-text-primary)]">Integrations</h2>
        <p className="text-sm text-[var(--color-text-muted)] text-center mb-8 max-w-xl mx-auto">
          ELION can integrate with your existing tools. Here is what we currently support.
        </p>
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-center mb-3">Confirmed Integrations</p>
          <div className="flex flex-wrap justify-center gap-3">
            {confirmedIntegrations.map((t) => (
              <span key={t} className="px-4 py-2 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-lg text-sm text-[var(--color-accent)] font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-center mb-3">Supported Platforms</p>
          <div className="flex flex-wrap justify-center gap-3">
            {supportedPlatforms.map((t) => (
              <span key={t} className="px-4 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
        <div className="border-t border-[var(--color-border)] py-8 text-center">
        <h2 className="section-title mb-3 text-[var(--color-text-primary)]">Ready to find your leaks?</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-md mx-auto">
          Run AI Assessment. See exactly where your business is losing leads, time, and money.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/demo"
            className="public-secondary inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            See ELION In Action
          </Link>
          <Link
            href="/pricing"
            className="public-secondary inline-flex items-center justify-center gap-2 px-6 py-3"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
