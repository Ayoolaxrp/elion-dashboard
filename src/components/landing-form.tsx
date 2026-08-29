"use client";

import React, { useState } from "react";
import { submitForm, FormResult } from "@/lib/api";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

interface Field {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
  pattern?: string;
  patternError?: string;
  minLength?: number;
}

interface LandingFormProps {
  webhookPath: string;
  fields: Field[];
  submitLabel?: string;
  className?: string;
}

export function LandingForm({
  webhookPath,
  fields,
  submitLabel = "Get Started",
  className = "",
}: LandingFormProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [result, setResult] = useState<FormResult | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !form[f.name]?.trim()) {
        errs[f.name] = `${f.label} is required`;
      } else if (f.pattern && form[f.name] && !new RegExp(f.pattern).test(form[f.name])) {
        errs[f.name] = f.patternError || `${f.label} is invalid`;
      } else if (f.minLength && form[f.name] && form[f.name].length < f.minLength) {
        errs[f.name] = `${f.label} must be at least ${f.minLength} characters`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    setErrors({});

    const payload: Record<string, string> = {};
    for (const f of fields) {
      payload[f.name] = form[f.name] || "";
    }

    const res = await submitForm(webhookPath, payload);
    setResult(res);
    setStatus(res.success ? "success" : "error");

    if (res.success) {
      setForm({});
    }
  };

  const isValid = fields
    .filter((f) => f.required)
    .every((f) => form[f.name]?.trim());

  if (status === "success") {
    return (
      <div className={`bg-[var(--color-success)]/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-3 ${className}`}>
        <CheckCircle2 className="w-10 h-10 text-[var(--color-success)] mx-auto" />
        <h4 className="font-medium text-[var(--color-success)]">Submitted successfully!</h4>
        <p className="text-sm text-[var(--color-text-muted)]">
          {String(result?.data?.message || "We will be in touch within 24 hours.")}
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <input
            type={f.type}
            name={f.name}
            placeholder={f.placeholder}
            value={form[f.name] || ""}
            onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
            required={f.required}
            className={`w-full px-4 py-3 bg-[var(--color-surface)]/80 border rounded-lg text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors ${
              errors[f.name] ? "border-[var(--color-error)]/40" : "border-[var(--color-border)]"
            }`}
          />
          {errors[f.name] && (
            <p className="text-xs text-[var(--color-error)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors[f.name]}
            </p>
          )}
        </div>
      ))}

      {status === "error" && (
        <div className="bg-[var(--color-error)]/100/10 border border-[var(--color-error)]/20 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0" />
          <p className="text-xs text-[var(--color-error)]">
            {result?.error || "Something went wrong. Please try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !isValid}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {status === "loading" ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {submitLabel}
          </>
        )}
      </button>
    </form>
  );
}
