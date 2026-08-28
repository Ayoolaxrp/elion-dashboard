"use client";

import { Zap, CheckCircle2, Settings } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function OperationsLanding() {
  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-white">Elion</span>
          </div>
          <a href="#cta" className="hidden md:inline-flex px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors">Get Started</a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
            <Settings className="w-3.5 h-3.5" />Operations Automation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            Remove repetitive work<br /><span className="text-indigo-400">without replacing your team.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Copying data between systems. Updating spreadsheets. Generating reports. Sending notifications. We automate all of it.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What we automate</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "Copying data between systems",
              "Updating spreadsheets",
              "Generating reports",
              "Sending notifications",
              "Creating documents",
              "Updating CRM records",
              "Assigning tasks",
              "Internal approvals",
              "Customer onboarding",
              "Staff notifications",
              "Repetitive email processing",
              "Invoice and payment tracking",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/40">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="text-sm text-zinc-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How we work</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { step: 1, title: "Audit your daily tasks", desc: "Map every repetitive process your team does" },
              { step: 2, title: "Prioritize by impact", desc: "Find the 3-5 tasks that waste the most time" },
              { step: 3, title: "Build the automations", desc: "Custom workflows tailored to your business" },
              { step: 4, title: "Test and deploy", desc: "Everything runs in the background while your team focuses on real work" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-violet-400">{s.step}</span>
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

      <section id="cta" className="py-20 px-6 border-t border-zinc-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">How much time does your team waste on repetitive tasks?</h2>
          <p className="text-zinc-400 mb-8">Get a free operations audit. We will show you exactly where time is being wasted.</p>
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/ops-workflow"
              fields={[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", patternError: "Please enter a valid email" },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
                { name: "team_size", label: "Team Size", type: "text", placeholder: "e.g. 5-10 people", required: false },
              ]}
              submitLabel="Get Free Ops Audit"
            />
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Elion</span>
          <p className="text-xs text-zinc-500">&copy; 2026 Elion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
