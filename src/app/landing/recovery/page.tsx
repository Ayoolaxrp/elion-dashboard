"use client";

import { Zap, CheckCircle2, Database } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function RecoveryLanding() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-white">ELIAN</span>
          </div>
          <a href="#cta" className="hidden md:inline-flex px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors">Get Started</a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <Database className="w-3.5 h-3.5" />Revenue Recovery System
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            You may already have<br /><span className="text-indigo-400">revenue sitting in your database.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Before you spend more money on leads, let us show you what you can recover from the ones you already have.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">The money you are sitting on</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { v: "67%", l: "Of leads are never followed up" },
              { v: "44%", l: "Of salespeople give up after one attempt" },
              { v: "80%", l: "Of deals need 5+ follow-ups" },
            ].map((s) => (
              <div key={s.l} className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 text-center">
                <p className="text-3xl font-bold text-emerald-400">{s.v}</p>
                <p className="text-sm text-zinc-400 mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What we do</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { step: 1, title: "Segment your database", desc: "Old leads, past customers, dormant enquiries, unclosed prospects" },
              { step: 2, title: "Personalize outreach", desc: "Tailored messages for each segment" },
              { step: 3, title: "Multi-channel campaigns", desc: "WhatsApp, email, and SMS" },
              { step: 4, title: "Response detection", desc: "AI detects who is ready to buy" },
              { step: 5, title: "Sales handoff", desc: "Qualified leads go straight to your team" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-emerald-400">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Industries that benefit most</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "Agencies and consultancies",
              "Clinics and healthcare",
              "Real estate companies",
              "Education and training",
              "Professional services",
              "E-commerce",
            ].map((ind) => (
              <div key={ind} className="flex items-center gap-2 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-zinc-300">{ind}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">How much revenue is sitting in your database?</h2>
          <p className="text-zinc-400 mb-8">Get a free revenue recovery assessment. We will estimate what you can recover.</p>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/recovery-campaign"
              fields={[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", patternError: "Please enter a valid email" },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
                { name: "database_size", label: "Approximate database size", type: "text", placeholder: "e.g. 500 contacts", required: false },
              ]}
              submitLabel="Get Free Assessment"
            />
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-white">ELIAN</span>
          <p className="text-xs text-zinc-500">&copy; 2026 ELIAN. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
