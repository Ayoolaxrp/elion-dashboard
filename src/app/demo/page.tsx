"use client";

import { useState, useCallback } from "react";
import { Mail, MessageSquare, Calendar, Play, Loader2, CheckCircle, Clock, ArrowRight } from "lucide-react";

interface EmailMsg { id: string; to: string; from: string; subject: string; body: string; status: string; timestamp: string; }
interface WhatsAppMsg { id: string; to: string; from: string; message: string; status: string; timestamp: string; }
interface DemoLead { id: string; name: string; email: string; phone: string; source: string; status: string; score: number; timestamp: string; }
interface DemoBooking { id: string; client: string; date: string; time: string; type: string; status: string; timestamp: string; }

export default function DemoPage() {
  const [emails, setEmails] = useState<EmailMsg[]>([]);
  const [whatsapps, setWhatsapps] = useState<WhatsAppMsg[]>([]);
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [bookings, setBookings] = useState<DemoBooking[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [demoSteps, setDemoSteps] = useState<Array<{ step: number; action: string; detail: string; status: string }>>([]);
  const [demoComplete, setDemoComplete] = useState(false);

  const runFullDemo = useCallback(async () => {
    setIsRunning(true);
    setDemoComplete(false);
    setDemoSteps([]);

    const steps = [
      { step: 1, action: "Lead Captured", detail: "New lead from Meta Ads landing page", status: "running" },
      { step: 2, action: "Lead Scoring", detail: "Analyzing lead quality and intent signals", status: "pending" },
      { step: 3, action: "Email Sent", detail: "Instant welcome email", status: "pending" },
      { step: 4, action: "WhatsApp Sent", detail: "Personalized greeting", status: "pending" },
      { step: 5, action: "CRM Updated", detail: "Lead record created", status: "pending" },
      { step: 6, action: "Booking Created", detail: "Consultation scheduled", status: "pending" },
      { step: 7, action: "Team Notified", detail: "Sales team alerted", status: "pending" },
    ];

    for (let i = 0; i < steps.length; i++) {
      setDemoSteps([...steps.slice(0, i), { ...steps[i], status: "running" }]);
      await new Promise((r) => setTimeout(r, 700));
      setDemoSteps([...steps.slice(0, i + 1), ...(i + 1 < steps.length ? [{ ...steps[i + 1], status: "pending" }] : [])]);
    }
    setDemoSteps(steps.map((s) => ({ ...s, status: "completed" })));
    setDemoComplete(true);

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_full_demo", data: { name: "Chioma Okafor", email: "chioma@premierrealty.com" } }),
      });
      const data = await res.json();
      if (data.email) setEmails((prev) => [data.email, ...prev]);
      if (data.whatsapp) setWhatsapps((prev) => [data.whatsapp, ...prev]);
      if (data.lead) setLeads((prev) => [data.lead, ...prev]);
      if (data.booking) setBookings((prev) => [data.booking, ...prev]);
    } catch {
      // Demo API may not be available
    }

    setIsRunning(false);
  }, []);

  const runTestEmail = useCallback(async () => {
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_email", data: { to: "test@example.com", name: "Test User", template: "welcome_email" } }),
      });
      const data = await res.json();
      if (data.email) setEmails((prev) => [data.email, ...prev]);
    } catch {
      // Demo API may not be available
    }
  }, []);

  const runTestWhatsApp = useCallback(async () => {
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_whatsapp", data: { to: "+2348012345678", name: "Test User", template: "welcome" } }),
      });
      const data = await res.json();
      if (data.whatsapp) setWhatsapps((prev) => [data.whatsapp, ...prev]);
    } catch {
      // Demo API may not be available
    }
  }, []);

  const stepColor = (status: string) => {
    if (status === "completed") return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (status === "running") return "bg-amber-50 border-amber-200 text-amber-700";
    return "bg-zinc-50 border-zinc-200 text-zinc-500";
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Demo Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <p className="text-sm font-semibold text-amber-800">Interactive Demo</p>
        </div>
        <p className="text-xs text-amber-700 mt-1">
          This is a simulated demonstration using sample data. No real messages are sent. No real leads are processed.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Automation Demo</h1>
          <p className="text-sm text-zinc-500 mt-0.5">See how the automation works with sample data</p>
        </div>
        <button
          onClick={runFullDemo}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? "Running..." : "Run Full Demo"}
        </button>
      </div>

      {/* Pipeline */}
      {demoSteps.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Automation Pipeline</h3>
            {demoComplete && <span className="text-xs text-emerald-600 font-medium">Complete</span>}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {demoSteps.map((step, i) => (
              <div key={i} className={`p-3 rounded border text-center transition-all ${stepColor(step.status)}`}>
                <div className="flex items-center justify-center mb-2">
                  {step.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : step.status === "running" ? (
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <p className="text-xs font-semibold">{step.action}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={runTestEmail}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <Mail className="w-4 h-4" />Test Email
        </button>
        <button
          onClick={runTestWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />Test WhatsApp
        </button>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Inbox */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Email Inbox</h3>
            <span className="text-xs text-zinc-400">{emails.length} messages</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No emails yet. Run the demo to see sample emails.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {emails.map((email) => (
                  <div key={email.id} className="px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-900">{email.subject}</span>
                      <span className="text-[10px] text-zinc-400">{email.timestamp}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-1">To: {email.to}</p>
                    <p className="text-xs text-zinc-400 line-clamp-2">{email.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Chat */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">WhatsApp Messages</h3>
            <span className="text-xs text-zinc-400">{whatsapps.length} messages</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {whatsapps.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No WhatsApp messages yet. Run the demo to see sample messages.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {whatsapps.map((wa) => (
                  <div key={wa.id} className="px-5 py-3 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-500">ELIAN Business</span>
                      <span className="text-[10px] text-zinc-400">{wa.timestamp}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 max-w-[85%]">
                      <p className="text-sm text-zinc-800">{wa.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-emerald-600">{wa.status}</span>
                        {wa.status === "read" && <span className="text-[10px] text-emerald-600">✓✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Captured Leads */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Captured Leads</h3>
            <span className="text-xs text-zinc-400">{leads.length} leads</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {leads.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No leads yet. Run the demo to see sample lead capture.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {leads.map((lead) => (
                  <div key={lead.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{lead.name}</p>
                      <p className="text-xs text-zinc-500">{lead.email} &bull; {lead.source}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${lead.score >= 80 ? "text-emerald-600" : lead.score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {lead.score}
                      </span>
                      <p className="text-[10px] text-zinc-400">score</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bookings */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Bookings</h3>
            <span className="text-xs text-zinc-400">{bookings.length} bookings</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No bookings yet. Run the demo to see sample booking creation.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {bookings.map((b) => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-violet-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{b.client}</p>
                        <p className="text-xs text-zinc-500">{b.date} at {b.time} &bull; {b.type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{b.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 bg-zinc-900 rounded-lg p-6 text-center">
        <h3 className="text-base font-semibold text-white mb-2">Ready to see this in your business?</h3>
        <p className="text-sm text-zinc-400 mb-4">Run a free leak audit to identify where your business is losing leads and money.</p>
        <a
          href="/audit"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 text-sm font-semibold rounded hover:bg-zinc-100 transition-colors"
        >
          Run Free Audit <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
