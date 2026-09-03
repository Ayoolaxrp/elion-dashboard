"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Circle, Clock, ArrowLeft, Loader2, Shield, Mail, Settings, Handshake, FileText, CreditCard } from "lucide-react";

const STAGES = [
  { key: "proposal", label: "Proposal", desc: "Your scope, deliverables, and pricing are ready for review.", icon: FileText },
  { key: "contract", label: "Contract", desc: "Sign the agreement to get started.", icon: Shield },
  { key: "invoice", label: "Invoice", desc: "Complete payment to begin implementation.", icon: CreditCard },
  { key: "welcome", label: "Welcome", desc: "Welcome to ELION. We are getting started.", icon: Mail },
  { key: "portal", label: "Client Portal", desc: "Your automations are being configured and built.", icon: Settings },
  { key: "thankyou", label: "Thank You", desc: "Your systems are live. Here is everything you need.", icon: Handshake },
];

export default function OnboardingProgress() {
  const [data, setData] = useState<any>(null);
  const [ld, setLd] = useState(true);

  useEffect(() => {
    fetch("/api/client/onboarding").then(r => r.json()).then(d => { setData(d); setLd(false); }).catch(() => setLd(false));
  }, []);

  if (ld) return <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#3B66E8] animate-spin" /></div>;
  if (!data || !data.pipeline) return <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-4"><div className="max-w-md text-center"><Image src="/brand/elion-e-icon.svg" alt="ELION" width={48} height={48} className="mx-auto mb-4" /><h1 className="text-lg font-bold text-white mb-2">No Onboarding Found</h1><p className="text-sm text-[#7C8494] mb-4">Your onboarding has not started yet. We will be in touch soon.</p><Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B66E8] text-white text-sm font-semibold">Back to Dashboard</Link></div></div>;

  const { client, pipeline, automations } = data;
  const si = STAGES.findIndex(s => s.key === pipeline.current_stage);
  const isComplete = pipeline.current_stage === "handover" && si === STAGES.length - 1;

  return (
    <div className="min-h-screen bg-[#0A0D14]">
      <header className="border-b border-[#1F2937] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Dashboard</span>
          </Link>
          <Image src="/brand/elion-e-icon.svg" alt="ELION" width={24} height={24} />
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#3B66E8] uppercase tracking-wider mb-2">Your Onboarding</p>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{client.company_name}</h1>
          <p className="text-sm text-[#7C8494]">Hi {client.contact_name}, here is your implementation progress.</p>
        </div>

        {isComplete ? (
          <div className="mb-8 p-6 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30">
            <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-[#10B981]" /><h2 className="text-lg font-bold text-[#10B981]">Onboarding Complete</h2></div>
            <p className="text-sm text-[#9CA3AF]">Your ELION automation systems are live and operational. Check your dashboard for results.</p>
          </div>
        ) : (
          <div className="mb-8 p-6 rounded-xl bg-[#3B66E8]/10 border border-[#3B66E8]/30">
            <div className="flex items-center gap-3 mb-2"><Clock className="w-6 h-6 text-[#3B66E8]" /><h2 className="text-lg font-bold text-[#3B66E8]">Stage {si + 1} of {STAGES.length}</h2></div>
            <p className="text-sm text-[#9CA3AF]">Currently: {STAGES[si].label} � {STAGES[si].desc}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex gap-1 mb-6">
            {STAGES.map((s, i) => <div key={s.key} className={"h-2 flex-1 rounded-full transition-all " + (i < si ? "bg-[#10B981]" : i === si ? "bg-[#3B66E8]" : "bg-[#1F2937]")} />)}
          </div>
          <div className="space-y-0">
            {STAGES.map((s, i) => {
              const isDone = i < si;
              const isCurrent = i === si;
              const isFuture = i > si;
              const Icon = s.icon;
              const completedAt = pipeline[s.key + "_completed_at"];
              return (
                <div key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center shrink-0 " + (isDone ? "bg-[#10B981]/20" : isCurrent ? "bg-[#3B66E8]/20" : "bg-[#11161F]")}>
                      {isDone ? <CheckCircle className="w-5 h-5 text-[#10B981]" /> : isCurrent ? <Icon className="w-5 h-5 text-[#3B66E8]" /> : <Circle className="w-5 h-5 text-[#1F2937]" />}
                    </div>
                    {i < STAGES.length - 1 && <div className={"w-0.5 flex-1 my-1 " + (isDone ? "bg-[#10B981]/30" : "bg-[#1F2937]")} />}
                  </div>
                  <div className="pb-6 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={"text-sm font-semibold " + (isFuture ? "text-[#7C8494]" : "text-white")}>{s.label}</h3>
                      {isDone && <span className="text-xs text-[#10B981]">Done</span>}
                      {isCurrent && <span className="text-xs text-[#3B66E8] font-medium">In Progress</span>}
                    </div>
                    <p className={"text-xs " + (isFuture ? "text-[#4B5563]" : "text-[#9CA3AF]")}>{s.desc}</p>
                    {completedAt && <p className="text-xs text-[#7C8494] mt-1">Completed {new Date(completedAt).toLocaleDateString()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {automations.length > 0 && (
          <div className="mt-8 p-6 rounded-xl border border-[#1F2937] bg-[#11161F]">
            <h3 className="text-xs font-semibold text-[#7C8494] uppercase tracking-wider mb-4">Your Automations</h3>
            <div className="space-y-3">
              {automations.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0A0D14] border border-[#1F2937]">
                  <div>
                    <p className="text-sm font-medium text-white">{a.custom_name}</p>
                    <p className="text-xs text-[#7C8494]">{a.workflow_templates ? a.workflow_templates.category : "automation"}</p>
                  </div>
                  <span className={"px-2 py-0.5 rounded text-xs font-medium " + (a.status === "live" ? "bg-[#10B981]/20 text-[#10B981]" : a.status === "pending" ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#3B66E8]/20 text-[#3B66E8]")}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        
        {/* 6-Document System */}
        <div className="mt-8 p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Your Onboarding Documents</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">Six documents. That is the whole system. Each one is generated from your information.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: "proposal", label: "Proposal", icon: "FileText", color: "#3B66E8" },
              { key: "contract", label: "Contract", icon: "Shield", color: "#8B5CF6" },
              { key: "invoice", label: "Invoice", icon: "CreditCard", color: "#F59E0B" },
              { key: "welcome", label: "Welcome Doc", icon: "Mail", color: "#10B981" },
              { key: "portal", label: "Client Portal", icon: "Settings", color: "#00D4FF" },
              { key: "thankyou", label: "Thank You", icon: "Handshake", color: "#10B981" },
            ].map((doc, i) => {
              const stageIdx = STAGES.findIndex(s => s.key === doc.key);
              const isComplete = stageIdx >= 0 && stageIdx < si;
              const isCurrent = stageIdx === si;
              return (
                <a key={doc.key} href={`/dashboard/documents/${doc.key}`} className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${isCurrent ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5" : isComplete ? "border-emerald-500/20 bg-emerald-500/5" : "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isComplete ? "#10B981" : isCurrent ? doc.color : "#1F2937" }} />
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">{i + 1}/6</span>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{doc.label}</p>
                  {isComplete && <p className="text-xs text-emerald-400 mt-1">Complete</p>}
                  {isCurrent && <p className="text-xs text-[var(--color-accent)] mt-1">Current</p>}
                </a>
              );
            })}
          </div>
        </div>

        {!isComplete && (
          <div className="mt-8 text-center">
            <p className="text-xs text-[#7C8494] mb-3">Questions about your implementation?</p>
            <a href="https://wa.me/2349126281855" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20BA5A] transition-colors">Chat on WhatsApp</a>
          </div>
        )}
      </div>
    </div>
  );
}
