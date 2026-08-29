"use client";

import { CheckCircle2 } from "lucide-react";
import { LandingForm } from "@/components/landing-form";
import Link from "next/link";

export default function LeadsLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 uppercase tracking-wider">
            Lead Response System
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight leading-tight mb-4">
            Every lead gets a response.<br />In under 60 seconds.
          </h1>
          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Someone just enquired about your service. What happens in the next 5 minutes
            decides whether they become a customer or disappear forever.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 pt-6 border-t border-zinc-200">
            {[{ v: "<3s", l: "Response time" }, { v: "Instant", l: "WhatsApp reply" }, { v: "24/7", l: "Always on" }].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-2xl font-bold text-zinc-900">{s.v}</p>
                <p className="text-xs text-zinc-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">The problem</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              "A lead comes in from Meta ads, Instagram, your website, or WhatsApp",
              "Nobody responds. Or someone responds 3 hours later",
              "The lead gets dumped into a spreadsheet nobody checks",
              "The business thinks it needs more leads, but the real problem is lead leakage",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 bg-white border border-zinc-200 rounded-lg p-4">
                <div className="w-6 h-6 rounded bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-red-600">{i + 1}</span>
                </div>
                <p className="text-sm text-zinc-700">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">What ELIAN does</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {[
              "Lead comes in, instant response via WhatsApp or email",
              "AI qualifies the lead and collects key information",
              "Lead is scored and added to your CRM",
              "Salesperson is notified with full context",
              "Automated follow-up begins if no response",
              "Appointment is booked and confirmed automatically",
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-zinc-700">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">What is included</h2>
          <div className="grid md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {[
              "Instant WhatsApp response", "Instant email response", "AI lead qualification",
              "Lead scoring", "CRM creation/update", "Salesperson notification",
              "Automated follow-up sequences", "Appointment booking",
              "Lead status tracking", "Escalation alerts",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 p-3 rounded-lg bg-white border border-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm text-zinc-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Ready to stop losing leads?</h2>
          <p className="text-sm text-zinc-500 mb-8">Get your free lead response audit. We will show you exactly how many leads you are losing.</p>
          <div className="bg-white border border-zinc-200 rounded-lg p-6 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/lead-response"
              fields={[
                { name: "name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+234 ...", required: false },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
              ]}
              submitLabel="Get Free Lead Audit"
            />
          </div>
          <p className="mt-4 text-xs text-zinc-400">No credit card required. Free audit.</p>
        </div>
      </section>
    </div>
  );
}
