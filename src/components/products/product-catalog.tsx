"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Repeat,
  CalendarDays,
  RotateCcw,
  Settings2,
  Headset,
  Mail,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import {
  PRODUCT_CATALOG,
  PRODUCT_COMMERCIAL_METADATA,
  getProductCommercialMetadata,
  ProductDefinition,
  fmtNgn,
} from "@/lib/products";
import { ELION_TIERS } from "@/lib/pricing";

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4">
      {children}
    </p>
  );
}

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97] px-8 py-4 text-base"
    >
      {children}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:text-white transition-all active:scale-[0.97] px-8 py-4 text-base"
    >
      {children}
    </Link>
  );
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Repeat,
  CalendarDays,
  RotateCcw,
  Settings2,
  Headset,
  Mail,
  TrendingUp,
};

function ProductCard({ product }: { product: ProductDefinition }) {
  const meta = getProductCommercialMetadata(product.id);
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const Icon = ICON_MAP[product.icon] || MessageCircle;

  const isActive = product.status === "active";
  const isComingSoon = product.status === "coming_soon";

  const pricing = meta
    ? {
        setup: meta.setup_price_ngn,
        monthly: meta.monthly_care_price_ngn,
      }
    : {
        setup: product.pricing.setup_fee,
        monthly: product.pricing.monthly_fee,
      };

  return (
    <article
      className={`rounded-2xl border p-6 md:p-8 bg-[var(--color-surface-raised)] transition-colors ${
        isActive
          ? "border-[var(--color-border)]/60 shadow-xl shadow-black/30"
        : isComingSoon
        ? "border-dashed border-[var(--color-border)]/40"
        : "border-[var(--color-border)]/60"
      }`}
    >
      <div className="flex items-start gap-5">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isActive ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20" : "bg-[var(--color-surface)] border border-[var(--color-border)]/50"
            }`}
          >
            <Icon
              className={isActive ? "w-6 h-6 text-[var(--color-accent)]" : "w-6 h-6 text-[var(--color-text-muted)]"}
            />
          </div>
          <span
            className={`text-[10px] font-bold tabular-nums ${
              isActive ? "text-[var(--color-accent-bright)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            {product.short_name}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
              {product.name}
            </h3>
            {isComingSoon && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border border-[var(--color-border)]/30">
                Roadmap
              </span>
            )}
            {!isComingSoon && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
                Available
              </span>
            )}
          </div>

          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            <span className="text-[var(--color-text-secondary)] font-medium">The problem: </span>
            {meta?.customer_problem || product.description}
          </p>

          <div className="mt-4">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Setup / monthly</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
                {fmtNgn(pricing.setup)}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">one-time</span>
              {pricing.monthly > 0 && (
                <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                  + {fmtNgn(pricing.monthly)}/mo ELION Care
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors active:scale-[0.97] disabled:opacity-50"
              disabled={isComingSoon}
            >
              View Details
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-6 pt-6 border-t border-[var(--color-border)]/60 space-y-5">
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="inline-block w-3.5 h-3.5 mr-1" />
            Close
          </button>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Ideal for</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{meta?.ideal_customer || "Businesses with this operational problem."}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">What ELION builds</p>
              <ul className="space-y-1">
                {(meta?.implementation_scope || []).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Plain-English flow</p>
              <ol className="space-y-2">
                {(product.plain_english || []).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-accent)] font-bold shrink-0 mt-0.5">→</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Infrastructure & costs</p>
              <ul className="space-y-1.5 text-sm text-[var(--color-text-secondary)]">
                {(product.infrastructure?.notes || []).map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] mt-1.5 shrink-0" />
                    {n}
                  </li>
                ))}
                {(product.infrastructure?.items || []).map((item) => (
                  <li key={item.provider} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.required ? "bg-[var(--color-warning)]" : "bg-[var(--color-text-muted)]"}`} />
                    <span className="font-medium text-[var(--color-text-primary)]">{item.provider}</span>
                    <span className="text-[var(--color-text-muted)]"> — {item.purpose}</span>
                    {!item.required && <span className="text-[10px] text-[var(--color-text-muted)]">(optional)</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {meta && (
            <div className="rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Commercial rules</p>
              <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-medium shrink-0">Setup:</span>
                  {fmtNgn(meta.setup_price_ngn)}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-medium shrink-0">Monthly Care:</span>
                  {fmtNgn(meta.monthly_care_price_ngn)}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-medium shrink-0">Third-party:</span>
                  {meta.third_party_cost_estimate}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--color-accent)] font-medium shrink-0">Usage:</span>
                  {meta.usage_pricing}
                </li>
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">What you need</p>
            <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
              {(meta?.client_requirements || []).map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] mt-1.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {isComingSoon ? (
            <div className="rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                This product is on the roadmap. ELION does not claim it is available until it is configured, tested, and activated for a client.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4">
              {!selecting ? (
                <button
                  onClick={() => setSelecting(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors active:scale-[0.97]"
                >
                  Request this system
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    This expresses interest. ELION will review and follow up. No payment is taken here.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Your name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Business email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                        type="email"
                        placeholder="you@business.com"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!name || !email) return;
                        setSubmitting(true);
                        try {
                          const res = await fetch("/api/request", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              name,
                              email,
                              selectedProduct: product.name,
                              message: `Interest in ${product.name}.`,
                            }),
                          });
                          setSubmitted(res.ok);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting || !name || !email}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors active:scale-[0.97] disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {submitted ? "Sent" : "Send request"}
                    </button>
                    <button
                      onClick={() => { setSelecting(false); setName(""); setEmail(""); setSubmitted(false); }}
                      className="px-4 py-3 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {submitted && (
                    <p className="text-xs text-[var(--color-success)]">
                      Request noted. ELION will follow up.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function ProductCatalog() {
  const active = PRODUCT_CATALOG.filter((p) => p.status === "active");
  const upcoming = PRODUCT_CATALOG.filter((p) => p.status === "coming_soon");

  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20 px-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,124,255,0.08),transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-node-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)]" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-accent)]" />
            </span>
            AI Employees & Automation Systems
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Each leak gets its own system.
          </h1>
          <p className="mt-5 text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed">
            ELION does not sell a generic AI chatbot. It packages proven automation into focused systems — each one built around a specific business problem, priced transparently, and deployed around how you actually operate.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              Audit before automation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              Evidence-based recommendations
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
              You own the system
            </span>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <PrimaryCta href="#systems">See the systems</PrimaryCta>
            <SecondaryCta href="/audit">Run Free Audit</SecondaryCta>
          </div>
        </div>
      </section>

      {/* Promise strip */}
      <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-surface-raised)]/40">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Every product below has a commercial contract: the problem it solves, the customer it fits, the setup and monthly price, the third-party costs, the provisioning checklist, and the rules that govern what it can and cannot do.
              Nothing is marked live unless it passes that check.
              Voice AI, for example, is listed only as a scoped capability that requires a provider — not as a generic promise.
            </p>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              This page reflects the current product catalogue. Pricing and availability are confirmed during the audit and proposal process.
            </p>
          </div>
        </div>
      </section>

      {/* Active systems */}
      <section id="systems" className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <SectionTag>Available systems</SectionTag>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
              What ELION actually deploys
            </h2>
            <p className="mt-4 text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Each system is a focused AI employee or automation, built around one problem. Not a chatbot. Not a dashboard. A system that does a job.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {active.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <PrimaryCta href="/audit">Find which system fits</PrimaryCta>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Not sure which system you need? The audit finds the leak, then recommends the system.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      {upcoming.length > 0 && (
        <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-surface-raised)]/40 py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <SectionTag>Roadmap</SectionTag>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
                What is coming
              </h2>
              <p className="mt-4 text-base text-[var(--color-text-secondary)] max-w-xl mx-auto">
                These are scoped products under development or planned. They are not available until they pass the activation check.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {upcoming.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-6">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Voice AI is handled with particular care: it requires a voice provider, metered usage, and strict escalation rules before a client ever hears it. It is not a generic "AI call agent" promise — it is a scoped capability with real infrastructure and real guardrails.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* How to buy */}
      <section className="py-16 md:py-20 px-6 border-t border-[var(--color-border)]/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>How to buy</SectionTag>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
              From interest to live system
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                { n: "01", title: "Request the system", desc: "Use the Request this system button on any product. Tell ELION your name, business, and what you want to fix." },
                { n: "02", title: "Free audit", desc: "ELION audits your public presence to confirm the problem exists and find related leaks you may not have noticed." },
                { n: "03", title: "Proposal", desc: "ELION sends a scoped proposal with setup fee, monthly Care option, third-party costs, and the provisioning checklist." },
                { n: "04", title: "Payment", desc: "Payment is confirmed before implementation begins. ELION uses verified payment processing — redirects alone never mark a deal done." },
                { n: "05", title: "Build & deploy", desc: "ELION configures, connects, tests, and deploys the system. You own it." },
                { n: "06", title: "Operate", desc: "Optional ELION Care keeps the system monitored, tuned, and supported. You can stop Care at any time." },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <span className="text-2xl font-bold text-[var(--color-accent)]/20 shrink-0">{step.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{step.title}</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] p-6 md:p-8">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Pricing at a glance</p>
              <div className="divide-y divide-[var(--color-border)]/50">
                {ELION_TIERS.map((tier) => (
                  <div key={tier.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{tier.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{tier.bestFor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--color-text-primary)]">{tier.price}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{tier.period}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                Product-level setup and monthly prices are shown on each product card. Bundles and individual systems are quoted together during the proposal.
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]/50">
                <SecondaryCta href="/audit">Start with the free audit</SecondaryCta>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 px-6 border-t border-[var(--color-border)]/60 bg-[var(--color-surface-raised)]/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <SectionTag>Questions</SectionTag>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
              About ELION systems
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Is ELION an AI chatbot company?",
                a: "No. ELION is a business automation company. The AI is a component inside systems that respond, qualify, book, recover revenue, and run operations — always with approved knowledge, escalation rules, and human oversight where it matters.",
              },
              {
                q: "What is an AI employee?",
                a: "ELION's term for a focused automation system that handles one job end-to-end: a Lead Response employee captures and replies to enquiries, a Booking employee schedules appointments, a Revenue Recovery employee re-engages dormant contacts. Each has a defined scope, not a blank cheque.",
              },
              {
                q: "Do I need to replace my existing tools?",
                a: "No. ELION systems connect to the tools you already use — WhatsApp, email, CRM, calendar, spreadsheets, and custom APIs. The goal is to automate the gaps, not to rip and replace.",
              },
              {
                q: "What does it cost?",
                a: "Each system has a setup fee and an optional monthly Care fee, shown on the product card. There are also third-party costs — WhatsApp, email, AI usage, voice minutes — which are separate from ELION fees and disclosed upfront. Bundles are available for businesses that want multiple systems.",
              },
              {
                q: "Who owns what gets built?",
                a: "You do. The configuration, workflows, and documentation are yours. ELION’s optional Care plan covers monitoring and support, but there is no lock-in. Systems continue running without ELION if you choose.",
              },
              {
                q: "Is the audit really free?",
                a: "Yes. ELION analyzes publicly available information about your business and delivers evidence-based findings at no cost. No credit card is required. The audit is a discovery step, not a sales promise.",
              },
              {
                q: "Can I start small and expand later?",
                a: "Yes. Many businesses start with one system — often Lead Response or Follow-Up — and add more as they see results. The audit helps choose the first system.",
              },
              {
                q: "What about voice AI and phone calls?",
                a: "Voice AI is a scoped capability, not a generic promise. It requires a voice provider, metered usage, approved knowledge, and strict escalation rules. ELION lists it as roadmap/scoped until it is configured, tested, and activated for a client.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] px-5 py-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{faq.q}</p>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 md:py-20 px-6 bg-[var(--color-surface)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(79,124,255,0.09),transparent_55%)]" />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-4">
            Find the leak. Then deploy the system that fixes it.
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            Not sure where to start? Run a free audit. ELION will find the leak and recommend the exact system your business needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <PrimaryCta href="/audit">Run Free Business Audit</PrimaryCta>
            <SecondaryCta href="/demo">See a system in action</SecondaryCta>
          </div>
        </div>
      </section>
    </>
  );
}
