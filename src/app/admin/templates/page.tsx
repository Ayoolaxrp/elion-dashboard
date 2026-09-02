"use client";
import { AUTOMATION_TEMPLATES } from "@/lib/templates";
import { Zap, Users, CheckCircle, AlertCircle } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Automation Templates</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{AUTOMATION_TEMPLATES.length} templates registered</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {AUTOMATION_TEMPLATES.map(t => (
          <div key={t.id} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-accent)]/20 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Version {t.version} · {t.category.replace("_", " ")}</p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-semibold ${t.status === "active" ? "text-emerald-400 bg-emerald-400/10" : "text-gray-400 bg-gray-400/10"}`}>{t.status}</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">{t.description}</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Zap className="w-3 h-3" />
                <span>{t.required_config.length} config fields required</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <CheckCircle className="w-3 h-3" />
                <span>{t.required_integrations.length} integrations needed: {t.required_integrations.join(", ")}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                <Users className="w-3 h-3" />
                <span>{t.clients_using} client{t.clients_using !== 1 ? "s" : ""} using this template</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}