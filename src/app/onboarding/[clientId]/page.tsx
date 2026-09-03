"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Building2, Users, Plug, Settings, FileText, CheckCircle, Loader2, ArrowRight, ArrowLeft, Send, Bot, Headset, Target, ShieldAlert, Sparkles } from "lucide-react";

interface ClientInfo { id: string; company_name: string; contact_name: string; email: string; industry: string; website: string; plan_name: string; onboarding_status: string; }
interface Automation { id: string; status: string; custom_name: string | null; workflow_templates: { name: string; slug: string; category: string | null; description: string | null } | null; }

interface Step { id: number; key: string; title: string; description: string; }
const IC = "w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 focus:border-[var(--color-accent)] transition-colors";
const CHIP_ON = "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30";
const CHIP_OFF = "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] border border-[var(--color-border)]";
function F({ l, r, children, hint }: { l: string; r?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">{l} {r && <span className="text-[var(--color-error)]">*</span>}</label>
      {hint && <p className="text-[11px] text-[var(--color-text-muted)] mb-1.5 -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}
function Chip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${on ? CHIP_ON : CHIP_OFF}`}>{label}</button>
  );
}
function SectionCard({ icon: Icon, title, sub, children }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-[var(--color-accent)]" /></span>
        <div><p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>{sub && <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

const EMPTY_RECEPTIONIST = {
  business_description: "", services: "", pricing_guidance: "", faqs: "", policies: "", location: "",
  opening_hours: "", holiday_hours: "", contact_info: "", personality: "professional",
  capabilities: [] as string[],
  do_not_answer: "", no_invent: true, escalation_triggers: "", human_name: "", human_phone: "", human_email: "",
};
const EMPTY_SALES = {
  services: "", ideal_customer: "", qualifying_questions: "", disqualifying_criteria: "",
  approved_pricing: "", max_discount: "", objections: "", allowed_actions: [] as string[],
  prohibited_claims: "", follow_up_schedule: "", escalation_name: "", escalation_phone: "", escalation_email: "",
};
const RECEPTIONIST_CAPS = ["Answer common questions", "Explain services", "Share pricing (where approved)", "Qualify leads", "Collect customer information", "Book appointments", "Send booking links", "Transfer to a human", "Escalate urgent issues"];
const SALES_ACTIONS = ["Qualify leads", "Recommend a service", "Answer questions", "Follow up with leads", "Book a meeting", "Share approved pricing", "Escalate to a human"];

export default function OnboardingPage() {
  const params = useParams();
  const cid = params.clientId as string;
  const [cl, setCl] = useState<ClientInfo | null>(null);
  const [autos, setAutos] = useState<Automation[]>([]);
  const [ld, setLd] = useState(true);
  const [sub, setSub] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [st, setSt] = useState(1);
  const [f, setF] = useState({
    business_name: "", industry: "", website: "", timezone: "Africa/Lagos",
    primary_contact_name: "", primary_contact_email: "", primary_contact_phone: "", primary_contact_role: "Owner",
    secondary_contact_name: "", secondary_contact_email: "",
    whatsapp_number: "", whatsapp_provider: "", email_smtp: "", calendar_provider: "", calendar_url: "", crm_tool: "",
    working_hours_start: "09:00", working_hours_end: "17:00", working_days: ["mon", "tue", "wed", "thu", "fri"] as string[],
    response_speed: "instant", follow_up_1_hours: 4, follow_up_2_hours: 24, follow_up_3_hours: 72,
    greeting_message: "", team_size: "", current_tools: "", biggest_challenge: "", additional_notes: "",
    agent_receptionist: { ...EMPTY_RECEPTIONIST },
    agent_sales: { ...EMPTY_SALES },
  });
  const [recCaps, setRecCaps] = useState<string[]>([]);
  const [salActs, setSalActs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/onboarding/" + cid).then(r => r.json()).then(d => {
      if (d.client) { setCl(d.client); setAutos(d.automations || []); if (d.client.onboarding_status === "completed") setDone(true); }
      else setErr("Client not found.");
    }).catch(() => setErr("Failed to load.")).finally(() => setLd(false));
  }, [cid]);

  const needsReceptionist = useMemo(() => autos.some((a) => a.workflow_templates?.slug === "ai_receptionist"), [autos]);
  const needsSales = useMemo(() => autos.some((a) => a.workflow_templates?.slug === "ai_sales_agent"), [autos]);

  const steps: Step[] = useMemo(() => {
    const s: Step[] = [
      { id: 1, key: "biz", title: "Business Details", description: "Tell us about your business" },
      { id: 2, key: "team", title: "Your Team", description: "Who will use the automation?" },
      { id: 3, key: "integrations", title: "Integrations", description: "Connect your existing tools" },
      { id: 4, key: "prefs", title: "Preferences", description: "How should we configure things?" },
    ];
    if (needsReceptionist) s.push({ id: s.length + 1, key: "receptionist", title: "Your AI Receptionist", description: "What it should know and be allowed to do" });
    if (needsSales) s.push({ id: s.length + 1, key: "sales", title: "Your AI Sales Agent", description: "How it should qualify and sell" });
    s.push({ id: s.length + 1, key: "review", title: "Review & Submit", description: "Confirm your details" });
    return s;
  }, [needsReceptionist, needsSales]);

  const uf = (k: string, v: string | number | string[]) => setF(p => ({ ...p, [k]: v }));
  const td = (d: string) => setF(p => ({ ...p, working_days: p.working_days.includes(d) ? p.working_days.filter(x => x !== d) : [...p.working_days, d] }));
  const ur = (k: string, v: unknown) => setF(p => ({ ...p, agent_receptionist: { ...p.agent_receptionist, [k]: v } }));
  const us = (k: string, v: unknown) => setF(p => ({ ...p, agent_sales: { ...p.agent_sales, [k]: v } }));

  async function submit() {
    setSub(true); setErr("");
    const payload = {
      ...f,
      agent_receptionist: needsReceptionist ? { ...f.agent_receptionist, capabilities: recCaps, ...(recCaps.includes("Transfer to a human") || recCaps.includes("Escalate urgent issues") ? {} : {}) } : null,
      agent_sales: needsSales ? { ...f.agent_sales, allowed_actions: salActs } : null,
    };
    try {
      const r = await fetch("/api/onboarding/" + cid, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.success) setDone(true); else setErr(d.error || "Failed.");
    } catch { setErr("Network error."); }
    finally { setSub(false); }
  }

  if (ld) return <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" /></div>;
  if (err && !cl) return <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4"><div className="max-w-sm text-center"><Image src="/brand/elion-e-icon.svg" alt="ELION" width={48} height={48} className="mx-auto mb-4" /><h1 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Onboarding</h1><p className="text-sm text-[var(--color-error)]">{err}</p></div></div>;
  if (done) return <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4"><div className="max-w-md text-center"><div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-[var(--color-success)]" /></div><h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-3">Onboarding Complete</h1><p className="text-sm text-[var(--color-text-muted)] mb-6">Thank you. We have received your details and will contact you within 24 hours.</p><div className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-left"><p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">What happens next</p><ol className="space-y-2 text-sm text-[var(--color-text-secondary)]"><li>1. We review your details</li><li>2. We configure your automations</li><li>3. We set up your dashboard</li><li>4. We send login credentials</li></ol></div></div></div>;

  const cur = steps[st - 1];
  const isLast = st === steps.length;
  const canNext = cur?.key === "biz" ? Boolean(f.business_name) : cur?.key === "team" ? Boolean(f.primary_contact_name && f.primary_contact_email) : true;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Image src="/brand/elion-e-icon.svg" alt="ELION" width={24} height={24} /><span className="font-bold text-sm text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>ELION</span></div>
          <span className="text-xs text-[var(--color-text-muted)]">Client Onboarding</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Welcome to ELION</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Hi {cl?.contact_name || "there"}, let us set up your automation. This takes about 5 minutes.</p>
        </div>
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1 min-w-max">
              <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 " + (st > s.id ? "bg-[var(--color-success)]/20 text-[var(--color-success)]" : st === s.id ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]" : "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]")}>
                {st > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
              </div>
              {i < steps.length - 1 && <div className={"flex-1 h-0.5 min-w-3 " + (st > s.id ? "bg-[var(--color-success)]/30" : "bg-[var(--color-border)]")} />}
            </div>
          ))}
        </div>
        <div className="mb-6"><h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{cur?.title}</h2><p className="text-xs text-[var(--color-text-muted)] mt-0.5">{cur?.description}</p></div>

        {err && <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 mb-6"><p className="text-sm text-[var(--color-error)]">{err}</p></div>}

        {cur?.key === "biz" && (
          <div className="space-y-4">
            <F l="Business Name" r><input value={f.business_name} onChange={e => uf("business_name", e.target.value)} className={IC} placeholder="e.g. Premier Realty" /></F>
            <F l="Industry"><select value={f.industry} onChange={e => uf("industry", e.target.value)} className={IC}><option value="">Select industry</option>{["real_estate", "ecommerce", "professional_services", "healthcare", "education", "hospitality", "technology", "finance", "other"].map(i => <option key={i} value={i}>{i.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}</option>)}</select></F>
            <F l="Website"><input value={f.website} onChange={e => uf("website", e.target.value)} className={IC} placeholder="https://yourbusiness.com" /></F>
            <F l="Timezone"><select value={f.timezone} onChange={e => uf("timezone", e.target.value)} className={IC}><option value="Africa/Lagos">WAT</option><option value="Europe/London">GMT</option><option value="America/New_York">ET</option></select></F>
          </div>
        )}

        {cur?.key === "team" && (
          <div className="space-y-4">
            <F l="Full Name" r><input value={f.primary_contact_name} onChange={e => uf("primary_contact_name", e.target.value)} className={IC} placeholder="Your full name" /></F>
            <F l="Email" r><input value={f.primary_contact_email} onChange={e => uf("primary_contact_email", e.target.value)} className={IC} placeholder="you@company.com" type="email" /></F>
            <F l="Phone"><input value={f.primary_contact_phone} onChange={e => uf("primary_contact_phone", e.target.value)} className={IC} placeholder="+234 800 000 0000" /></F>
            <F l="Role"><select value={f.primary_contact_role} onChange={e => uf("primary_contact_role", e.target.value)} className={IC}><option value="Owner">Owner</option><option value="Manager">Manager</option><option value="Director">Director</option></select></F>
          </div>
        )}

        {cur?.key === "integrations" && (
          <div className="space-y-4">
            <F l="WhatsApp"><input value={f.whatsapp_number} onChange={e => uf("whatsapp_number", e.target.value)} className={IC} placeholder="+234 800 000 0000" /></F>
            <F l="Email"><select value={f.email_smtp} onChange={e => uf("email_smtp", e.target.value)} className={IC}><option value="">Not configured</option><option value="gmail">Gmail</option><option value="outlook">Outlook</option><option value="zoho">Zoho</option><option value="other">Other</option></select></F>
            <F l="Calendar"><select value={f.calendar_provider} onChange={e => uf("calendar_provider", e.target.value)} className={IC}><option value="">Not configured</option><option value="google_calendar">Google Calendar</option><option value="calendly">Calendly</option><option value="other">Other</option></select></F>
            <F l="CRM"><select value={f.crm_tool} onChange={e => uf("crm_tool", e.target.value)} className={IC}><option value="">No CRM</option><option value="hubspot">HubSpot</option><option value="google_sheets">Google Sheets</option><option value="other">Other</option></select></F>
          </div>
        )}

        {cur?.key === "prefs" && (
          <div className="space-y-4">
            <F l="Hours"><div className="flex items-center gap-2"><input type="time" value={f.working_hours_start} onChange={e => uf("working_hours_start", e.target.value)} className={IC + " flex-1"} /><span className="text-xs text-[var(--color-text-muted)]">to</span><input type="time" value={f.working_hours_end} onChange={e => uf("working_hours_end", e.target.value)} className={IC + " flex-1"} /></div></F>
            <F l="Days"><div className="flex flex-wrap gap-2">{["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(d => <Chip key={d} on={f.working_days.includes(d)} label={d.slice(0, 3)} onClick={() => td(d)} />)}</div></F>
            <F l="Response"><select value={f.response_speed} onChange={e => uf("response_speed", e.target.value)} className={IC}><option value="instant">Instant</option><option value="fast">Fast</option><option value="business_hours">Business hours</option></select></F>
            <F l="Follow-ups"><div className="space-y-2"><div className="flex items-center gap-2"><span className="text-xs text-[var(--color-text-muted)] w-16">1st</span><select value={f.follow_up_1_hours} onChange={e => uf("follow_up_1_hours", Number(e.target.value))} className={IC + " flex-1"}><option value={1}>1h</option><option value={4}>4h</option><option value={8}>8h</option><option value={24}>24h</option></select></div><div className="flex items-center gap-2"><span className="text-xs text-[var(--color-text-muted)] w-16">2nd</span><select value={f.follow_up_2_hours} onChange={e => uf("follow_up_2_hours", Number(e.target.value))} className={IC + " flex-1"}><option value={24}>24h</option><option value={48}>48h</option><option value={72}>72h</option></select></div><div className="flex items-center gap-2"><span className="text-xs text-[var(--color-text-muted)] w-16">3rd</span><select value={f.follow_up_3_hours} onChange={e => uf("follow_up_3_hours", Number(e.target.value))} className={IC + " flex-1"}><option value={72}>72h</option><option value={168}>7 days</option></select></div></div></F>
            <F l="Greeting"><textarea value={f.greeting_message} onChange={e => uf("greeting_message", e.target.value)} className={IC} rows={2} placeholder="e.g. Thank you for contacting us!" /></F>
          </div>
        )}

        {cur?.key === "receptionist" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/8 p-4 flex gap-3">
              <Headset className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Your AI receptionist answers incoming messages in your voice, captures leads, and hands over to your team when it should. Tell it what it needs to know — and what it must never do.</p>
            </div>
            <SectionCard icon={Building2} title="Business knowledge" sub="What your receptionist knows about your business">
              <F l="Describe your business" r hint="2–3 sentences a customer would understand"><textarea value={f.agent_receptionist.business_description} onChange={e => ur("business_description", e.target.value)} className={IC} rows={2} placeholder="e.g. Premier Realty helps people buy, sell and rent homes in Lagos." /></F>
              <F l="Services / products"><textarea value={f.agent_receptionist.services} onChange={e => ur("services", e.target.value)} className={IC} rows={2} placeholder="One per line, e.g.: Sales listings, Rentals, Property management" /></F>
              <F l="Pricing guidance" hint="Only include figures if the receptionist may share them. Otherwise leave blank — it will say it needs to confirm with your team."><textarea value={f.agent_receptionist.pricing_guidance} onChange={e => ur("pricing_guidance", e.target.value)} className={IC} rows={2} placeholder="e.g. Rentals from ₦1.5m/year. Management fee 8%." /></F>
              <F l="Common questions & answers (FAQs)"><textarea value={f.agent_receptionist.faqs} onChange={e => ur("faqs", e.target.value)} className={IC} rows={3} placeholder="Q: What areas do you cover? A: Lekki, Ikoyi and Victoria Island." /></F>
              <F l="Policies / rules to follow"><textarea value={f.agent_receptionist.policies} onChange={e => ur("policies", e.target.value)} className={IC} rows={2} placeholder="e.g. Viewings require ID verification before confirmation." /></F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F l="Location"><input value={f.agent_receptionist.location} onChange={e => ur("location", e.target.value)} className={IC} placeholder="e.g. 12 Admiralty Way, Lekki" /></F>
                <F l="Opening hours"><input value={f.agent_receptionist.opening_hours} onChange={e => ur("opening_hours", e.target.value)} className={IC} placeholder="e.g. Mon–Sat, 9am–6pm" /></F>
              </div>
            </SectionCard>
            <SectionCard icon={Settings} title="Personality" sub="How it communicates">
              <F l="Tone"><div className="flex flex-wrap gap-2">{[["professional", "Professional"], ["friendly", "Friendly"], ["concise", "Concise"], ["conversational", "Conversational"], ["formal", "Formal"]].map(([v, l]) => <Chip key={v} on={f.agent_receptionist.personality === v} label={l} onClick={() => ur("personality", v)} />)}</div></F>
            </SectionCard>
            <SectionCard icon={Sparkles} title="Capabilities" sub="What it is allowed to do">
              <F l="Tick everything your receptionist may do"><div className="flex flex-wrap gap-2">{RECEPTIONIST_CAPS.map(c => <Chip key={c} on={recCaps.includes(c)} label={c} onClick={() => setRecCaps(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])} />)}</div></F>
            </SectionCard>
            <SectionCard icon={ShieldAlert} title="Guardrails" sub="What it must never do">
              <F l="Topics it must not answer" hint="e.g. legal advice, staff matters, anything confidential"><textarea value={f.agent_receptionist.do_not_answer} onChange={e => ur("do_not_answer", e.target.value)} className={IC} rows={2} placeholder="e.g. Never discuss staff salaries or legal disputes." /></F>
              <F l="Never invent information"><label className="flex items-start gap-2.5 cursor-pointer"><input type="checkbox" checked={f.agent_receptionist.no_invent} onChange={e => ur("no_invent", e.target.checked)} className="mt-0.5 accent-[var(--color-accent)]" /><span className="text-xs text-[var(--color-text-secondary)]">When it does not know something, it must say “I don't have that information, but I can connect you with someone who can help.”</span></label></F>
              <F l="When to escalate" hint="e.g. complaints, high-value leads, anyone asking for a human"><textarea value={f.agent_receptionist.escalation_triggers} onChange={e => ur("escalation_triggers", e.target.value)} className={IC} rows={2} placeholder="e.g. Complaints, pricing negotiations, repeat callers" /></F>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Human handoff contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <F l="Name"><input value={f.agent_receptionist.human_name} onChange={e => ur("human_name", e.target.value)} className={IC} placeholder="e.g. Tunde" /></F>
                <F l="Phone"><input value={f.agent_receptionist.human_phone} onChange={e => ur("human_phone", e.target.value)} className={IC} placeholder="+234…" /></F>
                <F l="Email"><input value={f.agent_receptionist.human_email} onChange={e => ur("human_email", e.target.value)} className={IC} placeholder="team@…" /></F>
              </div>
            </SectionCard>
          </div>
        )}

        {cur?.key === "sales" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/8 p-4 flex gap-3">
              <Target className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Your AI sales agent qualifies new enquiries, recommends the right service, follows up, and only promises what you approve. Fill in the rules it must sell by.</p>
            </div>
            <SectionCard icon={Target} title="Who to sell to" sub="Qualification">
              <F l="Services / products you sell and who each is for"><textarea value={f.agent_sales.services} onChange={e => us("services", e.target.value)} className={IC} rows={3} placeholder="e.g. 2-bedroom apartments — young professionals. Luxury villas — families, 5–10yr horizon." /></F>
              <F l="Your ideal customer"><textarea value={f.agent_sales.ideal_customer} onChange={e => us("ideal_customer", e.target.value)} className={IC} rows={2} placeholder="e.g. First-time buyers in Lagos with ₦50m+ budget, ready to move within 6 months." /></F>
              <F l="Questions it should ask to qualify"><textarea value={f.agent_sales.qualifying_questions} onChange={e => us("qualifying_questions", e.target.value)} className={IC} rows={2} placeholder="e.g. What are you looking for? When do you need it? What is your budget?" /></F>
              <F l="When a lead is NOT a fit (disqualify)"><textarea value={f.agent_sales.disqualifying_criteria} onChange={e => us("disqualifying_criteria", e.target.value)} className={IC} rows={2} placeholder="e.g. Looking to rent under ₦500k/year; outside Lagos" /></F>
            </SectionCard>
            <SectionCard icon={FileText} title="What it may promise" sub="Approved pricing & offers">
              <F l="Approved pricing / offers it may share"><textarea value={f.agent_sales.approved_pricing} onChange={e => us("approved_pricing", e.target.value)} className={IC} rows={2} placeholder="e.g. Standard agency fee 8%. Rentals from ₦1.5m/year." /></F>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <F l="Maximum discount it may offer"><input value={f.agent_sales.max_discount} onChange={e => us("max_discount", e.target.value)} className={IC} placeholder="e.g. 5% or none" /></F>
                <F l="Follow-up schedule"><input value={f.agent_sales.follow_up_schedule} onChange={e => us("follow_up_schedule", e.target.value)} className={IC} placeholder="e.g. 1 day, 3 days, 7 days" /></F>
              </div>
              <F l="Common objections + approved responses"><textarea value={f.agent_sales.objections} onChange={e => us("objections", e.target.value)} className={IC} rows={3} placeholder="e.g. “It's too expensive” → explain payment plans we approve; never offer unapproved discounts." /></F>
            </SectionCard>
            <SectionCard icon={Sparkles} title="Actions" sub="What it may do">
              <F l="Tick everything the sales agent may do"><div className="flex flex-wrap gap-2">{SALES_ACTIONS.map(c => <Chip key={c} on={salActs.includes(c)} label={c} onClick={() => setSalActs(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c])} />)}</div></F>
            </SectionCard>
            <SectionCard icon={ShieldAlert} title="Guardrails" sub="What it must never do">
              <F l="Prohibited claims / promises"><textarea value={f.agent_sales.prohibited_claims} onChange={e => us("prohibited_claims", e.target.value)} className={IC} rows={2} placeholder="e.g. Never guarantee rental income. Never promise discounts above 5%." /></F>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Escalation contact (high-value / uncertain leads)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <F l="Name"><input value={f.agent_sales.escalation_name} onChange={e => us("escalation_name", e.target.value)} className={IC} placeholder="e.g. Ada" /></F>
                <F l="Phone"><input value={f.agent_sales.escalation_phone} onChange={e => us("escalation_phone", e.target.value)} className={IC} placeholder="+234…" /></F>
                <F l="Email"><input value={f.agent_sales.escalation_email} onChange={e => us("escalation_email", e.target.value)} className={IC} placeholder="sales@…" /></F>
              </div>
            </SectionCard>
          </div>
        )}

        {cur?.key === "review" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-[var(--color-text-muted)]">Name:</span> <span className="text-[var(--color-text-secondary)]">{f.business_name || "-"}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Industry:</span> <span className="text-[var(--color-text-secondary)]">{f.industry || "-"}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Contact:</span> <span className="text-[var(--color-text-secondary)]">{f.primary_contact_name || "-"}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Email:</span> <span className="text-[var(--color-text-secondary)]">{f.primary_contact_email || "-"}</span></div>
              </div>
              {(needsReceptionist || needsSales) && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">AI systems being configured</p>
                  <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                    {needsReceptionist && <li className="flex items-center gap-2"><Headset className="w-3.5 h-3.5 text-[var(--color-accent)]" /> AI Receptionist{recCaps.length ? ` · ${recCaps.length} capability${recCaps.length > 1 ? "ies" : "y"} enabled` : ""}</li>}
                    {needsSales && <li className="flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-[var(--color-accent)]" /> AI Sales Agent{salActs.length ? ` · ${salActs.length} action${salActs.length > 1 ? "s" : ""} enabled` : ""}</li>}
                  </ul>
                </div>
              )}
            </div>
            <F l="Notes"><textarea value={f.additional_notes} onChange={e => uf("additional_notes", e.target.value)} className={IC} rows={2} placeholder="Anything else..." /></F>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
          {st > 1 ? <button onClick={() => setSt(st - 1)} className="flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /> Back</button> : <div />}
          {!isLast ? (
            <button onClick={() => setSt(st + 1)} disabled={!canNext} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">Continue <ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={submit} disabled={sub} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
              {sub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{sub ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
