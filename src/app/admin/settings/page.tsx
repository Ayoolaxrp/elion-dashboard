"use client";
import { useState, useEffect } from "react";
import { Settings, Save, Loader2, Check } from "lucide-react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    company_name: "ELION",
    support_email: "awodeyiayoola@gmail.com",
    support_phone: "09126281855",
    whatsapp_number: "",
    n8n_webhook_url: "",
    resend_api_key: "",
    default_timezone: "Africa/Lagos",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { if (d.config) setConfig(d.config); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Platform configuration</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Company</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Company Name</label>
              <input value={config.company_name} onChange={e => setConfig({...config, company_name: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Default Timezone</label>
              <input value={config.default_timezone} onChange={e => setConfig({...config, default_timezone: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Contact</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Support Email</label>
              <input type="email" value={config.support_email} onChange={e => setConfig({...config, support_email: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Support Phone</label>
              <input value={config.support_phone} onChange={e => setConfig({...config, support_phone: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">WhatsApp Number</label>
              <input value={config.whatsapp_number} onChange={e => setConfig({...config, whatsapp_number: e.target.value})} placeholder="+234..." className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Integrations</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">n8n Webhook URL</label>
              <input value={config.n8n_webhook_url} onChange={e => setConfig({...config, n8n_webhook_url: e.target.value})} placeholder="https://your-n8n-instance.com" className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-[var(--color-text-muted)] mb-1">Resend API Key</label>
              <input type="password" value={config.resend_api_key} onChange={e => setConfig({...config, resend_api_key: e.target.value})} placeholder="re_..." className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-mono" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}