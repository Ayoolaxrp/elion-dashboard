"use client";
import { Shield, Zap, Users, Globe, CheckCircle, ArrowRight, Target, Wrench, BarChart3 } from "lucide-react";
import Link from "next/link";

const values = [
  { icon: <Zap className="w-6 h-6" />, title: "Results First", desc: "We don't sell automation projects. We sell business outcomes. Every system we build is tied to a measurable business result." },
  { icon: <Shield className="w-6 h-6" />, title: "Transparency", desc: "No hidden fees, no jargon, no smoke and mirrors. We tell you exactly what we'll build, what it costs, and what results to expect." },
  { icon: <Users className="w-6 h-6" />, title: "Done-For-You", desc: "You don't need to learn new tools. We handle everything from strategy to implementation to ongoing optimization." },
  { icon: <Target className="w-6 h-6" />, title: "Industry Focus", desc: "We've built systems for real estate, healthcare, education, recruitment, e-commerce, and professional services." },
];

const process_steps = [
  { step: "01", title: "Free audit", desc: "We inspect your current customer and operational workflow to find where you are losing time, leads, or money." },
  { step: "02", title: "See your leaks", desc: "We identify where you are losing leads, time, and money with specific evidence." },
  { step: "03", title: "We build your system", desc: "ELION designs, builds, and connects the automation around your existing tools. You get dashboard access to monitor it." },
  { step: "04", title: "Go live — you own it", desc: "Your system goes live. You own it. Optional ongoing support and optimization is available if you want it." },
];

const tech = [
  "n8n", "Make.com", "Zapier", "WhatsApp Business API", "HubSpot", "Pipedrive",
  "Google Calendar", "Slack", "Custom APIs", "AI / LLM Integration",
];

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      {/* Hero */}
      <div className="text-center mb-20">
        <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">About ELION</p>
        <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight mb-6 leading-tight">
          We Fix Operational Leaks<br className="hidden md:block" /> That Cost Businesses Money
        </h1>
        <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
          ELION is a business automation agency. We identify where your business loses leads, time, and revenue, then build systems to fix those gaps.
        </p>
      </div>

      {/* What We Do */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">What ELION Does</h2>
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
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-8">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">Our Approach</h3>
          <div className="space-y-4">
            {[
              { label: "Free audit first", desc: "No commitment required. We analyse your business and show you the gaps." },
              { label: "Evidence-based recommendations", desc: "Every finding is backed by observable data from your website and digital presence." },
              { label: "Fixed-scope implementation", desc: "Clear deliverables, clear timeline, clear cost. No surprises." },
              { label: "You own everything", desc: "No platform lock-in. The automations we build belong to your business." },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-[var(--color-success)] mt-0.5 shrink-0" />
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
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8 text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6">
              <div className="w-10 h-10 bg-[var(--color-surface-elevated)] rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
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
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8 text-center">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {process_steps.map((s) => (
            <div key={s.step} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 text-center">
              <div className="w-10 h-10 bg-[var(--color-surface)] text-white rounded-lg flex items-center justify-center text-sm font-bold mx-auto mb-3">
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
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Illustrative Example</p>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">What This Looks Like in Practice</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">A representative scenario — not a real client.</p>
        </div>
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-8 md:p-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]"></div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Lagos Real Estate Business — Illustrative Scenario</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-error)] mb-4 flex items-center gap-2"><div className="w-5 h-5 rounded bg-[var(--color-error)]/10 flex items-center justify-center"><span className="text-[10px] font-bold">!</span></div>Before ELION</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">—</span>Leads arrive through WhatsApp and website forms. Responses depend on staff availability.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">—</span>Follow-ups are inconsistent. Some prospects never receive a second message.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">—</span>Booking requires manual back-and-forth: &quot;Are you available Thursday?&quot; &quot;How about Friday?&quot;</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-error)] mt-1">—</span>No visibility into which leads are active, which are stale, or how many were lost.</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-success)] mb-4 flex items-center gap-2"><div className="w-5 h-5 rounded bg-[var(--color-success)]/10 flex items-center justify-center"><span className="text-[10px] font-bold">✓</span></div>After ELION</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">—</span>New leads trigger an immediate automated response across WhatsApp and email.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">—</span>Follow-ups happen on a defined schedule. No lead falls through the cracks.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">—</span>Prospects self-book through an automated scheduling link. Zero back-and-forth.</li>
                <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"><span className="text-[var(--color-success)] mt-1">—</span>Every lead, follow-up, and booking is tracked in a single dashboard the client owns.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* Technology */}
      <div className="mb-24">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 text-center">Technology We Use</h2>
        <p className="text-sm text-[var(--color-text-muted)] text-center mb-8 max-w-xl mx-auto">
          We work with the tools that make sense for your business. No unnecessary complexity.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {tech.map((t) => (
            <span key={t} className="px-4 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] font-medium">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-surface)] rounded-lg p-8 md:p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to find your leaks?</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-md mx-auto">
          Run a free audit. See exactly where your business is losing leads, time, and money.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/audit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] rounded font-semibold text-sm hover:bg-[var(--color-surface-elevated)] transition-colors"
          >
            Run Free Audit
          </Link>
          <Link
            href="/landing/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] rounded font-semibold text-sm hover:bg-zinc-700 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
