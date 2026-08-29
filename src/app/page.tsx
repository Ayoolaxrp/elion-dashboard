"use client";

import { Search, Zap, Mail, RotateCcw, Calendar, Settings, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const systems = [
  {
    id: "audit",
    title: "Leak Audit",
    description: "Analyse your business and identify where you are losing leads, time, and revenue.",
    icon: Search,
    href: "/audit",
    color: "text-[var(--color-accent)]",
    bgColor: "bg-[var(--color-accent)]/10",
    problem: "You know something is inefficient, but you cannot pinpoint where the leaks are.",
  },
  {
    id: "leads",
    title: "Lead Response",
    description: "Capture, qualify, and respond to every lead within seconds across all channels.",
    icon: Zap,
    href: "/leads",
    color: "text-[var(--color-warning)]",
    bgColor: "bg-[var(--color-warning)]/10",
    problem: "A lead comes in. Nobody responds. By the time someone does, they have already gone to a competitor.",
  },
  {
    id: "followup",
    title: "Follow-Up Engine",
    description: "Automated multi-channel follow-up sequences that convert enquiries into customers.",
    icon: Mail,
    href: "/followup",
    color: "text-[var(--color-success)]",
    bgColor: "bg-[var(--color-success)]/10",
    problem: "Your sales team says they will call them tomorrow. Tomorrow never comes.",
  },
  {
    id: "recovery",
    title: "Revenue Recovery",
    description: "Reactivate dormant leads and old customers sitting in your database.",
    icon: RotateCcw,
    href: "/recovery",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    problem: "You have thousands of contacts. Nobody is reaching out to them. Revenue left on the table.",
  },
  {
    id: "booking",
    title: "Booking Engine",
    description: "Turn enquiries into booked appointments without the back-and-forth.",
    icon: Calendar,
    href: "/booking",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    problem: "Customers message, wait, ask availability, reply, confirm. Staff waste hours coordinating.",
  },
  {
    id: "operations",
    title: "Operations Automation",
    description: "Remove repetitive work from your team's day. Data entry, reports, notifications, and more.",
    icon: Settings,
    href: "/operations",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    problem: "Your team copies data between systems, updates spreadsheets, manually sends reports.",
  },
];

export default function DashboardPage() {
  const [notif, setNotif] = useState("");
  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {notif && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-2.5 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)] text-sm font-medium rounded-lg animate-fade-in">
          {notif}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[var(--color-accent)] flex items-center justify-center">
            <span className="text-white text-sm font-bold tracking-tight">E</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">ELION</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] -mt-0.5">Business Automation Systems</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Search className="w-4 h-4" />Run Free Audit
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-8 md:p-12 mb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3 leading-tight">
            Find the leaks in your business.<br />Then automate them.
          </h2>
          <p className="text-base text-[var(--color-text-muted)] mb-6 leading-relaxed">
            ELION identifies where your business is losing time, leads, money, or operational efficiency.
            Then we build automation systems to fix it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Run Your Free Leak Audit
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded font-semibold text-sm hover:bg-[var(--color-surface)] transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </div>

      {/* What ELION Does */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">What ELION does</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Businesses lose money through slow follow-up, missed leads, inefficient operations, and dormant customers.
            ELION identifies the leak and builds the automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {systems.map((sys) => (
            <Link key={sys.id} href={sys.href}>
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-5 hover:border-[var(--color-border-light)] transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg ${sys.bgColor} flex items-center justify-center shrink-0`}>
                    <sys.icon className={`w-4 h-4 ${sys.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{sys.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-0.5">{sys.description}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-muted)] italic">"{sys.problem}"</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-8 mb-8">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">How it works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Run a free audit", desc: "Enter your business information. We analyse your website and digital presence." },
            { step: "02", title: "See your leaks", desc: "We identify where you are losing leads, time, and money with specific evidence." },
            { step: "03", title: "Choose your automation", desc: "Pick the system that addresses your biggest leak. We build it for you." },
            { step: "04", title: "Go live", desc: "We deploy, test, and hand over. You own everything. Optional support available." },
          ].map((s) => (
            <div key={s.step}>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-xs font-bold text-white mb-3">
                {s.step}
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{s.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[var(--color-accent)] rounded-lg p-8 text-center">
        <h2 className="text-lg font-bold text-white mb-2">Ready to find your leaks?</h2>
        <p className="text-sm text-blue-100 mb-5">Every day you wait, you are losing leads, time, and revenue.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/audit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-surface-raised)] text-[var(--color-accent)] rounded-lg font-semibold text-sm hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            Run Free Leak Audit
          </Link>
          <Link
            href="/landing/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-accent-hover)] text-white rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
