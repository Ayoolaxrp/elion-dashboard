"use client";

import { Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function LeadsLanding() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />Lead Response System
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            Every lead gets a response.<br /><span className="text-indigo-400">In under 60 seconds.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            Someone just enquired about your service. What happens in the next 5 minutes decides whether they become a customer or disappear forever.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-8 border-t border-zinc-800/50">
            {[{v:"&lt;60s",l:"Response time"},{v:"3x",l:"More conversations"},{v:"45%",l:"Higher conversion"},{v:"24/7",l:"Always on"}].map(s=><div key={s.l} className="text-center"><p className="text-2xl font-bold text-white" dangerouslySetInnerHTML={{__html:s.v}} /><p className="text-xs text-zinc-500 mt-1">{s.l}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">The problem</h2>
          <div className="max-w-2xl mx-auto space-y-6 mb-16">
            {[
              "A lead comes in from Meta ads, Instagram, your website, or WhatsApp",
              "Nobody responds. Or someone responds 3 hours later",
              "The lead gets dumped into a spreadsheet nobody checks",
              "The business thinks it needs more leads, but the real problem is lead leakage",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-red-400">{i + 1}</span>
                </div>
                <p className="text-sm text-zinc-300">{p}</p>
              </div>
            ))}
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-4">Our solution</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              "Lead comes in → instant response via WhatsApp or email",
              "AI qualifies the lead and collects key information",
              "Lead is scored and added to your CRM",
              "Salesperson is notified with full context",
              "Automated follow-up begins if no response",
              "Appointment is booked and confirmed automatically",
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-sm text-zinc-300">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What is included</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "Instant WhatsApp response",
              "Instant email response",
              "AI lead qualification",
              "Lead scoring",
              "CRM creation/update",
              "Salesperson notification",
              "Automated follow-up sequences",
              "Appointment booking",
              "Lead status tracking",
              "Escalation alerts",
              "Multi-channel support",
              "Analytics dashboard",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/40">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm text-zinc-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to stop losing leads?</h2>
          <p className="text-zinc-400 mb-8">Get your free lead response audit. We will show you exactly how many leads you are losing and what it costs you.</p>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/lead-response"
              fields={[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", patternError: "Please enter a valid email" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+234 ...", required: false },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
              ]}
              submitLabel="Get Free Lead Audit"
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
