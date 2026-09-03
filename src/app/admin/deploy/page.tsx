"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Circle, Loader2, ShieldAlert,
  Building2, PackageCheck, Settings2, Rocket, AlertTriangle, Info, X,
  MessageCircle, Headset, Mail, TrendingUp, Repeat, CalendarDays, RotateCcw, Settings2 as SettingsIcon,
} from "lucide-react";

const PRODUCT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle, Headset, Mail, TrendingUp, Repeat, CalendarDays, RotateCcw, SettingsIcon,
};

function ProductIcon({ name, className }: { name: string; className?: string }) {
  const Icon = PRODUCT_ICONS[name] || SettingsIcon;
  return <Icon className={className || "w-4 h-4"} />;
}
import {
  PRODUCT_CATALOG, PRODUCT_CATEGORY_LABELS, PRODUCT_CATEGORY_ORDER, getProduct,
  checkDeploymentReadiness, isDeploymentReady, fmtNgn,
  ProductConfigValue, ProviderStatus, ProductDefinition, ProductField,
  ClientDeployment, loadDeployments, saveDeployment as persistDeployment,
} from "@/lib/products";

type ProviderName = string;

const STEPS = [
  { id: "client", label: "Client", icon: Building2 },
  { id: "systems", label: "Systems", icon: PackageCheck },
  { id: "configure", label: "Configure", icon: Settings2 },
  { id: "review", label: "Deploy", icon: Rocket },
];

const INDUSTRIES = ["Real Estate", "Healthcare", "Education", "Hospitality", "Finance", "Retail & E-commerce", "Logistics", "Professional Services", "Travel", "Other"];

interface WizardState {
  company: string; industry: string; website: string; contact: string; email: string; phone: string; timezone: string; currency: string;
}

const DEFAULT_STATE: WizardState = { company: "", industry: "", website: "", contact: "", email: "", phone: "", timezone: "Africa/Lagos", currency: "NGN" };

/** Demo provider connection panel — REAL connections require credentials. */
const DEMO_PROVIDERS: { name: string; kind: string; required_for: string[] }[] = [
  { name: "Meta (WhatsApp Business Platform)", kind: "whatsapp", required_for: ["prod_wa_lead_response", "prod_follow_up", "prod_ai_receptionist", "prod_ai_sales_agent"] },
  { name: "Voice AI provider (e.g. Vapi)", kind: "voice", required_for: ["prod_ai_receptionist"] },
  { name: "AI model provider (OpenAI/Anthropic/Google)", kind: "ai", required_for: ["prod_ai_receptionist", "prod_ai_sales_agent", "prod_wa_lead_response"] },
  { name: "Calendar (Google/Outlook)", kind: "calendar", required_for: ["prod_ai_receptionist", "prod_booking"] },
  { name: "Email provider (Resend/SendGrid/Postmark)", kind: "email", required_for: ["prod_email_assistant", "prod_follow_up"] },
];

