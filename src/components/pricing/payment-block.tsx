"use client";
import { Building2, CheckCircle2, ClipboardCopy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ELION_PAYMENT } from "@/lib/pricing";

export function PaymentBlock() {
  const [copied, setCopied] = useState(false);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(ELION_PAYMENT.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable in some contexts — ignore
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 text-left">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
        <h3 className="text-base font-bold text-[var(--color-text-primary)]">How to get started</h3>
      </div>

      <ol className="space-y-2 text-sm text-[var(--color-text-secondary)] mb-6">
        <li className="flex gap-3"><span className="font-semibold text-[var(--color-accent)] shrink-0">1.</span> Choose the package that fits your business above.</li>
        <li className="flex gap-3"><span className="font-semibold text-[var(--color-accent)] shrink-0">2.</span> Review the implementation summary — a one-time implementation fee; no surprise renewals.</li>
        <li className="flex gap-3"><span className="font-semibold text-[var(--color-accent)] shrink-0">3.</span> Make payment via bank transfer using the details below.</li>
        <li className="flex gap-3"><span className="font-semibold text-[var(--color-accent)] shrink-0">4.</span> Send your payment reference to us and onboarding begins.</li>
      </ol>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
          <Building2 className="w-3 h-3" /> Bank transfer details
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Bank</p>
            <p className="text-base font-semibold text-[var(--color-text-primary)]">{ELION_PAYMENT.bank}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Account number</p>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[var(--color-text-primary)] tracking-wide">{ELION_PAYMENT.accountNumber}</span>
              <button
                onClick={copyNumber}
                aria-label="Copy account number"
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
              </button>
              {copied && <span className="text-[10px] text-[var(--color-success)]">Copied</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
        <p>• {ELION_PAYMENT.notice}</p>
        <p>• {ELION_PAYMENT.afterPayment}</p>
        <p>• {ELION_PAYMENT.onlinePaymentNote}</p>
      </div>

      <a
        href="/landing/support"
        className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all"
      >
        I&apos;ve paid — confirm my order <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}