"use client";

import { CheckCircle2 } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function FollowupLanding() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs font-semibold mb-6 uppercase tracking-wider">
            Follow-Up Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight mb-4">
            Stop relying on your team<br />to remember who to follow up.
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
            Your sales team is busy. Someone says &quot;I will call them tomorrow.&quot; Tomorrow never comes. We built a system that never forgets.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-8">How it works</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { step: 1, title: "Lead enters your CRM", desc: "From any source, website, ads, referrals" },
              { step: 2, title: "Automated follow-up begins", desc: "WhatsApp, email, or SMS, your choice" },
              { step: 3, title: "If they respond, human takes over", desc: "Full context passed to your sales team" },
              { step: 4, title: "If they don't, system continues", desc: "Multi-step sequences that keep nudging" },
              { step: 5, title: "Still inactive? Reactivation campaign", desc: "Targeted re-engagement for cold leads" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
                <div className="w-9 h-9 rounded bg-[var(--color-warning)]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[var(--color-warning)]">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{s.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-8">Channel options</h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { name: "WhatsApp", desc: "Most used in Nigeria. Instant, personal, high open rates." },
              { name: "Email", desc: "Professional, trackable, great for B2B and longer sequences." },
              { name: "SMS", desc: "Universal reach. Works even when data is off." },
            ].map((ch) => (
              <div key={ch.name} className="p-5 rounded-lg border border-[var(--color-border)] text-center">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{ch.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)]">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">How many leads fall through the cracks?</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Get a free follow-up audit. We will show you how much revenue you are leaving on the table.</p>
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/followup-enroll"
              fields={[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+234 ...", required: false },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
              ]}
              submitLabel="Get Free Follow-Up Audit"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
