"use client";

import Link from "next/link";
import { ArrowRight, Zap, Mail, Calendar, RotateCcw, Settings } from "lucide-react";

const iconMap: Record<string, any> = { Zap, Mail, Calendar, RotateCcw, Settings };

const FEATURES = [
  { icon: "Zap", title: "Lead Response", desc: "Respond to new leads in seconds, not hours." },
  { icon: "Mail", title: "Follow-Up", desc: "Automated sequences that work while you sleep." },
  { icon: "Calendar", title: "Booking", desc: "Automated scheduling that syncs with your calendar." },
  { icon: "RotateCcw", title: "Revenue Recovery", desc: "Find dormant customers and re-engage them." },
  { icon: "Settings", title: "Operations", desc: "Automate repetitive internal tasks." },
];

const STEPS = [
  { num: "01", title: "Discover", desc: "Examine your business and identify lost opportunities." },
  { num: "02", title: "Diagnose", desc: "Turn gaps into actionable automation opportunities." },
  { num: "03", title: "Build", desc: "Configure the systems your business actually needs." },
  { num: "04", title: "Automate", desc: "Systems handle repetitive workflows continuously." },
  { num: "05", title: "Measure", desc: "See where automation creates value." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: "Space Grotesk,sans-serif" }}>E</div>
            <span className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/funnel" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">How It Works</Link>
            <Link href="/demo" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Demo</Link>
            <Link href="/landing/pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Pricing</Link>
            <Link href="/landing/about" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Sign In</Link>
            <Link href="/funnel" className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors">Run Free Audit</Link>
          </div>
        </div>
      </nav>
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-[var(--color-accent)] tracking-widest uppercase mb-6">Business Automation Platform</p>
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Find the leaks in your business.<br /><span className="text-[var(--color-accent)]">Then automate them.</span></h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">ELION audits your business operations, identifies where leads, revenue, and time are being lost, and builds automation systems to fix those leaks.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/funnel" className="px-8 py-3.5 rounded-xl bg-[var(--color-accent)] text-white text-base font-semibold hover:bg-[var(--color-accent-hover)] transition-all flex items-center gap-2">Run Your Free Audit <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/demo" className="px-8 py-3.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-base font-medium hover:border-[var(--color-accent)]/30 hover:text-[var(--color-text-primary)] transition-all">See How It Works</Link>
          </div>
        </div>
      </section>
      <section className="py-20 px-6 bg-[var(--color-surface-raised)]/50"><div className="max-w-6xl mx-auto"><div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Your business may be leaking more than you realize</h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">Most businesses lose opportunities through operational inefficiencies they do not even see.</p>
        </div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ title: "Slow Lead Response", desc: "Prospects hear nothing for hours." }, { title: "Forgotten Follow-Up", desc: "Leads fall through the cracks." }, { title: "Missed Bookings", desc: "Manual scheduling creates friction." }, { title: "Revenue Leakage", desc: "Opportunities go untracked." }].map((item, i) => (<div key={i} className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"><h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{item.title}</h3><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.desc}</p></div>))}
        </div></div></section>
      <section className="py-20 px-6"><div className="max-w-6xl mx-auto"><div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4" style={{ fontFamily: "Space Grotesk,sans-serif" }}>How ELION Works</h2>
          <p className="text-lg text-[var(--color-text-secondary)]">A simple, evidence-based approach to automation.</p>
        </div><div className="grid md:grid-cols-5 gap-6">{STEPS.map((step, i) => (<div key={i} className="text-center"><div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto mb-4"><span className="text-sm font-bold text-[var(--color-accent)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{step.num}</span></div><h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{step.title}</h3><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p></div>))}</div></div></section>
      <section className="py-20 px-6 bg-[var(--color-surface-raised)]/50"><div className="max-w-6xl mx-auto"><div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Automation Systems</h2>
          <p className="text-lg text-[var(--color-text-secondary)]">Every system is built around how your business operates.</p>
        </div><div className="grid md:grid-cols-3 gap-6">{FEATURES.map((feat, i) => { const Icon = iconMap[feat.icon]; return (<div key={i} className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-colors group cursor-pointer"><div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--color-accent)]/20 transition-colors">{Icon && <Icon className="w-5 h-5 text-[var(--color-accent)]" />}</div><h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{feat.title}</h3><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{feat.desc}</p></div>); })}</div></div></section>
      <section className="py-20 px-6"><div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-6" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Ready to find your leaks?</h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-10">Run a free audit and discover exactly where your business is losing opportunities.</p>
          <Link href="/funnel" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--color-accent)] text-white text-base font-semibold hover:bg-[var(--color-accent-hover)] transition-all">Run Your Free Audit <ArrowRight className="w-4 h-4" /></Link>
        </div></section>
      <footer className="py-12 px-6 border-t border-[var(--color-border)]"><div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold" style={{ fontFamily: "Space Grotesk,sans-serif" }}>E</div><span className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span></div>
          <div className="flex flex-wrap items-center justify-center gap-6"><Link href="/funnel" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Audit</Link><Link href="/demo" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Demo</Link><Link href="/landing/pricing" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Pricing</Link><Link href="/landing/about" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">About</Link><Link href="/landing/support" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Support</Link><Link href="/landing/privacy" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Privacy</Link><Link href="/landing/terms" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Terms</Link></div>
          <p className="text-xs text-[var(--color-text-muted)]">2026 ELION. All rights reserved.</p>
        </div></footer>
    </div>
  );
}
