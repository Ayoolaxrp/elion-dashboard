"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Loader2 } from "lucide-react";

interface Lead { id: string; contact_name: string; email: string; company_name: string; industry: string; website: string; phone: string; }
interface Feature { id: string; key: string; name: string; description: string; category: string; }
const STEPS = ["Select Lead", "Select Features", "Configure", "Review"];
const PLAN_OPTIONS = [
  { name: "Starter", price: 100000, features: ["lead_capture","lead_qualification","lead_response","lead_dashboard"] },
  { name: "Growth", price: 350000, features: ["lead_capture","lead_qualification","lead_response","lead_routing","follow_up_initial","follow_up_sequence","booking_scheduling","booking_confirmation","whatsapp_integration","email_integration","lead_dashboard","reporting"] },
  { name: "Scale", price: 750000, features: ["lead_capture","lead_qualification","lead_response","lead_routing","follow_up_initial","follow_up_sequence","lead_recovery","re_engagement","booking_scheduling","booking_confirmation","booking_reminders","booking_rescheduling","whatsapp_integration","email_integration","sms_integration","internal_notifications","crm_sync","task_creation","reporting","lead_dashboard"] },
  { name: "Custom", price: 0, features: [] },
];

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leads").then(r => r.json()).then(d => { setLeads(d?.leads || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (step === 1) { fetch("/api/admin/features").then(r => r.json()).then(d => setFeatures(d.features || [])).catch(() => {}); }
  }, [step]);

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };
  const applyPlan = (planName: string) => {
    setSelectedPlan(planName);
    const plan = PLAN_OPTIONS.find(p => p.name === planName);
    setSelectedFeatures(plan && plan.features.length > 0 ? new Set(plan.features) : new Set());
  };
  const handleSubmit = async () => {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/admin/clients", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: selectedLead?.id || null, company_name: companyName, contact_name: selectedLead?.contact_name || "", email: selectedLead?.email || "", phone: selectedLead?.phone || "", industry, website: selectedLead?.website || "", plan_name: selectedPlan, features: Array.from(selectedFeatures), onboarding_notes: notes }),
      });
      const data = await res.json();
      if (data.client) router.push("/admin/clients/" + data.client.id);
      else { setError(data.error || "Failed to create client"); setSubmitting(false); }
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  };

  if (loading) return (<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to clients</Link>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">New Client</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">Provision a new client from a lead or create directly.</p>
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (<div key={s} className="flex items-center gap-2">
          <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors " + (i < step ? "bg-[var(--color-accent)] text-white" : i === step ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]")}>
            {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={"text-xs hidden sm:inline " + (i === step ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]")}>{s}</span>
          {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-[var(--color-text-muted)]" />}
        </div>))}
      </div>

      {step === 0 && (<div className="space-y-4">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Select a Lead (Optional)</h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Choose an existing lead to convert, or create a client directly.</p>
          {leads.length > 0 ? (<div className="space-y-2">{leads.map(lead => (
            <button key={lead.id} onClick={() => { setSelectedLead(lead); setCompanyName(lead.company_name || ""); setIndustry(lead.industry || ""); }}
              className={"w-full text-left p-3 rounded-lg border transition-colors cursor-pointer " + (selectedLead?.id === lead.id ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-[var(--color-border)]/50 bg-[var(--color-surface)] hover:border-[var(--color-border)]")}>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{lead.contact_name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{lead.company_name} · {lead.email}</p>
            </button>
          ))}</div>) : (<p className="text-xs text-[var(--color-text-muted)]">No leads available.</p>)}
        </div>
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Client Details</h2>
          <div className="space-y-3">
            <div><label className="block text-xs text-[var(--color-text-muted)] mb-1">Company Name *</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)]/50 rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="e.g. Acme Properties" /></div>
            <div><label className="block text-xs text-[var(--color-text-muted)] mb-1">Industry</label>
              <input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)]/50 rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="e.g. Real Estate" /></div>
          </div>
        </div>
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        <button onClick={() => { if (!companyName.trim()) { setError("Company name is required"); return; } setError(""); setStep(1); }} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors cursor-pointer">Continue</button>
      </div>)}

      {step === 1 && (<div className="space-y-4">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Choose Plan</h2>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Select a preset or pick individual features.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {PLAN_OPTIONS.map(plan => (<button key={plan.name} onClick={() => applyPlan(plan.name)}
              className={"p-3 rounded-lg border text-center transition-colors cursor-pointer " + (selectedPlan === plan.name ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "border-[var(--color-border)]/50 bg-[var(--color-surface)] text-[var(--color-text-secondary)]")}>
              <p className="text-sm font-semibold">{plan.name}</p>
              <p className="text-xs mt-1">{plan.price ? "₦" + plan.price.toLocaleString() : "Custom"}</p>
            </button>))}
          </div>
        </div>
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Features ({selectedFeatures.size} selected)</h2>
          {features.length > 0 ? (<div className="space-y-2">{Object.entries(features.reduce((acc: Record<string, Feature[]>, f: Feature) => { if (!acc[f.category]) acc[f.category] = []; acc[f.category].push(f); return acc; }, {} as Record<string, Feature[]>)).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mt-3 mb-1">{cat.replace(/_/g, " ")}</p>
              {items.map(f => (<button key={f.id} onClick={() => toggleFeature(f.key)}
                className={"w-full text-left p-2.5 rounded-lg border mb-1.5 transition-colors cursor-pointer " + (selectedFeatures.has(f.key) ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10" : "border-[var(--color-border)]/50 bg-[var(--color-surface)]")}>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-[var(--color-text-primary)]">{f.name}</p><p className="text-xs text-[var(--color-text-muted)]">{f.description}</p></div>
                  <div className={"w-4 h-4 rounded border flex items-center justify-center shrink-0 " + (selectedFeatures.has(f.key) ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-border)]")}>{selectedFeatures.has(f.key) && <Check className="w-2.5 h-2.5 text-white" />}</div>
                </div>
              </button>))}
            </div>
          ))}</div>) : (<p className="text-xs text-[var(--color-text-muted)]">Loading features...</p>)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep(0)} className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm rounded-lg border border-[var(--color-border)] cursor-pointer">Back</button>
          <button onClick={() => setStep(2)} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg cursor-pointer">Continue</button>
        </div>
      </div>)}

      {step === 2 && (<div className="space-y-4">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Onboarding Notes</h2>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)]/50 rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none" placeholder="Internal notes about client requirements..." />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep(1)} className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm rounded-lg border border-[var(--color-border)] cursor-pointer">Back</button>
          <button onClick={() => setStep(3)} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg cursor-pointer">Continue</button>
        </div>
      </div>)}

      {step === 3 && (<div className="space-y-4">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Review</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-[var(--color-text-muted)]">Company</span><span className="text-[var(--color-text-primary)] font-medium">{companyName}</span></div>
            {selectedLead && <div className="flex justify-between text-sm"><span className="text-[var(--color-text-muted)]">Contact</span><span className="text-[var(--color-text-primary)]">{selectedLead.contact_name} ({selectedLead.email})</span></div>}
            {industry && <div className="flex justify-between text-sm"><span className="text-[var(--color-text-muted)]">Industry</span><span className="text-[var(--color-text-primary)]">{industry}</span></div>}
            <div className="flex justify-between text-sm"><span className="text-[var(--color-text-muted)]">Plan</span><span className="text-[var(--color-text-primary)] font-medium">{selectedPlan || "Custom"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[var(--color-text-muted)]">Features</span><span className="text-[var(--color-text-primary)]">{selectedFeatures.size} selected</span></div>
            {notes && <div><span className="text-xs text-[var(--color-text-muted)]">Notes</span><p className="text-sm text-[var(--color-text-secondary)] mt-1">{notes}</p></div>}
          </div>
        </div>
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        <div className="flex gap-2">
          <button onClick={() => setStep(2)} className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm rounded-lg border border-[var(--color-border)] cursor-pointer">Back</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? "Creating..." : "Create Client"}
          </button>
        </div>
      </div>)}
    </div>
  );
}
