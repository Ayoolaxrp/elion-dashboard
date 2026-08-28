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
      <div className={`bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center space-y-3 ${className}`}>
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
        <h4 className="font-medium text-emerald-400">Submitted successfully!</h4>
        <p className="text-sm text-zinc-400">
          {String(result?.data?.message || "We will be in touch within 24 hours.")}
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
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
            className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors ${
              errors[f.name] ? "border-red-500/50" : "border-zinc-700/50"
            }`}
          />
          {errors[f.name] && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors[f.name]}
            </p>
          )}
        </div>
      ))}

      {status === "error" && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">
            {result?.error || "Something went wrong. Please try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !isValid}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
