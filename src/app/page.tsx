"use client";

import Link from "next/link";
import { ArrowRight, Zap, Mail, Calendar, RotateCcw, Settings, Shield, CheckCircle, ArrowUpRight } from "lucide-react";

const iconMap: Record<string, any> = { Zap, Mail, Calendar, RotateCcw, Settings };

const FEATURES = [
  { icon: "Zap", title: "Lead Response", desc: "Respond to new leads quickly and consistently." },
  { icon: "Mail", title: "Follow-Up", desc: "Automated sequences that keep prospects engaged." },
  { icon: "Calendar", title: "Booking", desc: "Automated scheduling that syncs with your calendar." },
  { icon: "RotateCcw", title: "Revenue Recovery", desc: "Find dormant customers and re-engage them." },
  { icon: "Settings", title: "Operations", desc: "Automate repetitive internal tasks." },
];

const STEPS = [
  { num: "01", title: "Discover", desc: "We examine your business and find where opportunities are being lost." },
  { num: "02", title: "Diagnose", desc: "Turn gaps into specific, evidence-based automation opportunities." },
  { num: "03", title: "Build", desc: "Configure systems around how your business actually operates." },
  { num: "04", title: "Automate", desc: "Systems handle repetitive workflows continuously." },
  { num: "05", title: "Measure", desc: "See exactly where automation is creating value." },
];

const LEAKS = [
  { title: "Slow Lead Response", desc: "Your prospects are waiting hours for a response. By then, they have already moved on.", severity: "critical" },
  { title: "Forgotten Follow-Up", desc: "Leads that could have converted are quietly forgotten because no one followed up.", severity: "high" },
  { title: "Missed Bookings", desc: "Manual scheduling creates friction, no-shows, and lost appointments.", severity: "high" },
  { title: "Revenue Leakage", desc: "Untracked opportunities and disconnected systems let money slip through the cracks.", severity: "critical" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: "Space Grotesk,sans-serif" }}>E</div>
            <span className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/demo" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">How It Works</Link>
            <Link href="/demo" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">Demo</Link>
            <Link href="/landing/pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">Pricing</Link>
            <Link href="/landing/about" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">Sign In</Link>
            <Link href="/demo" className="px-5 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all">See Demo</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6">
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full bg-[var(--color-accent)]/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full bg-[var(--color-accent-cyan)]/5 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-accent)]">Business Automation Platform</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.05]" style={{ fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.025em" }}>
            Find the leaks
            <br />in your business.
            <br />
            <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">Then automate them.</span>
          </h1>

          <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
            ELION audits your operations, identifies where leads and revenue are being lost, and builds automation systems to fix those leaks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/demo" className="group px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white text-base font-semibold hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-2.5 shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97]">
              See ELION In Action
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/demo" className="px-8 py-4 rounded-xl border border-white/10 text-[var(--color-text-secondary)] text-base font-medium hover:border-white/20 hover:text-white transition-all active:scale-[0.97]">
              See How It Works
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Evidence-based findings</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> No credit card required</div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[var(--color-accent)] tracking-widest uppercase mb-4">The Problem</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>
              Your business is leaking.
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">Most businesses lose opportunities through operational inefficiencies they cannot see, until we show them.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {LEAKS.map((item, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-[var(--color-surface-raised)] border border-white/5 hover:border-[var(--color-accent)]/20 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.severity === "critical" ? "bg-red-400" : "bg-amber-400"}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 bg-[var(--color-surface-raised)]/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[var(--color-accent)] tracking-widest uppercase mb-4">Process</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>
              How ELION Works
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">A simple, evidence-based approach to automation.</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent" />
            <div className="grid md:grid-cols-5 gap-8">
              {STEPS.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center mx-auto mb-5 relative z-10">
                    <span className="text-sm font-bold text-[var(--color-accent)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{step.num}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AUTOMATION SYSTEMS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[var(--color-accent)] tracking-widest uppercase mb-4">Systems</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>
              What We Build
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">Every system is configured around how your business operates.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = iconMap[feat.icon];
              return (
                <div key={i} className="group p-8 rounded-2xl bg-[var(--color-surface-raised)] border border-white/5 hover:border-[var(--color-accent)]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-accent)]/5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-5 group-hover:bg-[var(--color-accent)]/20 transition-colors">
                    {Icon && <Icon className="w-6 h-6 text-[var(--color-accent)]" />}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OWNERSHIP */}
      <section className="py-24 px-6 bg-[var(--color-surface-raised)]/30">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm font-medium text-[var(--color-accent)] tracking-widest uppercase mb-4">Ownership</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>
            You own everything.
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-12 max-w-2xl mx-auto">
            No lock-in. No hidden fees. No dependency. Your automations, your data, your systems, permanently.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              "Own your automations",
              "Own your workflows",
              "Own your data",
              "No lock-in, ever",
              "Fully disclosed costs",
              "Maintain or hand off",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-accent)]/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Space Grotesk,sans-serif", letterSpacing: "-0.02em" }}>
            Ready to find your leaks?
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-10">
            Run a free audit and discover exactly where your business is losing opportunities.
          </p>
          <Link href="/demo" className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-[var(--color-accent)] text-white text-lg font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-xl shadow-[var(--color-accent)]/20 active:scale-[0.97]">
            See ELION In Action
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: "Space Grotesk,sans-serif" }}>E</div>
            <span className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { href: "/demo", label: "Demo" },
              { href: "/landing/pricing", label: "Pricing" },
              { href: "/landing/about", label: "About" },
              { href: "/landing/support", label: "Support" },
              { href: "/landing/privacy", label: "Privacy" },
              { href: "/landing/terms", label: "Terms" },
            ].map(l => (
              <Link key={l.href + l.label} href={l.href} className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">© 2026 ELION. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}