export default function DeployPage() {
  const [stepIdx, setStepIdx] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [configs, setConfigs] = useState<Record<string, ProductConfigValue>>({});
  const [providerStatus, setProviderStatus] = useState<Record<ProviderName, ProviderStatus>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<{ ok: boolean; label?: string; detail?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedError, setSavedError] = useState("");

  const clientFieldsOk = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!state.company.trim()) e.company = "Business name is required";
    if (!state.industry.trim()) e.industry = "Industry is required";
    if (!state.contact.trim()) e.contact = "Contact person is required";
    if (!state.email.trim() || !/^\S+@\S+\.\S+$/.test(state.email)) e.email = "A valid email is required";
    return e;
  };

  const goNext = () => {
    if (stepIdx === 0) {
      const e = clientFieldsOk();
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    if (stepIdx === 1 && selected.size === 0) {
      setErrors({ systems: "Select at least one system to deploy" });
      return;
    }
    if (stepIdx === 2) {
      // allow navigation but the review step will show what's missing
    }
    setErrors({});
    setStepIdx((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setErrors({});
  };

  const setConfig = (productId: string, key: string, value: string | number | boolean | string[]) => {
    setConfigs((prev) => ({ ...prev, [productId]: { ...(prev[productId] || {}), [key]: value } }));
  };

  const selectedProducts = PRODUCT_CATALOG.filter((p) => selected.has(p.id));

  const productReadiness = useMemo(() => {
    const map: Record<string, ReturnType<typeof checkDeploymentReadiness>> = {};
    for (const p of selectedProducts) {
      map[p.id] = checkDeploymentReadiness(p, configs[p.id] || {}, providerStatus);
    }
    return map;
  }, [selectedProducts, configs, providerStatus]);

  const totalSetup = selectedProducts.reduce((s, p) => s + p.pricing.setup_fee, 0);
  const totalMonthly = selectedProducts.reduce((s, p) => s + p.pricing.monthly_fee, 0);
  const needsThirdParty = selectedProducts.some((p) => p.pricing.third_party_required);
  const allReady = selectedProducts.length > 0 && selectedProducts.every((p) => isDeploymentReady(productReadiness[p.id]));

  const [deployments, setDeployments] = useState<Record<string, ClientDeployment>>(typeof window !== "undefined" ? loadDeployments() : {});

  const refreshDeployments = () => {
    if (typeof window === "undefined") return;
    setDeployments(loadDeployments());
  };

  const resumeDraft = (dep: ClientDeployment) => {
    setState({
      company: dep.companyName, industry: "", website: "", contact: dep.clientName,
      email: "", phone: "", timezone: "Africa/Lagos", currency: "NGN",
    });
    setSelected(new Set(Object.keys(dep.products).filter((k) => dep.products[k].selected)));
    const configsNext: Record<string, ProductConfigValue> = {};
    const provNext: Record<string, ProviderStatus> = {};
    for (const [pid, rec] of Object.entries(dep.products)) {
      if (rec.selected) {
        configsNext[pid] = rec.config || {};
        for (const [prov, status] of Object.entries(rec.providerStatus || {})) provNext[prov] = status;
      }
    }
    setConfigs(configsNext);
    setProviderStatus(provNext);
    setStepIdx(3);
    setCreated(null);
    setSavedError("");
  };

  /** Real client creation + real client_automations rows. Provisioning status stays honest: rows are created as "pending", never "live". */
  const saveDeployment = async () => {
    const e = clientFieldsOk();
    if (Object.keys(e).length > 0) { setErrors(e); setStepIdx(0); return; }
    setSaving(true); setSavedError("");
    try {
      const productRecs: ClientDeployment["products"] = {};
      for (const p of selectedProducts) {
        productRecs[p.id] = {
          selected: true,
          config: configs[p.id] || {},
          providerStatus,
          status: isDeploymentReady(productReadiness[p.id]) ? "ready" : "pending_config",
          last_action: "created",
        };
      }
      const dep: ClientDeployment = {
        clientId: "",
        clientName: state.contact,
        companyName: state.company,
        products: productRecs,
        created_at: new Date().toISOString(),
      };

      // 1. Create the real client record via the existing admin API
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: state.company,
          contact_name: state.contact,
          email: state.email,
          phone: state.phone,
          industry: state.industry,
          website: state.website,
          plan_name: `ELION deploy · ${selectedProducts.map((x) => x.short_name).join(" + ")}`,
          onboarding_notes: "Created via guided Deploy Systems flow. Selected: " + selectedProducts.map((x) => x.name).join(", "),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.client) throw new Error(data.error || "Failed to create client");
      dep.clientId = data.client.id as string;

      // 2. Create real client_automations rows (idempotent, status pending)
      const deployRes = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: dep.clientId,
          products: selectedProducts.map((p) => ({
            template_slug: p.template_slug,
            custom_name: p.name,
            config: configs[p.id] || {},
          })),
        }),
      });
      const deployData = await deployRes.json();
      if (!deployRes.ok) throw new Error(deployData.error || "Failed to create automations");
      for (const rec of deployData.automations || []) {
        const product = selectedProducts.find((p) => p.template_slug === rec.template_slug);
        if (product && productRecs[product.id]) {
          productRecs[product.id].automation_id = rec.automation_id;
          productRecs[product.id].last_action = rec.automation_id ? "provisioned_record" : "pending_record";
        }
      }

      // 3. Persist the deployment draft (round-trip record for the admin)
      persistDeployment(dep);
      refreshDeployments();
      const createdCount = deployData.automations?.filter((a: { automation_id: string | null }) => a.automation_id).length || 0;
      setCreated({
        ok: true,
        label: "Client + systems created",
        detail: `${state.company} saved with ${createdCount} automation record${createdCount === 1 ? "" : "s"} in Supabase (status: pending — provisioning gates still apply before anything goes live).`,
      });
      setSaving(false);
    } catch (err) {
      setSavedError(err instanceof Error ? err.message : "Failed to save deployment");
      setSaving(false);
    }
  };

  const activeProviders = DEMO_PROVIDERS.filter((dp) => dp.required_for.some((pid) => selected.has(pid)));

  const renderField = (p: ProductDefinition, key: string) => {
    const groups = p.config_groups;
    let field: ProductField | undefined;
    for (const g of groups) {
      const f = g.fields.find((x) => x.key === key);
      if (f) { field = f; break; }
    }
    if (!field) return null;
    const val = (configs[p.id] || {})[key] as string | number | boolean | string[] | undefined;
    const cls = "w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)]/60 rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/40 transition-colors";
    const isMissing = field.required && (val === undefined || val === "" || (Array.isArray(val) && val.length === 0));

    return (
      <div key={field.key} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">
            {field.label}
            {field.required && <span className="text-[var(--color-accent)] ml-0.5">*</span>}
          </label>
          {field.required && isMissing && <span className="text-[10px] text-amber-400">Required</span>}
        </div>
        {field.type === "text" && <input value={(val as string) || ""} placeholder={field.placeholder} onChange={(e) => setConfig(p.id, field!.key, e.target.value)} className={cls} />}
        {field.type === "textarea" && <textarea value={(val as string) || ""} placeholder={field.placeholder} rows={3} onChange={(e) => setConfig(p.id, field!.key, e.target.value)} className={cls + " resize-none"} />}
        {field.type === "number" && <input type="number" value={(val as number) ?? ""} onChange={(e) => setConfig(p.id, field!.key, Number(e.target.value))} className={cls} />}
        {field.type === "select" && (
          <select value={(val as string) || ""} onChange={(e) => setConfig(p.id, field!.key, e.target.value)} className={cls + " cursor-pointer"}>
            <option value="">Select...</option>
            {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {field.type === "boolean" && (
          <button
            type="button"
            onClick={() => setConfig(p.id, field!.key, val !== true)}
            className={"flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer " + (val === true ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]" : "border-[var(--color-border)]/60 bg-[var(--color-surface)] text-[var(--color-text-muted)]")}
          >
            <span>{val === true ? "Enabled" : "Disabled"}</span>
            <span className={"w-8 h-4.5 rounded-full relative transition-colors " + (val === true ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]")} style={{ height: 18 }}>
              <span className={"absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all " + (val === true ? "left-4" : "left-0.5")} />
            </span>
          </button>
        )}
        {field.type === "multiselect" && (
          <div className="flex flex-wrap gap-1.5">
            {field.options?.map((o) => {
              const arr = (val as string[]) || [];
              const on = arr.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    const next = on ? arr.filter((x) => x !== o) : [...arr, o];
                    setConfig(p.id, field!.key, next);
                  }}
                  className={"px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer " + (on ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "border-[var(--color-border)]/60 bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)]")}
                >
                  {on && <Check className="w-3 h-3 inline mr-1" />}
                  {o}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{field.description}</p>
      </div>
    );
  };

  const renderConfigFor = (p: ProductDefinition) => {
    return (
      <div className="space-y-5">
        {p.config_groups.map((group) => {
          const missingInGroup = group.fields.filter((f) => f.required && !isFieldFilledLocal(f, (configs[p.id] || {})[f.key]));
          return (
            <div key={group.id}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{group.title}</h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{group.description}</p>
                </div>
                {missingInGroup.length > 0 && <span className="text-[10px] px-2 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">{missingInGroup.length} required</span>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {group.fields.map((f) => renderField(p, f.key))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const readinessBadge = (p: ProductDefinition) => {
    const r = productReadiness[p.id];
    if (!r) return null;
    const ready = isDeploymentReady(r);
    const missing = r.missingFields.length;
    const blocked = r.infra.blockers.length;
    if (ready) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"><Check className="w-3 h-3" /> Ready to deploy</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20"><AlertTriangle className="w-3 h-3" /> Needs attention{missing > 0 ? ` · ${missing} config field${missing === 1 ? "" : "s"}` : ""}{blocked > 0 ? ` · ${blocked} infra blocker${blocked === 1 ? "" : "s"}` : ""}</span>;
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back to clients</Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Deploy Automation</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 uppercase tracking-wide">Guided flow</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">Add a client, select the systems they purchased, and ELION only asks for the configuration each system requires.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCurrent = i === stepIdx;
            const isDone = i < stepIdx;
            return (
              <div key={s.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={() => setStepIdx(i)}
                  className={"flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer " + (isCurrent ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : isDone ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400" : "border-[var(--color-border)]/60 bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]")}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-[var(--color-border)]" />}
              </div>
            );
          })}
        </div>

        {created?.ok && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/20 flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Deployment queued</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{created.detail}</p>
            </div>
            <button onClick={() => setCreated(null)} className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Saved deployments (visible at every step) */}
        {Object.keys(deployments).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Deployments in this session</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]/50 text-[var(--color-text-muted)] uppercase tracking-wide">Session draft</span>
            </div>
            <div className="space-y-2">
              {Object.values(deployments).map((dep) => {
                const selected = Object.entries(dep.products).filter(([, r]) => r.selected);
                const total = selected.length;
                const ready = selected.filter(([, r]) => r.status === "ready").length;
                const withRecord = selected.filter(([, r]) => r.automation_id).length;
                return (
                  <div key={dep.clientId || dep.companyName} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{dep.companyName}</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {selected.map(([k]) => getProduct(k)?.short_name).filter(Boolean).join(" · ") || "No systems"}
                      </p>
                      {withRecord > 0 && (
                        <p className="text-[10px] text-emerald-400 mt-1">✓ {withRecord}/{total} automation record{withRecord === 1 ? "" : "s"} created in Supabase (pending)</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={"text-[10px] px-2 py-1 rounded-full border " + (ready === total ? "text-emerald-400 border-emerald-400/25 bg-emerald-400/5" : "text-amber-400 border-amber-400/25 bg-amber-400/5")}>
                        {ready}/{total} ready to provision
                      </span>
                      {dep.clientId ? (
                        <Link href={`/admin/clients/${dep.clientId}`} className="text-[11px] text-[var(--color-accent)] hover:underline">Open client</Link>
                      ) : null}
                      <button onClick={() => resumeDraft(dep)} className="text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline cursor-pointer">Resume</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1 — BASIC CLIENT INFO */}
        {stepIdx === 0 && (
          <div className="space-y-4">
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Basic client information</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">Start with the business. You will select systems next.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Business name <span className="text-[var(--color-accent)]">*</span></label>
                  <input value={state.company} onChange={(e) => setState({ ...state, company: e.target.value })} placeholder="e.g. ABC Realty" className={"w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border focus:outline-none focus:ring-1 transition-colors " + (errors.company ? "border-red-400/50 focus:border-red-400 focus:ring-red-400/30" : "border-[var(--color-border)]/60 focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/40")} />
                  {errors.company && <p className="text-[11px] text-red-400 mt-1">{errors.company}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Industry <span className="text-[var(--color-accent)]">*</span></label>
                  <select value={state.industry} onChange={(e) => setState({ ...state, industry: e.target.value })} className={"w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border cursor-pointer focus:outline-none focus:ring-1 transition-colors " + (errors.industry ? "border-red-400/50" : "border-[var(--color-border)]/60 focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/40")}>
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {errors.industry && <p className="text-[11px] text-red-400 mt-1">{errors.industry}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Website</label>
                  <input value={state.website} onChange={(e) => setState({ ...state, website: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)]/60 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Contact person <span className="text-[var(--color-accent)]">*</span></label>
                  <input value={state.contact} onChange={(e) => setState({ ...state, contact: e.target.value })} placeholder="e.g. John Doe" className={"w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border focus:outline-none focus:ring-1 transition-colors " + (errors.contact ? "border-red-400/50" : "border-[var(--color-border)]/60 focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/40")} />
                  {errors.contact && <p className="text-[11px] text-red-400 mt-1">{errors.contact}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Email <span className="text-[var(--color-accent)]">*</span></label>
                  <input value={state.email} onChange={(e) => setState({ ...state, email: e.target.value })} placeholder="john@business.com" className={"w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border focus:outline-none focus:ring-1 transition-colors " + (errors.email ? "border-red-400/50" : "border-[var(--color-border)]/60 focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/40")} />
                  {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Phone</label>
                  <input value={state.phone} onChange={(e) => setState({ ...state, phone: e.target.value })} placeholder="+234 800 000 0000" className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)]/60 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Timezone</label>
                  <select value={state.timezone} onChange={(e) => setState({ ...state, timezone: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)]/60 cursor-pointer focus:outline-none focus:border-[var(--color-accent)]">
                    <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                    <option value="Africa/Accra">Africa/Accra (GMT)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Currency</label>
                  <select value={state.currency} onChange={(e) => setState({ ...state, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)]/60 cursor-pointer focus:outline-none focus:border-[var(--color-accent)]">
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="KES">KES</option>
                    <option value="GHS">GHS</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[var(--color-text-muted)]">Fields marked <span className="text-[var(--color-accent)]">*</span> are required to create the client record.</p>
              <button onClick={goNext} className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">Continue <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* STEP 2 — SELECT SYSTEMS */}
        {stepIdx === 1 && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">What should ELION deploy for {state.company || "this client"}?</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Selecting a system tells ELION exactly which configuration it needs. Nothing else is asked.</p>
              </div>
              {selected.size > 0 && <span className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20 shrink-0">{selected.size} selected · {fmtNgn(totalSetup)} setup + {fmtNgn(totalMonthly)}/mo ELION fees</span>}
            </div>

            {PRODUCT_CATEGORY_ORDER.map((cat) => {
              const items = PRODUCT_CATALOG.filter((p) => p.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2.5">{PRODUCT_CATEGORY_LABELS[cat]}</p>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map((p) => {
                      const isOn = selected.has(p.id);
                      const isNew = p.kind === "agent" || p.id === "prod_email_assistant";
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className={"text-left p-4 rounded-xl border transition-all cursor-pointer " + (isOn ? "border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06] shadow-[0_0_0_1px_var(--color-accent)]/20" : "border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] hover:border-[var(--color-border)]")}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={"w-8 h-8 rounded-lg flex items-center justify-center " + (isOn ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]" : "bg-[var(--color-surface)] border border-[var(--color-border)]/60 text-[var(--color-text-muted)]")}><ProductIcon name={p.icon} className="w-4 h-4" /></span>
                            <span className={"w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors " + (isOn ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-border)] bg-[var(--color-surface)]")} style={{ width: 18, height: 18 }}>
                              {isOn && <Check className="w-3 h-3 text-white" />}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">{p.name}</h3>
                            {isNew && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] uppercase tracking-wide shrink-0">Agent</span>}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-relaxed line-clamp-2">{p.tagline}</p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--color-text-secondary)] flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]/50">{fmtNgn(p.pricing.setup_fee)} setup</span>
                            <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)]/50">{fmtNgn(p.pricing.monthly_fee)}/mo</span>
                            {p.pricing.third_party_required && <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">+ provider costs</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {errors.systems && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{errors.systems}</p>}
            {needsThirdParty && (
              <div className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-amber-400/20 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">Some selected systems depend on third-party infrastructure (WhatsApp/Meta, voice AI, AI models). Provider charges are <span className="text-[var(--color-text-primary)] font-medium">separate from ELION fees</span> and are shown at the next step.</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button onClick={() => setStepIdx(0)} className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)]/60 hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
              <button onClick={goNext} disabled={selected.size === 0} className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Configure {selected.size > 0 ? `(${selected.size})` : ""} <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* STEP 3 — DYNAMIC CONFIG */}
        {stepIdx === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Configuration</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Only the fields required by the {selectedProducts.length} selected {selectedProducts.length === 1 ? "system" : "systems"} are shown. Required fields are marked.</p>
            </div>

            {selectedProducts.map((p) => {
              const r = productReadiness[p.id];
              const missing = r?.missingFields.length || 0;
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : p.id)} className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[var(--color-surface)]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + (isOpen ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-[var(--color-surface)] border border-[var(--color-border)]/60 text-[var(--color-text-muted)]")}><ProductIcon name={p.icon} className="w-4 h-4" /></span>
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{p.name} <span className="text-[10px] text-[var(--color-text-muted)] font-normal">· {p.version}</span></h3>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{p.config_groups.reduce((s, g) => s + g.fields.length, 0)} config fields · {missing > 0 ? <span className="text-amber-400">{missing} required missing</span> : <span className="text-emerald-400">all required filled</span>}</p>
                      </div>
                    </div>
                    <ChevronDown className={"w-4 h-4 text-[var(--color-text-muted)] transition-transform shrink-0 " + (isOpen ? "rotate-180" : "")} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[var(--color-border)]/40 p-5">
                      {renderConfigFor(p)}
                      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)]/40 pt-4">
                        <p className="text-[11px] text-[var(--color-text-muted)]">{p.config_groups.length} sections · ELION {fmtNgn(p.pricing.setup_fee)} setup + {fmtNgn(p.pricing.monthly_fee)}/mo{p.pricing.third_party_required ? " · third-party costs separate" : ""}</p>
                        {readinessBadge(p)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Provider connections */}
            {activeProviders.length > 0 && (
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Provider connections</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wide">Demo state</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mb-4">Required infrastructure for the selected systems. In production these connect to real accounts with credentials. Toggling here only proves the validation gate works — it never sends real messages.</p>
                <div className="space-y-2">
                  {activeProviders.map((dp) => {
                    const needed = dp.required_for.filter((id) => selected.has(id)).map((id) => getProduct(id)?.short_name).filter(Boolean).join(", ");
                    const status = providerStatus[dp.name] || "not_configured";
                    return (
                      <div key={dp.name} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/40">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--color-text-primary)]">{dp.name}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] truncate">Needed by: {needed}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(["not_configured", "connected"] as ProviderStatus[]).map((s) => (
                            <button key={s} onClick={() => setProviderStatus({ ...providerStatus, [dp.name]: s })}
                              className={"px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer " + (status === s ? (s === "connected" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400" : "border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]") : "border-[var(--color-border)]/40 text-[var(--color-text-muted)] opacity-60 hover:opacity-100")}>
                              {s === "connected" ? "Connected" : "Not configured"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button onClick={() => setStepIdx(1)} className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)]/60 hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
              <button onClick={goNext} className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">Review & deploy <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* STEP 4 — REVIEW & DEPLOY */}
        {stepIdx === 3 && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Deployment readiness</h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">A system can only be activated when its configuration is complete and every required provider is connected.</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div><p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">ELION setup</p><p className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{fmtNgn(totalSetup)}</p></div>
                <div><p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">ELION monthly</p><p className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{fmtNgn(totalMonthly)}</p></div>
              </div>
            </div>

            {/* Client summary */}
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1">Client</p>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{state.company}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">{state.contact} · {state.email}{state.phone ? ` · ${state.phone}` : ""}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{state.industry}{state.website ? ` · ${state.website}` : ""} · {state.timezone} · {state.currency}</p>
                </div>
                <button onClick={() => setStepIdx(0)} className="text-[11px] text-[var(--color-accent)] hover:underline shrink-0 cursor-pointer">Edit client</button>
              </div>
            </div>

            {/* Per-product readiness */}
            {selectedProducts.map((p) => {
              const r = productReadiness[p.id];
              const ready = isDeploymentReady(r);
              return (
                <div key={p.id} className={"rounded-xl border p-5 " + (ready ? "bg-emerald-400/[0.03] border-emerald-400/20" : "bg-[var(--color-surface-raised)] border-[var(--color-border)]/50")}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{p.name}</h3>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{p.tagline}</p>
                    </div>
                    {ready ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25"><ShieldAlert className="w-3.5 h-3.5" /> READY TO ACTIVATE</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25"><AlertTriangle className="w-3.5 h-3.5" /> CANNOT ACTIVATE YET</span>
                    )}
                  </div>

                  {/* What ELION will do */}
                  <div className="mt-4 p-3.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/40">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5">What ELION will do</p>
                    <ol className="space-y-1">
                      {p.plain_english.map((line, i) => (
                        <li key={i} className="flex gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          <span className="text-[var(--color-accent)] shrink-0 mt-0.5">→</span>{line}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Checklist */}
                  <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
                    <CheckRow ok label={`Client · ${state.company}`} />
                    <CheckRow ok label={`Entitlement · ${p.name} selected`} />
                    <CheckRow ok={r.configValid} label="Configuration complete" detail={r.configValid ? undefined : `${r.missingFields.length} required field${r.missingFields.length === 1 ? "" : "s"} missing`} />
                    <CheckRow ok label={`Template · ${p.name} ${p.version}`} />
                    {r.infra.checks.map((c) => (
                      <CheckRow key={c.provider} ok={c.ok} warn={!c.required && !c.ok} label={`${c.provider}`} detail={!c.ok ? (c.required ? "Required · not connected" : "Optional · not configured") : "Connected"} />
                    ))}
                  </div>

                  {!ready && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-400/5 border border-amber-400/15 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        <p className="font-semibold text-amber-400 mb-1">Missing:</p>
                        <ul className="list-disc ml-4 space-y-0.5">
                          {r.missingFields.map((m) => <li key={m.field.key} className="text-[var(--color-text-secondary)]">{m.field.label} <span className="text-[var(--color-text-muted)]">({m.group})</span></li>)}
                          {r.infra.blockers.map((b) => <li key={b}>{b}</li>)}
                        </ul>
                        <button onClick={() => setStepIdx(2)} className="mt-2 text-[var(--color-accent)] hover:underline cursor-pointer">Complete configuration</button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {ready ? (
                      <button onClick={saveDeployment} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                        {saving ? "Creating client..." : `Create client · activate ${p.short_name}`}
                      </button>
                    ) : (
                      <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] text-sm font-semibold border border-[var(--color-border)]/60 cursor-not-allowed">
                        <Rocket className="w-4 h-4" /> Create client · activate {p.short_name}
                      </button>
                    )}
                    <span className="text-[11px] text-[var(--color-text-muted)]">Activation runs: validate → entitlement → template → instance → credentials → provision → health test → live</span>
                  </div>
                </div>
              );
            })}

            {/* Third-party cost transparency */}
            {needsThirdParty && (
              <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Third-party infrastructure costs</h3>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">Provider charges below are <span className="text-[var(--color-text-primary)] font-medium">not ELION fees</span>. They are billed by each provider (directly or via ELION at cost).</p>
                <div className="space-y-2">
                  {selectedProducts.flatMap((p) => p.infrastructure.items.filter((i) => i.required || i.status === "connected" || providerStatus[i.provider]).map((i) => ({ p, i }))).map(({ p, i }, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/40 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-text-primary)]">{i.provider}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{p.short_name} · {i.purpose}{i.usage_based ? " · usage-based" : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[var(--color-text-muted)]">{i.billing_type === "client_pays_directly" ? "Client pays provider" : "ELION bills at cost"}</p>
                        {i.est_recurring_cost_note && <p className="text-[10px] text-[var(--color-text-muted)] italic">{i.est_recurring_cost_note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button onClick={() => setStepIdx(2)} className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)]/60 hover:border-[var(--color-border)] transition-colors cursor-pointer flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[var(--color-text-muted)]">{allReady ? `${selectedProducts.length} system${selectedProducts.length === 1 ? "" : "s"} ready` : "Complete the required items above to activate"}</span>
                <button onClick={saveDeployment} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 inline-flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {saving ? "Creating client..." : "Create client record"}
                </button>
              </div>
            </div>
            {savedError && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{savedError}</p>}
          </div>
        )}
      </main>
    </div>
  );
}

function isFieldFilledLocal(f: ProductField, v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function CheckRow({ ok, warn, label, detail }: { ok: boolean; warn?: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <span className="w-4 h-4 rounded-full bg-emerald-400/15 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-2.5 h-2.5 text-emerald-400" /></span>
      ) : warn ? (
        <span className="w-4 h-4 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 mt-0.5"><Circle className="w-2 h-2 text-[var(--color-text-muted)]" /></span>
      ) : (
        <span className="w-4 h-4 rounded-full bg-amber-400/15 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="w-2.5 h-2.5 text-amber-400" /></span>
      )}
      <div className="min-w-0">
        <p className={"text-xs leading-relaxed " + (ok ? "text-[var(--color-text-secondary)]" : warn ? "text-[var(--color-text-muted)]" : "text-amber-400")}>{label}</p>
        {detail && <p className="text-[10px] text-[var(--color-text-muted)]">{detail}</p>}
      </div>
    </div>
  );
}
