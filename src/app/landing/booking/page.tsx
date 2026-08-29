"use client";

import { Calendar, Zap, CheckCircle2 } from "lucide-react";
import { LandingForm } from "@/components/landing-form";

export default function BookingLanding() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-white">ELION</span>
          </div>
          <a href="#cta" className="hidden md:inline-flex px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">Get Started</a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-400/10 border border-rose-400/20 text-rose-600 text-xs font-medium mb-6">
            <Calendar className="w-3.5 h-3.5" />Booking Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            Turn enquiries into<br /><span className="text-zinc-900">booked appointments.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-8">
            Message, wait, ask availability, reply, confirm, reschedule, remind. We automate the entire back-and-forth.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 pt-8 border-t border-zinc-200">
            {[{v:"Auto",l:"Booking flow"},{v:"Reduced",l:"No-show rate"},{v:"Confirmed",l:"Auto-reminders"},{v:"Auto",l:"Reminders"}].map(s=><div key={s.l} className="text-center"><p className="text-2xl font-bold text-white">{s.v}</p><p className="text-xs text-zinc-500 mt-1">{s.l}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">The booking flow, automated</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {[
              { step: 1, title: "Enquiry arrives", desc: "Via website, WhatsApp, or phone" },
              { step: 2, title: "AI qualifies", desc: "Screens for fit and interest" },
              { step: 3, title: "Availability checked", desc: "Real-time calendar integration" },
              { step: 4, title: "Booking confirmed", desc: "Instant confirmation via email and WhatsApp" },
              { step: 5, title: "Reminders sent", desc: "24hr and 1hr before the appointment" },
              { step: 6, title: "Follow-up after", desc: "Post-appointment feedback and next steps" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-rose-600">{s.step}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Perfect for</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "Clinics and healthcare providers",
              "Consultants and coaches",
              "Training companies",
              "Recruitment agencies",
              "Real estate agents",
              "Salons and beauty businesses",
            ].map((ind) => (
              <div key={ind} className="flex items-center gap-2 p-3 rounded-lg border border-zinc-200 bg-white">
                <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-sm text-zinc-700">{ind}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="py-20 px-6 border-t border-zinc-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">How many appointments are you losing to no-shows?</h2>
          <p className="text-zinc-500 mb-8">Get a free booking audit. We will show you where the gaps are.</p>
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-8 max-w-md mx-auto">
            <LandingForm
              webhookPath="/webhook/booking"
              fields={[
                { name: "client_name", label: "Full Name", type: "text", placeholder: "Your name", required: true },
                { name: "email", label: "Email", type: "email", placeholder: "you@company.com", required: true, pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", patternError: "Please enter a valid email" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+234 ...", required: false },
                { name: "company", label: "Company", type: "text", placeholder: "Your company name", required: false },
              ]}
              submitLabel="Get Free Booking Audit"
            />
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-200 bg-zinc-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900">ELION</span>
          <p className="text-xs text-zinc-500">&copy; 2026 ELION. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
