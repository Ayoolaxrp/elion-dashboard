"use client";

import { useState, useCallback } from "react";
import { Mail, MessageSquare, Calendar, Users, Play, Loader2, CheckCircle, Clock, ArrowRight, Zap, Eye } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"inbox" | "whatsapp" | "all">("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailMsg | null>(null);
  const [selectedWA, setSelectedWA] = useState<WhatsAppMsg | null>(null);
  const [demoComplete, setDemoComplete] = useState(false);

  const runFullDemo = useCallback(async () => {
    setIsRunning(true);
    setDemoComplete(false);
    setDemoSteps([]);

    const steps = [
      { step: 1, action: "Lead Captured", detail: "New lead from Meta Ads landing page", status: "running" },
      { step: 2, action: "AI Scoring", detail: "Analyzing lead quality and intent signals", status: "pending" },
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
      if (data.lead) setLeads((prev) => [data.lead, ...prev]);
      if (data.email) setEmails((prev) => [data.email, ...prev]);
      if (data.whatsapp) setWhatsapps((prev) => [data.whatsapp, ...prev]);
      if (data.booking) setBookings((prev) => [data.booking, ...prev]);
    } catch {
      const now = new Date().toISOString();
      const mockLead: DemoLead = { id: `l-${Date.now()}`, name: "Chioma Okafor", email: "chioma@premierrealty.com", phone: "+234 802 345 6789", source: "Meta Ads", status: "qualified", score: 92, timestamp: now };
      const mockEmail: EmailMsg = { id: `e-${Date.now()}`, to: mockLead.email, from: "hello@elian.ng", subject: "Welcome to ELIAN, Chioma", body: "Hi Chioma,\n\nThank you for reaching out to ELIAN. We help businesses automate their lead response, follow-ups, and operations.\n\nHere is what happens next:\n1. Our team will review your requirements within 24 hours\n2. We will schedule a brief call to understand your needs\n3. You will receive a custom automation roadmap\n\nBest regards,\nThe ELIAN Team", status: "delivered", timestamp: now };
      const mockWA: WhatsAppMsg = { id: `w-${Date.now()}`, to: mockLead.phone, from: "ELIAN Business", message: "Hi Chioma, thanks for reaching out to ELIAN. We help businesses automate their lead response, follow-ups, and operations. How can we help you today?", status: "read", timestamp: now };
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const mockBk: DemoBooking = { id: `b-${Date.now()}`, client: mockLead.name, date: tomorrow.toISOString().split("T")[0], time: "10:00", type: "video", status: "confirmed", timestamp: now };
      setLeads((prev) => [mockLead, ...prev]);
      setEmails((prev) => [mockEmail, ...prev]);
      setWhatsapps((prev) => [mockWA, ...prev]);
      setBookings((prev) => [mockBk, ...prev]);
    }

    setIsRunning(false);
  }, []);

  const fmt = (ts: string) => new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold">ELIAN Automation Demo</h1>
            <p className="text-[11px] text-zinc-500">See exactly what your business automation looks like in action</p>
          </div>
          <button
            onClick={runFullDemo}
            disabled={isRunning}
            className="px-5 py-2.5 bg-primary text-white rounded text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? "Running..." : "Run Full Demo"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pipeline */}
        {demoSteps.length > 0 && (
          <div className="mb-8 p-6 rounded border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Automation Pipeline</h3>
              {demoComplete && <span className="text-xs text-emerald-400 font-medium">Complete</span>}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {demoSteps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className={`w-10 h-10 rounded mx-auto mb-2 flex items-center justify-center transition-all duration-300 ${
                    step.status === "completed" ? "bg-emerald-500/10 border border-emerald-500/30" :
                    step.status === "running" ? "bg-amber-500/10 border border-amber-500/30 animate-pulse" :
                    "bg-zinc-800/50 border border-zinc-700"
                  }`}>
                    {step.status === "completed" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                     step.status === "running" ? <Loader2 className="w-5 h-5 text-amber-400 animate-spin" /> :
                     <Clock className="w-5 h-5 text-zinc-600" />}
                  </div>
                  <p className="text-[10px] font-semibold text-zinc-300 leading-tight">{step.action}</p>
                  <p className="text-[9px] text-zinc-600 leading-tight mt-0.5">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Emails Sent", value: emails.length, icon: <Mail className="w-4 h-4" />, color: "text-primary" },
            { label: "WhatsApp Sent", value: whatsapps.length, icon: <MessageSquare className="w-4 h-4" />, color: "text-emerald-400" },
            { label: "Leads Captured", value: leads.length, icon: <Users className="w-4 h-4" />, color: "text-amber-400" },
            { label: "Bookings", value: bookings.length, icon: <Calendar className="w-4 h-4" />, color: "text-rose-400" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2 mb-2">
                <span className={s.color}>{s.icon}</span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-zinc-900/50 rounded mb-6 w-fit">
          {[
            { id: "all", label: "All Activity" },
            { id: "inbox", label: "Email Inbox" },
            { id: "whatsapp", label: "WhatsApp" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${activeTab === tab.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emails */}
          {(activeTab === "all" || activeTab === "inbox") && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Email Inbox
              </h3>
              {emails.length === 0 ? (
                <div className="p-8 rounded border border-dashed border-zinc-800 text-center">
                  <Mail className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No emails yet. Click "Run Full Demo" to see automation in action.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((email) => (
                    <div key={email.id} onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)} className={`p-4 rounded border transition-all cursor-pointer ${selectedEmail?.id === email.id ? "border-primary/40 bg-primary/5" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{email.from}</span>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${email.status === "delivered" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                          <span className="text-[10px] text-zinc-500">{fmt(email.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mb-0.5">To: {email.to}</p>
                      <p className="text-sm font-medium text-zinc-300">{email.subject}</p>
                      {selectedEmail?.id === email.id && (
                        <div className="mt-3 pt-3 border-t border-zinc-800">
                          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WhatsApp */}
          {(activeTab === "all" || activeTab === "whatsapp") && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Business
              </h3>
              {whatsapps.length === 0 ? (
                <div className="p-8 rounded border border-dashed border-zinc-800 text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No messages yet. Click "Run Full Demo" or "Test WhatsApp".</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {whatsapps.map((wa) => (
                    <div key={wa.id} onClick={() => setSelectedWA(selectedWA?.id === wa.id ? null : wa)} className={`p-4 rounded border transition-all cursor-pointer ${selectedWA?.id === wa.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">ELIAN Business</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${wa.status === "read" ? "text-emerald-400" : wa.status === "delivered" ? "text-zinc-400" : "text-amber-400"}`}>
                            {wa.status === "read" ? "Read" : wa.status === "delivered" ? "Delivered" : "Sent"}
                          </span>
                          <span className="text-[10px] text-zinc-500">{fmt(wa.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mb-1">To: {wa.to}</p>
                      <div className="bg-emerald-900/20 border border-emerald-800/20 rounded rounded-tl-sm p-3 ml-4">
                        <p className="text-sm text-zinc-200 leading-relaxed">{wa.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leads */}
          {activeTab === "all" && leads.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Captured Leads
              </h3>
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div key={lead.id} className="p-4 rounded border border-zinc-800 bg-zinc-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-400">{lead.name.split(" ").map((n) => n[0]).join("")}</div>
                        <div>
                          <p className="text-sm font-semibold">{lead.name}</p>
                          <p className="text-[11px] text-zinc-500">{lead.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-emerald-400">{lead.score}</span>
                        <p className="text-[9px] text-zinc-600 uppercase">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookings */}
          {activeTab === "all" && bookings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" /> Created Bookings
              </h3>
              <div className="space-y-2">
                {bookings.map((bk) => (
                  <div key={bk.id} className="p-4 rounded border border-zinc-800 bg-zinc-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-rose-500/10 flex items-center justify-center"><Calendar className="w-4 h-4 text-rose-400" /></div>
                        <div>
                          <p className="text-sm font-semibold">{bk.client}</p>
                          <p className="text-[11px] text-zinc-500">{bk.type} &bull; {bk.date} at {bk.time}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">{bk.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 rounded border border-zinc-800 bg-zinc-900/50 text-center">
          <h3 className="text-xl font-bold mb-2">This is what we build for your business</h3>
          <p className="text-zinc-400 mb-4 max-w-lg mx-auto">Every lead gets an instant email and WhatsApp response, gets qualified by AI, and gets a booking scheduled, all in under 5 seconds.</p>
          <div className="flex gap-3 justify-center">
            <a href="/landing/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded font-semibold hover:bg-primary/90 transition-colors">
              See Pricing <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/landing/audit" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded font-semibold hover:bg-zinc-700 transition-colors border border-zinc-700">
              Get Free Audit
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
