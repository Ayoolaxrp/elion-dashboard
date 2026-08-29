"use client";

import { Zap, CheckCircle2 } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function FollowupLanding() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />Follow-Up Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            Stop relying on your team<br /><span className="text-indigo-400">to remember who to follow up.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Your sales team is busy. Someone says &quot;I will call them tomorrow.&quot; Tomorrow never comes. We built a system that never forgets.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { step: 1, title: "Lead enters your CRM", desc: "From any source, website, ads, referrals" },
              { step: 2, title: "Automated follow-up begins", desc: "WhatsApp, email, or SMS, your choice" },
              { step: 3, title: "If they respond, human takes over", desc: "Full context passed to your sales team" },
              { step: 4, title: "If they don't, system continues", desc: "Multi-step sequences that keep nudging" },
              { step: 5, title: "Still inactive? Reactivation campaign", desc: "Targeted re-engagement for cold leads" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-indigo-400">{s.step}</span>
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
          <h2 className="text-3xl font-bold text-white text-center mb-12">Channel options</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { name: "WhatsApp", desc: "Most used in Nigeria. Instant, personal, high open rates." },
              { name: "Email", desc: "Professional, trackable, great for B2B and longer sequences." },
              { name: "SMS", desc: "Universal reach. Works even when data is off." },
            ].map((ch) => (
              <div key={ch.name} className="p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 text-center">
                <h3 className="text-sm font-semibold text-white mb-2">{ch.name}</h3>
                <p className="text-xs text-zinc-400">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">How many leads fall through the cracks?</h2>
          <p className="text-zinc-400 mb-8">Get a free follow-up audit. We will show you how much revenue you are leaving on the table.</p>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/followup-enroll"
              fields={[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", patternError: "Please enter a valid email" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+234 ...", required: false },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
              ]}
              submitLabel="Get Free Follow-Up Audit"
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
