"use client";
import { useEffect, useState } from "react";
import { MessageSquare, Mail, Phone, ChevronDown, ChevronUp, CheckCircle, Send, User, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { validateName, validateEmail, validateMessage } from "@/lib/validation";
import SupportAssistantWidget from "@/components/support-assistant-widget";

// Business hours: Monday–Friday 09:00–18:00 WAT (Africa/Lagos).
function getWATNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return {
    weekday: get("weekday") as string, // Mon..Sun
    minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10),
  };
}

function nextBusinessDayLabel(weekday: string, beforeOpen: boolean): string {
  if (beforeOpen) return "today";
  if (weekday === "Fri" || weekday === "Sat" || weekday === "Sun") return "Monday";
  return "tomorrow";
}

function useSupportStatus() {
  const [status, setStatus] = useState(() => computeStatus());
  useEffect(() => {
    const id = setInterval(() => setStatus(computeStatus()), 60_000);
    return () => clearInterval(id);
  }, []);
  return status;
}

function computeStatus() {
  const { weekday, minutes } = getWATNow();
  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
  const open = 9 * 60;
  const close = 18 * 60;
  const online = isWeekday && minutes >= open && minutes < close;
  const beforeOpen = isWeekday && minutes < open;
  const label = online ? "We\u2019re online now" : `Outside business hours. We\u2019ll respond by ${nextBusinessDayLabel(weekday, beforeOpen)}`;
  return { online, label };
}

const faqs = [
  { q: "How do I get started?", a: "Run a free Leak Audit on our website. We will analyse your business and identify automation opportunities. From there, we recommend the right plan." },
  { q: "What if I need help after my automation is live?", a: "We offer monthly support plans that cover monitoring, maintenance, and improvements. You can also contact us for one-off support requests." },
  { q: "How do I report a bug?", a: "Contact us via WhatsApp or email with a description of the issue. Our team will respond within 24 hours during business days." },
  { q: "Can I request new features or changes?", a: "Yes. Monthly support clients can request workflow adjustments and new automation iterations. One-time clients can purchase additional workflows." },
  { q: "What are your support hours?", a: "We respond to support requests Monday to Friday, 9am to 6pm WAT. WhatsApp responses are typically faster." },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const status = useSupportStatus();

  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    
    const errors: Record<string, string> = {};
    const nameCheck = validateName(form.name);
    if (!nameCheck.valid) errors.name = nameCheck.error || "";
    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) errors.email = emailCheck.error || "";
    const msgCheck = validateMessage(form.message);
    if (!msgCheck.valid) errors.message = msgCheck.error || "";
    
    if (Object.keys(errors).length > 0) { setFormErrors(errors); setSubmitting(false); return; }
    try {
      await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: "",
          website: "", businessType: form.subject,
          primaryProblem: form.message, enquiryChannels: "support",
          teamSize: "", source: "support"
        })
      });
    } catch {}
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      <SupportAssistantWidget
        onHandoff={(context) => {
          if (!context) return;
          setForm((f) => ({
            ...f,
            message: f.message ? `${f.message}\n\n${context}` : context,
          }));
        }}
      />
      {/* Header */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, damping: 30, stiffness: 260 }}
            className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            Support
          </motion.h1>
          <p className="text-sm text-[var(--color-text-muted)]">We are here to help. Contact us through any of the channels below.</p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          {/* Live status : computed from the current WAT time, never hardcoded */}
          <div
            className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-xs sm:text-sm font-medium mb-8 min-h-[44px] ${
              status.online
                ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
            }`}
            role="status"
            aria-live="polite"
          >
            <span className={`relative flex w-2.5 h-2.5 ${status.online ? "" : "opacity-50"}`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${status.online ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]"}`} />
              <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${status.online ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]"}`} />
            </span>
            {status.label}
          </div>

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-8">Contact us</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://wa.me/2349126281855?text=Hello%20ELION%2C%20I%20need%20support"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors block min-h-[44px]">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">WhatsApp</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Usually within 1 hour during business hours.</p>
              <p className="text-xs text-[var(--color-accent-bright)] font-medium">Send a message</p>
            </a>

            <a
              href="mailto:support@elion.com.ng"
              className="border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors block min-h-[44px]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Email</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Within 24 hours on business days.</p>
              <p className="text-xs text-[var(--color-accent-bright)] font-medium">support@elion.com.ng</p>
            </a>

            <a href="tel:+2349126281855" className="border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors block min-h-[44px]">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Phone</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Monday to Friday, 9am to 6pm WAT.</p>
              <p className="text-xs font-medium text-[var(--color-accent-bright)]">0912 628 1855</p>
            </a>
          </div>

          {/* Single expectations block : hours + urgent guidance only (channel times live in the cards above) */}
          <div className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              <strong>Response expectations:</strong> All channels are monitored Monday to Friday, 9am to 6pm WAT.
              For urgent issues, mention &quot;urgent&quot; in your message. Messages received outside business hours are picked up the next business day.
            </p>
          </div>
        </div>
      </section>

      {/* Support Request Form */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Send a support request</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Fill out the form below and we will get back to you within 24 hours.</p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
                className="w-12 h-12 rounded-full bg-[var(--color-success)]/15 flex items-center justify-center mx-auto mb-3"
              >
                <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
              </motion.div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Request submitted</h3>
              <p className="text-sm text-[var(--color-text-muted)]">We will respond during business hours. For urgent issues, contact us via WhatsApp.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="support-name" className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Name</label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--color-accent)]" />
                    <input
                      id="support-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/60"
                      placeholder="Your name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="support-email" className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Email</label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--color-accent)]" />
                    <input
                      id="support-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/60"
                      placeholder="you@business.com"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="support-subject" className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Subject</label>
                <div className="relative group">
                  <Tag className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--color-accent)] pointer-events-none" />
                  <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="support-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full pl-10 pr-9 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/60 appearance-none cursor-pointer"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General enquiry</option>
                    <option value="support">Technical support</option>
                    <option value="billing">Billing question</option>
                    <option value="feature">Feature request</option>
                    <option value="bug">Bug report</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="support-message" className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1.5">Message</label>
                <div className="relative group">
                  <MessageSquare className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-3.5 transition-colors group-focus-within:text-[var(--color-accent)]" />
                  <textarea
                    id="support-message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]/60 resize-none"
                    placeholder="Describe your issue or question..."
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.98]"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <>Send Request <Send className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer" aria-expanded={openFaq===i}
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
