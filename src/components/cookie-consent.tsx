"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "elion-cookie-consent";

type Consent = {
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_CONSENT: Consent = { analytics: false, marketing: false };

function readConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<Consent>;
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [preferences, setPreferences] = useState<Consent>(DEFAULT_CONSENT);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readConsent();
      setConsent(stored);
      if (stored) setPreferences(stored);
    });
    const openPreferences = () => setManageOpen(true);
    window.addEventListener("elion:open-cookie-preferences", openPreferences);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("elion:open-cookie-preferences", openPreferences);
    };
  }, []);

  const save = (next: Consent) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    } catch {
      // Consent still applies for this render when storage is unavailable.
    }
    setConsent(next);
    setPreferences(next);
    setManageOpen(false);
  };

  if (typeof window === "undefined") return null;

  return (
    <>
      {!consent && (
        <div className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-6 sm:w-[min(440px,calc(100vw-3rem))]" role="dialog" aria-label="Cookie consent">
        <div className="border border-[var(--color-border-light)] bg-[var(--color-surface-raised)] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            We use cookies to improve your experience and understand how ELION is used.
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
            Essential cookies are always active. You can choose whether to allow optional analytics or marketing cookies.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={() => save({ analytics: true, marketing: true })} className="public-primary px-4 py-2.5 text-sm">
              Accept cookies
            </button>
            <button type="button" onClick={() => setManageOpen(true)} className="public-secondary px-4 py-2.5 text-sm">
              Manage preferences
            </button>
            <button type="button" onClick={() => save(DEFAULT_CONSENT)} className="px-2 py-2 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
              Decline optional
            </button>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-[var(--color-text-muted)]">
            Read our <Link href="/cookie-policy" className="underline underline-offset-2 hover:text-[var(--color-text-primary)]">Cookie Policy</Link>.
          </p>
        </div>
        </div>
      )}

      {manageOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
          <div className="w-full max-w-lg border border-[var(--color-border-light)] bg-[var(--color-surface-raised)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="workspace-kicker">Privacy choices</p>
                <h2 id="cookie-preferences-title" className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">Cookie preferences</h2>
              </div>
              <button type="button" onClick={() => setManageOpen(false)} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" aria-label="Close cookie preferences">Close</button>
            </div>

            <div className="mt-7 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              <PreferenceRow title="Essential" description="Required for security, authentication, and core site functionality." checked disabled />
              <PreferenceRow title="Analytics" description="Optional measurement that helps us understand site usage." checked={preferences.analytics} onChange={(value) => setPreferences((current) => ({ ...current, analytics: value }))} />
              <PreferenceRow title="Marketing" description="Optional cookies used for relevant campaign measurement. None are active by default." checked={preferences.marketing} onChange={(value) => setPreferences((current) => ({ ...current, marketing: value }))} />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => save(DEFAULT_CONSENT)} className="public-secondary px-4 py-2.5 text-sm">Reject non-essential</button>
              <button type="button" onClick={() => save(preferences)} className="public-primary px-4 py-2.5 text-sm">Save choices</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PreferenceRow({ title, description, checked, disabled = false, onChange }: { title: string; description: string; checked: boolean; disabled?: boolean; onChange?: (checked: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title} cookies`}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? "border-[var(--color-accent)] bg-[var(--color-accent)]" : "border-[var(--color-border-light)] bg-[var(--color-surface)]"} ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`} />
      </button>
    </div>
  );
}
