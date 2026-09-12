import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "How the ELION Free Business Audit Works",
  description:
    "What the ELION audit inspects, how findings are classified as observed, inferred or estimated, and what ELION does with the data. Transparency behind the free business audit.",
  alternates: { canonical: "/methodology" },
};

const EVIDENCE_LEVELS = [
  {
    label: "Observed",
    color: "var(--color-accent)",
    text: "Directly supported by information found on the pages ELION successfully fetched and inspected. Examples: a WhatsApp deep link, a booking provider iframe, structured contact data.",
  },
  {
    label: "Inferred",
    color: "var(--color-warning, #d97706)",
    text: "A reasonable conclusion drawn from observed evidence. ELION marks these clearly and tells you what would confirm or refute the conclusion.",
  },
  {
    label: "Estimated",
    color: "var(--color-text-muted)",
    text: "Figures derived from stated assumptions or industry benchmarks. Estimates are always labeled as illustrative; they are never presented as measured results from your business.",
  },
];

const CHECKS = [
  ["Reachability", "Whether the site responds, redirects correctly, and serves content ELION can inspect."],
  ["Public contact paths", "Email links, phone links, WhatsApp chat links, contact forms."],
  ["Booking and scheduling", "Self-serve booking tools, appointment widgets, calendar integrations."],
  ["Live chat and support", "Chat widgets and support platforms with identifiable technical evidence."],
  ["Marketing technology", "Email marketing and CRM signals identified only from strong technical evidence like script sources or provider forms."],
  ["Social presence", "Public social profile links, excluding share buttons and login links."],
  ["Website fundamentals", "Page title, description, mobile viewport, structured data, analytics presence."],
];

const LIMITS = [
  "ELION inspects the publicly available pages it can reach within a short, bounded crawl. It does not see your internal tools, inbox, CRM, or private processes.",
  "Heavy JavaScript sites can hide content from automated inspection. When a check cannot be completed, ELION reports 'could not verify' instead of claiming something is missing.",
  "A missing technology is not automatically a problem. Whether it matters depends on how your business actually works, which is why findings come with questions rather than verdicts.",
  "The audit never submits your forms, never contacts you, and never shares your report publicly.",
];

const ROWS = [
  ["A chatbot or WhatsApp responder you install on your own.", "A business audit that finds the leaks first: slow replies, lost bookings, missed follow-up, manual processes — then recommends what to automate."],
  ["A tool pitched by features: AI, automation, omnichannel.", "A diagnosis pitched by business outcome: respond faster, qualify leads, reduce manual work, and measure the difference."],
  ["A subscription you configure yourself.", "Implementation + management: ELION deploys and runs the system, monitors it, and improves it as part of the service."],
  ["Generic use cases that fit every business the same way.", "A custom inspection of your actual website, customer journey, and process gaps — because a clinic, a real-estate firm, and a law firm lose customers in different ways."],
  ["A demo that shows the product interface.", "A demo that shows a full lead going through the pipeline — enquiry, qualification, CRM update, follow-up — against a sample business."],
  ["Surface-level promises about results.", "Evidence-based findings with honest labels: observed, inferred, and estimated — and the questions needed to confirm each one."],
];

export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">How the ELION audit works</h1>
        <p className="text-lg text-[var(--color-text-muted)] mb-12">
          ELION inspects publicly available pages of your website and reports only what it can support with evidence.
          This page explains exactly what that means, so you can judge the findings for yourself.
        </p>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">What the audit inspects</h2>
          <div className="space-y-4">
            {CHECKS.map(([title, body]) => (
              <div key={title} className="border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-surface-raised)]">
                <p className="font-medium mb-1">{title}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">How findings are classified</h2>
          <div className="space-y-4">
            {EVIDENCE_LEVELS.map((lvl) => (
              <div key={lvl.label} className="border-l-2 pl-5 py-1" style={{ borderColor: lvl.color }}>
                <p className="font-medium mb-1">{lvl.label}</p>
                <p className="text-sm text-[var(--color-text-muted)]">{lvl.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Honest limitations</h2>
          <ul className="space-y-3">
            {LIMITS.map((l) => (
              <li key={l.slice(0, 30)} className="flex gap-3 text-sm text-[var(--color-text-muted)]">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)] shrink-0" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14 border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-surface-raised)]">
          <h2 className="text-xl font-semibold tracking-tight mb-3">What ELION does with your data</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            When you run an audit, ELION stores the website address, the evidence it found, and the report so it can
            show you results and improve the audit. ELION does not sell your data and does not use your report for
            advertising. Details are in the{" "}
            <Link href="/privacy" className="underline hover:text-[var(--color-text-primary)]">privacy policy</Link>.
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            ELION may publish aggregated statistics across many audited businesses (for example, the share of audited
            sites with online booking). Individual businesses are never named without permission.
          </p>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">How ELION compares</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            AI automation providers in Nigeria mostly sell a tool: a chatbot, a WhatsApp responder, a booking widget.
            ELION takes a different approach. The table below is not a competitor list — it is a description of the difference in approach.
          </p>
          <div className="overflow-hidden border border-[var(--color-border)] rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">What most AI automation providers sell</th>
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium">What ELION does instead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {ROWS.map(([a, b]) => (
                  <tr key={a.slice(0, 30)} className="hover:bg-[var(--color-surface)]">
                    <td className="px-4 py-4 text-[var(--color-text-muted)]">{a}</td>
                    <td className="px-4 py-4"><span className="text-[var(--color-text-primary)]">{b}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            ELION is not better because it uses a different AI model. ELION is different because it starts with a business audit —
            finding what is leaking — and only then recommends the automation that addresses it. That audit is free.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/audit"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90"
          >
            Run Your Free Business Audit
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[var(--color-border)] text-sm font-semibold hover:bg-[var(--color-surface-raised)]"
          >
            See Pricing
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
