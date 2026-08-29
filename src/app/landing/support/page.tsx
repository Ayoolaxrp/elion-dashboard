"use client";
import { useState } from "react";
import { MessageSquare, Mail, Phone, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      {/* Header */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-[var(--color-surface)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">ELION</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">Support</h1>
          <p className="text-sm text-[var(--color-text-muted)]">We are here to help. Contact us through any of the channels below.</p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-8">Contact us</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://wa.me/2348012345678"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] mb-3">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">WhatsApp</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Fastest response. Available during business hours.</p>
              <p className="text-xs text-[var(--color-text-muted)]">+234 801 234 5678</p>
            </a>

            <a
              href="mailto:support@elion.ng"
              className="border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Email</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">For detailed enquiries and support requests.</p>
              <p className="text-xs text-[var(--color-text-muted)]">support@elion.ng</p>
            </a>

            <div className="border border-[var(--color-border)] rounded-lg p-5">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Phone</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Monday to Friday, 9am to 6pm WAT.</p>
              <p className="text-xs text-[var(--color-text-muted)]">+234 801 234 5678</p>
            </div>
          </div>

          <div className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              <strong>Response expectations:</strong> WhatsApp and phone enquiries are typically answered within 2 hours during business hours.
              Email enquiries are responded to within 24 hours. For urgent issues, WhatsApp is the fastest channel.
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
            <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-lg p-6 text-center">
              <CheckCircle className="w-8 h-8 text-[var(--color-success)] mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Request submitted</h3>
              <p className="text-sm text-[var(--color-text-muted)]">We will respond within 24 hours. For urgent issues, contact us via WhatsApp.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 appearance-none cursor-pointer"
                >
                  <option value="">Select a topic</option>
                  <option value="general">General enquiry</option>
                  <option value="support">Technical support</option>
                  <option value="billing">Billing question</option>
                  <option value="feature">Feature request</option>
                  <option value="bug">Bug report</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 resize-none"
                  placeholder="Describe your issue or question..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[var(--color-accent)] text-white rounded text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
              >
                Send Request
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
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
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
