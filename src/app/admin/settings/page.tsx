"use client";
import { useState, useEffect, useCallback } from "react";
import { Settings, Save, Loader2, Check, ShieldCheck, KeyRound, Users } from "lucide-react";

type Config = {
  company_name: string;
  support_email: string;
  support_phone: string;
  whatsapp_number: string;
  default_timezone: string;
};

type AdminEntry = { user_id: string; email: string; role: string; added_at: string; added_by: string | null };

const inputCls = "w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm";
const cardCls = "p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]";
const labelCls = "block text-xs text-[var(--color-text-muted)] mb-1";

export default function SettingsPage() {
  const [tab, setTab] = useState<"system" | "admins" | "account">("system");
  return (
    <div className="max-w-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Platform configuration, admins and your account</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {([["system", "System", Settings], ["admins", "Admins", Users], ["account", "My Account", KeyRound]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "system" && <SystemTab />}
      {tab === "admins" && <AdminsTab />}
      {tab === "account" && <AccountTab />}
    </div>
  );
}

function SystemTab() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<Config>({
    company_name: "ELION",
    support_email: "",
    support_phone: "",
    whatsapp_number: "",
    default_timezone: "Africa/Lagos",
  });

  useEffect(() => {
    fetch("/api/admin/settings?section=config")
      .then((r) => r.json())
      .then((d) => { if (d.config) setConfig(d.config); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    const res = await fetch("/api/admin/settings?section=config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { setError(data.error || "Save failed"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Company</h2>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Company Name</label>
            <input value={config.company_name} onChange={(e) => setConfig({ ...config, company_name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Default Timezone</label>
            <input value={config.default_timezone} onChange={(e) => setConfig({ ...config, default_timezone: e.target.value })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Contact</h2>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Support Email</label>
            <input type="email" value={config.support_email} onChange={(e) => setConfig({ ...config, support_email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Support Phone</label>
            <input value={config.support_phone} onChange={(e) => setConfig({ ...config, support_phone: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp Number</label>
            <input value={config.whatsapp_number} onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved" : "Save"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function AdminsTab() {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [envAdmins, setEnvAdmins] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/settings?section=admins")
      .then((r) => r.json())
      .then((d) => {
        if (d.admins) setAdmins(d.admins);
        if (d.envAdmins) setEnvAdmins(d.envAdmins);
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const act = async (action: string, targetEmail?: string) => {
    setBusy(true); setError(""); setMessage("");
    const res = await fetch("/api/admin/settings?section=admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, email: targetEmail ?? email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Action failed"); return; }
    if (data.temporaryPassword) {
      setMessage(`Admin created. Temporary password (shown once): ${data.temporaryPassword}`);
    } else {
      setMessage(`Done: ${action}`);
    }
    setEmail("");
    load();
  };

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">Admin access</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Admins can sign in at /login and manage leads, clients, payments and settings. Changes take effect within one minute, no redeploy needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <input
            type="email"
            placeholder="existing-user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls + " flex-1"}
          />
          <button onClick={() => act("grant")} disabled={busy || !email} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap">
            Grant Admin
          </button>
          <button onClick={() => act("revoke")} disabled={busy || !email} className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-semibold disabled:opacity-50 whitespace-nowrap">
            Revoke
          </button>
        </div>
        <button onClick={() => act("create")} disabled={busy || !email} className="text-xs text-[var(--color-text-muted)] underline hover:text-[var(--color-text-primary)] disabled:opacity-50">
          User does not exist yet? Create a new admin user with a temporary password
        </button>
        {busy && <Loader2 className="w-4 h-4 animate-spin mt-2" />}
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        {message && <p className="text-sm text-green-400 mt-3 break-all">{message}</p>}
      </div>

      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Current admins</h2>
        <div className="space-y-2">
          {admins.map((a) => (
            <div key={a.user_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div>
                <p className="text-sm">{a.email}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{a.role} · added {new Date(a.added_at).toLocaleDateString()}</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
          ))}
          {envAdmins.map((e) => (
            <div key={e} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] opacity-70">
              <div>
                <p className="text-sm">{e}</p>
                <p className="text-xs text-[var(--color-text-muted)]">bootstrap owner (env)</p>
              </div>
              <ShieldCheck className="w-4 h-4" />
            </div>
          ))}
          {admins.length === 0 && envAdmins.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">No admins listed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountTab() {
  const [emailBusy, setEmailBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changeEmail = async () => {
    setEmailBusy(true); setError(""); setMessage("");
    const res = await fetch("/api/admin/settings?section=account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_email", newEmail }),
    });
    const data = await res.json().catch(() => ({}));
    setEmailBusy(false);
    if (!res.ok) { setError(data.error || "Change failed"); return; }
    setMessage(`Email updated to ${data.newEmail}. Use the new email at next sign-in. Admin access was kept.`);
    setNewEmail("");
  };

  const changePassword = async () => {
    setPwBusy(true); setError(""); setMessage("");
    if (newPassword !== confirmPassword) {
      setPwBusy(false); setError("New passwords do not match."); return;
    }
    const res = await fetch("/api/admin/settings?section=account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_password", currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setPwBusy(false);
    if (!res.ok) { setError(data.error || "Change failed"); return; }
    setMessage("Password changed. Use the new password at next sign-in.");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Change sign-in email</h2>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>New email</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} placeholder="you@newdomain.com" />
          </div>
          <button onClick={changeEmail} disabled={emailBusy || !newEmail} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
            {emailBusy && <Loader2 className="w-4 h-4 animate-spin" />} Update Email
          </button>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Change password</h2>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Current password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
          </div>
          <div>
            <label className={labelCls}>New password (min 10 characters)</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
          </div>
          <button onClick={changePassword} disabled={pwBusy || !currentPassword || newPassword.length < 10} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
            {pwBusy && <Loader2 className="w-4 h-4 animate-spin" />} Change Password
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}
    </div>
  );
}
