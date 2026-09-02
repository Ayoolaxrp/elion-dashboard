"use client";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import Link from "next/link";
import { ArrowLeft, Save, Eye, RotateCcw, Loader2, CheckCircle, FileText, Shield, CreditCard, Mail, Settings, Handshake } from "lucide-react";

const DOC_TYPES = [
  { key: "proposal", label: "Proposal", icon: FileText, color: "#3B66E8" },
  { key: "contract", label: "Contract", icon: Shield, color: "#8B5CF6" },
  { key: "invoice", label: "Invoice", icon: CreditCard, color: "#F59E0B" },
  { key: "welcome", label: "Welcome Doc", icon: Mail, color: "#10B981" },
  { key: "portal", label: "Client Portal", icon: Settings, color: "#00D4FF" },
  { key: "thankyou", label: "Thank You", icon: Handshake, color: "#10B981" },
];

const DEFAULTS: Record<string, Record<string, string | boolean>> = {
  proposal: { subject: "Automation Implementation Proposal for {{company_name}}", greeting: "Hi {{contact_name}},", body: "Thank you for your interest in ELION. Based on our assessment of {{company_name}}, we have prepared the following proposal.", overview: "ELION will implement automation systems for {{company_name}} to address operational inefficiencies.", scope: "Systems: {{#each automations}}{{this}}, {{/each}}", timeline: "Kickoff within 48 hours. Completed in 2-4 weeks.", investment: "Total: N{{total_amount}}. One-time setup.", closing: "We look forward to working with you.", signature_name: "Ayoolamikun", signature_title: "ELION" },
  contract: { subject: "Service Agreement - ELION x {{company_name}}", body: "Between ELION (Provider) and {{contact_name}} / {{company_name}} (Client).", scope: "Implement automation systems as described in Proposal.", timeline: "Commences within 48 hours of execution and payment.", payment: "Total: N{{total_amount}}. Due before implementation.", ownership: "Client owns configurations and data.", support: "30 days post-launch support included.", confidentiality: "Both parties maintain confidentiality.", signature_required: true },
  invoice: { subject: "Invoice {{invoice_number}} - ELION", body: "Please find your invoice below.", total_label: "Total", due_label: "Due Date", payment_note: "Payment required before implementation.", payment_methods: "Bank Transfer, Card Payment" },
  welcome: { subject: "Welcome to ELION, {{contact_name}}", greeting: "Hi {{contact_name}},", body: "Welcome to ELION. We are officially getting started.", step_1: "Kickoff call", step_2: "Workflow discovery", step_3: "System build", step_4: "Testing", step_5: "Go live", closing: "Welcome to ELION. Let us build.", signature_name: "Ayoolamikun", signature_title: "ELION" },
  thankyou: { subject: "Your ELION Systems Are Live, {{contact_name}}", greeting: "Hi {{contact_name}},", body: "Your automation has been completed and is ready for use.", closing: "Thank you for trusting ELION.", signature_name: "Ayoolamikun", signature_title: "ELION" },
  portal: { subject: "Your ELION Client Portal", body: "View documents, track progress, and monitor systems.", dashboard_link_text: "Go to Dashboard" },
};

const VARIABLES: Record<string, string[]> = { proposal: ["company_name", "contact_name", "total_amount", "automations"], contract: ["company_name", "contact_name", "total_amount"], invoice: ["invoice_number", "company_name", "total_amount", "due_date"], welcome: ["company_name", "contact_name", "automations"], thankyou: ["company_name", "contact_name"], portal: [] };

export default function TemplateEditorPage() {
  const [sel, setSel] = useState("proposal");
  const [tpl, setTpl] = useState<Record<string, string | boolean>>(DEFAULTS.proposal);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, val: string | boolean) => setTpl({ ...tpl, [key]: val });
  const reset = () => { setTpl(DEFAULTS[sel]); setSaved(false); };
  const save = async () => { setSaving(true); await new Promise(r => setTimeout(r, 800)); setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Icon = DOC_TYPES.find(d => d.key === sel)?.icon || FileText;
  const color = DOC_TYPES.find(d => d.key === sel)?.color || "#3B66E8";

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Template Editor</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">Customize the 6 onboarding documents. Variables auto-fill from client data.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="px-4 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Documents</h3>
                <div className="space-y-1">
                  {DOC_TYPES.map((d, i) => {
                    const DI = d.icon;
                    return (
                      <button key={d.key} onClick={() => { setSel(d.key); setTpl(DEFAULTS[d.key]); setShowPreview(false); }}
                        className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " + (sel === d.key ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-white")}>
                        <DI className="w-4 h-4 shrink-0" style={{ color: sel === d.key ? d.color : undefined }} />
                        <span>{d.label}</span>
                        <span className="ml-auto text-xs text-[var(--color-text-muted)]">#{i + 1}</span>
                      </button>
                    );
                  })}
                </div>
                {VARIABLES[sel]?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Variables</h4>
                    <div className="space-y-1">
                      {VARIABLES[sel].map(v => (
                        <code key={v} className="block text-xs text-[var(--color-accent)] font-mono">{"{{" + v + "}}"}</code>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">Auto-filled from client data.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
                      {DOC_TYPES.find(d => d.key === sel)?.label} Template
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">Edit fields. Variables replaced on generation.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(tpl).map(([key, val]) => {
                    if (typeof val === "string") {
                      return (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
                            {key.replace(/_/g, " ")}
                          </label>
                          {val.length > 100 ? (
                            <textarea value={val} onChange={e => update(key, e.target.value)} rows={4}
                              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] font-mono resize-y focus:outline-none focus:border-[var(--color-accent)]" />
                          ) : (
                            <input type="text" value={val} onChange={e => update(key, e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] font-mono focus:outline-none focus:border-[var(--color-accent)]" />
                          )}
                        </div>
                      );
                    }
                    if (typeof val === "boolean") {
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                            {key.replace(/_/g, " ")}
                          </label>
                          <button onClick={() => update(key, !val)}
                            className={"w-10 h-5 rounded-full transition-colors " + (val ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]")}>
                            <div className={"w-4 h-4 rounded-full bg-white transition-transform " + (val ? "translate-x-5" : "translate-x-0.5")} />
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                  <button onClick={() => setShowPreview(!showPreview)} className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {showPreview ? "Hide" : "Show"} Preview
                  </button>
                  {showPreview && (
                    <div className="mt-4 p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <p className="text-xs text-[var(--color-text-muted)] mb-3 italic">Preview:</p>
                      <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                        {JSON.stringify(tpl, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
