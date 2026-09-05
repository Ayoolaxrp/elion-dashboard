"use client";
// ELION client onboarding form (light document style, spec section 1).
// Four steps, saved per step (truthful "Saved" only after a successful
// write), resumable, save-and-exit. Tokens scoped to this page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowLeft } from "lucide-react";

const T = {
  pageBg: "#F7F7F5", surface: "#FFFFFF",
  textPrimary: "#252525", textSecondary: "#646461", textMuted: "#777773", border: "#E4E4E0",
  accent: "#6950A1", focusRing: "#8063B5",
};

const STEP_TITLES = ["Welcome to ELION", "Goals and current process", "Tools and required access", "Review and kickoff"];

type FormData = Record<string, string>;

const fields: Record<number, { k: string; label: string; helper?: string; textarea?: boolean }[]> = {
  1: [
    { k: "company_name", label: "Company name" },
    { k: "contact_name", label: "Your name" },
    { k: "role", label: "Your role", helper: "For example: founder, operations manager" },
    { k: "phone", label: "Best phone number" },
  ],
  2: [
    { k: "goals", label: "What should your ELION systems achieve first?", textarea: true, helper: "For example: respond to every enquiry within a minute" },
    { k: "current_process", label: "How do enquiries currently reach your team?", textarea: true },
  ],
  3: [
    { k: "whatsapp", label: "WhatsApp business number (if any)" },
    { k: "email", label: "Team email for automation" },
    { k: "calendar", label: "Calendar you use (Google / Outlook / other)" },
    { k: "access_notes", label: "Anything we should know about your accounts?", textarea: true, helper: "Never enter passwords here. Access is granted via provider invitations." },
  ],
  4: [
    { k: "kickoff_preference", label: "Preferred kickoff time", helper: "Monday to Friday, 9am to 6pm WAT" },
    { k: "notes", label: "Anything else?", textarea: true },
  ],
};

export default function PortalOnboardingForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Record<number, FormData>>({});
  const [savedSteps, setSavedSteps] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/client/portal")
      .then((r) => r.json())
      .then((d) => {
        if (d?.onboardingForm) {
          setStep(Math.min(d.onboardingForm.current_step + (d.onboardingForm.saved_steps >= 4 ? 0 : 1), 4));
          if (d.onboardingForm.saved_steps >= 4) setDone(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function set(k: string, v: string) {
    setData((prev) => ({ ...prev, [step]: { ...prev[step], [k]: v } }));
    setJustSaved(false);
  }

  async function saveStep() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/client/portal/onboarding-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data: data[step] || {} }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) {
        setSaveError(j.error || "Could not save. Your answers are still here, try again.");
      } else {
        setSavedSteps((prev) => [...new Set([...prev, step])]);
        setJustSaved(true);
        if (step < 4) setStep(step + 1);
        else setDone(true);
      }
    } catch {
      setSaveError("Network error. Your answers are still here, try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: T.surface, border: "1px solid " + T.border, borderRadius: 6,
    minHeight: 48, padding: "0 12px", color: T.textPrimary, fontSize: 16, width: "100%",
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.pageBg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: T.pageBg, color: T.textPrimary }}>
      <div className="mx-auto w-full" style={{ maxWidth: 760 }}>
        <div className="rounded-t-lg flex items-center justify-between px-6" style={{
          background: "linear-gradient(115deg, #4533B5 0%, #30275D 52%, #B566B4 100%)", height: 148,
        }}>
          <span className="text-white text-sm font-semibold tracking-wide">ELION</span>
          <span className="text-white/80 text-xs font-semibold tracking-widest">CLIENT ONBOARDING</span>
        </div>

        <div className="rounded-b-lg" style={{ background: T.surface, border: "1px solid " + T.border, padding: 40 }}>
          {done ? (
            <div className="text-center py-10">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "#E8F3EB" }}>
                <Check className="w-6 h-6" style={{ color: "#25613C" }} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Onboarding complete</h1>
              <p className="text-sm mb-6" style={{ color: T.textSecondary }}>
                Thank you. Your answers are saved and our team is preparing your systems.
              </p>
              <Link href="/dashboard/portal" className="inline-flex items-center justify-center gap-2 rounded-md font-semibold text-white" style={{ background: T.accent, height: 48, padding: "0 24px", fontSize: 15 }}>
                Open your workspace
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs mb-1" style={{ color: T.textMuted }}>Step {step} of 4</p>
              <div className="flex gap-1.5 mb-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex-1 rounded-full" style={{ height: 4, background: savedSteps.includes(n) || n < step ? T.accent : n === step ? T.focusRing : "#ECECE9" }} />
                ))}
              </div>
              <h1 className="text-3xl leading-10 font-bold">{STEP_TITLES[step - 1]}</h1>
              <p className="text-sm mt-1 mb-8" style={{ color: T.textSecondary }}>
                {step === 1 ? "Tell us about your business so we can prepare your systems." : "All answers are saved as you go."}
              </p>

              <div className="space-y-6">
                {(fields[step] || []).map((f) => (
                  <div key={f.k}>
                    <label htmlFor={"f-" + f.k} className="block text-sm font-semibold mb-1.5">{f.label}</label>
                    {f.textarea ? (
                      <textarea id={"f-" + f.k} value={(data[step] || {})[f.k] || ""} onChange={(e) => set(f.k, e.target.value)}
                        style={{ ...inputStyle, minHeight: 120, padding: "12px", resize: "vertical" }} />
                    ) : (
                      <input id={"f-" + f.k} type="text" value={(data[step] || {})[f.k] || ""} onChange={(e) => set(f.k, e.target.value)} style={inputStyle} />
                    )}
                    {f.helper ? <p className="mt-1" style={{ fontSize: 13, color: T.textMuted }}>{f.helper}</p> : null}
                  </div>
                ))}
              </div>

              {saveError && (
                <div className="mt-4 rounded-md px-4 py-3 text-sm" style={{ background: "#FCEBEC", color: "#AD343D" }} role="alert">{saveError}</div>
              )}

              <div className="flex items-center gap-3 mt-8 flex-wrap">
                {step > 1 && (
                  <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 rounded-md font-semibold"
                    style={{ background: T.surface, border: "1px solid " + T.border, color: T.textPrimary, height: 48, padding: "0 20px", fontSize: 15, cursor: "pointer" }}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button onClick={saveStep} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md font-semibold text-white disabled:opacity-60"
                  style={{ background: T.accent, height: 48, padding: "0 28px", fontSize: 15, cursor: "pointer", minWidth: 150 }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : step < 4 ? "Save and continue" : "Save and finish"}
                </button>
                {justSaved && !saving && (
                  <span className="inline-flex items-center gap-1 text-sm" style={{ color: "#25613C" }}>
                    <Check className="w-4 h-4" /> Saved
                  </span>
                )}
                <Link href="/dashboard/portal" className="ml-auto text-sm underline" style={{ color: T.textSecondary }}>Save and exit</Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: T.textMuted }}>
          Your progress is saved at every step. Questions? Use the support page.
        </p>
      </div>
    </div>
  );
}
