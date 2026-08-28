"use client";

import { useState, useCallback } from "react";
import { Mail, MessageSquare, Calendar, Users, Play, Loader2, CheckCircle, Clock, Send, Phone, ExternalLink, ArrowRight, Zap, Eye, RefreshCw } from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState<"inbox" | "whatsapp" | "all">("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailMsg | null>(null);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<WhatsAppMsg | null>(null);

  const runFullDemo = useCallback(async (name?: string, email?: string) => {
    setIsRunning(true);
    setDemoSteps([]);

    const steps = [
      { step: 1, action: "Lead Captured", detail: "New lead from Meta Ads landing page", status: "running" },
      { step: 2, action: "AI Scoring", detail: "Analyzing lead quality and intent signals", status: "pending" },
      { step: 3, action: "Email Sent", detail: "Instant welcome email with company details", status: "pending" },
      { step: 4, action: "WhatsApp Sent", detail: "Personalized greeting via WhatsApp Business", status: "pending" },
      { step: 5, action: "CRM Updated", detail: "Lead record created with full profile", status: "pending" },
      { step: 6, action: "Booking Created", detail: "Consultation scheduled for tomorrow", status: "pending" },
      { step: 7, action: "Team Notified", detail: "Sales team alerted via Slack", status: "pending" },
    ];

    // Animate steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i + 1);
      setDemoSteps([...steps.slice(0, i), { ...steps[i], status: "running" }]);
      await new Promise((r) => setTimeout(r, 800));
      setDemoSteps([...steps.slice(0, i), { ...steps[i], status: "completed" }]);
    }

    // Actually send through API
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_full_demo", data: { name, email } }),
      });
      const data = await res.json();
      if (data.lead) setLeads((prev) => [data.lead, ...prev]);
      if (data.email) setEmails((prev) => [data.email, ...prev]);
      if (data.whatsapp) setWhatsapps((prev) => [data.whatsapp, ...prev]);
      if (data.booking) setBookings((prev) => [data.booking, ...prev]);
    } catch {
      // API might not be available, show static demo
      const mockLead: DemoLead = { id: `lead-${Date.now()}`, name: name || "Adebayo Johnson", email: email || "adebayo@techcorp.ng", phone: "+234 801 234 5678", source: "Meta Ads", status: "qualified", score: 92, timestamp: new Date().toISOString() };
      const mockEmail: EmailMsg = { id: `email-${Date.now()}`, to: mockLead.email, from: "hello@elion.ng", subject: `Welcome to Elion — Here's what happens next`, body: `Hi ${mockLead.name},\n\nThank you for reaching out! We're excited to help transform your business operations.\n\nHere's what happens next:\n1. Our team will review your requirements within 24 hours\n2. We'll schedule a brief call to understand your needs\n3. You'll receive a custom automation roadmap\n\nBest regards,\nThe Elion Team`, status: "delivered", timestamp: new Date().toISOString() };
      const mockWA: WhatsAppMsg = { id: `wa-${Date.now()}`, to: mockLead.phone, from: "Elion Business", message: `Hi ${mockLead.name}! 👋 Thanks for reaching out to Elion. We help businesses automate their lead response, follow-ups, and operations. How can we help you today?`, status: "read", timestamp: new Date().toISOString() };
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const mockBooking: DemoBooking = { id: `bk-${Date.now()}`, client: mockLead.name, date: tomorrow.toISOString().split("T")[0], time: "10:00", type: "video", status: "confirmed", timestamp: new Date().toISOString() };
      setLeads((prev) => [mockLead, ...prev]);
      setEmails((prev) => [mockEmail, ...prev]);
      setWhatsapps((prev) => [mockWA, ...prev]);
      setBookings((prev) => [mockBooking, ...prev]);
    }

    setIsRunning(false);
  }, []);

  const sendTestEmail = useCallback(async () => {
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_email", data: { template: "welcome_email", to: "demo@example.com", placeholders: { name: "Chioma", company: "Premier Realty" } } }),
    });
    const data = await res.json();
    if (data.email) setEmails((prev) => [data.email, ...prev]);
  }, []);

  const sendTestWhatsApp = useCallback(async () => {
    const res = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_whatsapp", data: { template: "whatsapp_welcome", to: "+234 802 345 6789", placeholders: { name: "Emeka" } } }),
    });
    const data = await res.json();
    if (data.whatsapp) setWhatsapps((prev) => [data.whatsapp, ...prev]);
  }, []);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Elion Automation Demo</h1>
              <p className="text-[11px] text-zinc-500">Interactive walkthrough — click to explore</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => sendTestEmail()} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />Test Email
            </button>
            <button onClick={() => sendTestWhatsApp()} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />Test WhatsApp
            </button>
            <button onClick={() => runFullDemo()} disabled={isRunning} className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? "Running..." : "Run Full Demo"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pipeline animation */}
        {demoSteps.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Automation Pipeline — Live</h3>
            <div className="grid grid-cols-7 gap-3">
              {demoSteps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center transition-all duration-500 ${
                    step.status === "completed" ? "bg-emerald-500/20 border border-emerald-500/40" :
                    step.status === "running" ? "bg-amber-500/20 border border-amber-500/40 animate-pulse" :
                    "bg-zinc-800/50 border border-zinc-700"
                  }`}>
                    {step.status === "completed" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                     step.status === "running" ? <Loader2 className="w-5 h-5 text-amber-400 animate-spin" /> :
                     <Clock className="w-5 h-5 text-zinc-600" />}
                  </div>
                  <p className="text-[10px] font-semibold text-zinc-300 leading-tight">{step.action}</p>
                  <p className="text-[9px] text-zinc-600 leading-tight mt-0.5">{step.detail}</p>
                  {i < demoSteps.length - 1 && (
                    <ArrowRight className="absolute top-3 -right-2 w-3 h-3 text-zinc-700" />
                  )}
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
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg mb-6 w-fit">
          {[
            { id: "all", label: "All Activity" },
            { id: "inbox", label: "Email Inbox" },
            { id: "whatsapp", label: "WhatsApp" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${activeTab === tab.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email / All Activity */}
          {(activeTab === "all" || activeTab === "inbox") && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Email Inbox
              </h3>
              {emails.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center">
                  <Mail className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No emails yet. Click &quot;Run Full Demo&quot; to see automation in action.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((email) => (
                    <div key={email.id} onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)} className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedEmail?.id === email.id ? "border-primary/40 bg-primary/5" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{email.from[0].toUpperCase()}</div>
                          <span className="text-xs font-semibold">{email.from}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${email.status === "delivered" ? "bg-emerald-400" : email.status === "opened" ? "bg-blue-400" : "bg-amber-400 animate-pulse"}`} />
                          <span className="text-[10px] text-zinc-500">{formatTime(email.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 mb-0.5">To: {email.to}</p>
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
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Business
              </h3>
              {whatsapps.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-zinc-800 text-center">
                  <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No messages yet. Click &quot;Test WhatsApp&quot; or &quot;Run Full Demo&quot;.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {whatsapps.map((wa) => (
                    <div key={wa.id} onClick={() => setSelectedWhatsApp(selectedWhatsApp?.id === wa.id ? null : wa)} className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedWhatsApp?.id === wa.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">W</div>
                          <span className="text-xs font-semibold">Elion Business</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${wa.status === "read" ? "text-emerald-400" : wa.status === "delivered" ? "text-zinc-400" : "text-amber-400"}`}>
                            {wa.status === "read" ? "✓✓ Read" : wa.status === "delivered" ? "✓✓ Delivered" : "✓ Sent"}
                          </span>
                          <span className="text-[10px] text-zinc-500">{formatTime(wa.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mb-1">To: {wa.to}</p>
                      {/* Chat bubble */}
                      <div className="bg-emerald-900/20 border border-emerald-800/20 rounded-xl rounded-tl-sm p-3 ml-4">
                        <p className="text-sm text-zinc-200 leading-relaxed">{wa.message}</p>
                        <p className="text-[9px] text-zinc-600 mt-1 text-right">{formatTime(wa.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leads & Bookings (shown in All Activity) */}
          {activeTab === "all" && (
            <>
              {/* Leads */}
              {leads.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" /> Captured Leads
                  </h3>
                  <div className="space-y-2">
                    {leads.map((lead) => (
                      <div key={lead.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-400">{lead.name.split(" ").map((n) => n[0]).join("")}</div>
                            <div>
                              <p className="text-sm font-semibold">{lead.name}</p>
                              <p className="text-[11px] text-zinc-500">{lead.email} • {lead.source}</p>
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
              {bookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rose-400" /> Created Bookings
                  </h3>
                  <div className="space-y-2">
                    {bookings.map((bk) => (
                      <div key={bk.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-rose-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{bk.client}</p>
                              <p className="text-[11px] text-zinc-500">{bk.type} • {bk.date} at {bk.time}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">{bk.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/10 via-zinc-900/50 to-zinc-900/50 border border-primary/20 text-center">
          <h3 className="text-xl font-bold mb-2">This is what we build for your business</h3>
          <p className="text-zinc-400 mb-4 max-w-lg mx-auto">Every lead gets an instant email + WhatsApp response, gets qualified by AI, and gets a booking scheduled — all in under 5 seconds.</p>
          <a href="/landing/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            See Pricing <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
