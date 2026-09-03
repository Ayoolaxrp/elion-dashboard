export const dynamic = "force-dynamic";

import Image from "next/image";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return false;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    return ADMIN_EMAILS.length > 0 && user.email != null && ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch { return false; }
}

async function getStatusComponents() {
  const defaults = [
    { component_name: "Web Application", status: "operational", note: "", is_visible: true },
    { component_name: "Free Audit Funnel", status: "operational", note: "", is_visible: true },
    { component_name: "Audit Processing", status: "operational", note: "", is_visible: true },
    { component_name: "API Endpoints", status: "operational", note: "", is_visible: true },
  ];

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return defaults;

  try {
    const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: { getAll: () => [], setAll: () => {} },
    });

    const { data } = await supabase.from("system_status").select("*").eq("is_visible", true).order("sort_order", { ascending: true });
    if (!data || data.length === 0) return defaults;
    return data;
  } catch { return defaults; }
}

async function getIncidents() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const { data } = await supabase.from("incidents").select("*").order("created_at", { ascending: false }).limit(5);
    return data || [];
  } catch { return []; }
}

const SC: Record<string, string> = { operational: "bg-emerald-500", degraded: "bg-amber-500", "partial-outage": "bg-amber-500", "major-outage": "bg-red-500", maintenance: "bg-zinc-500", "not-configured": "bg-zinc-600" };
const SL: Record<string, string> = { operational: "Operational", degraded: "Degraded", "partial-outage": "Partial Outage", "major-outage": "Outage", maintenance: "Maintenance", "not-configured": "Not Configured" };

export default async function StatusPage() {
  const admin = await isAdmin();
  const [components, incidents] = await Promise.all([getStatusComponents(), getIncidents()]);
  const overall = components.some((c) => c.status === "major-outage") ? "major-outage" : components.some((c) => c.status === "degraded" || c.status === "partial-outage") ? "degraded" : "operational";
  const operationalCount = components.filter((c) => c.status === "operational").length;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <Image src="/brand/elion-e-icon.svg" alt="ELION" width={24} height={24} priority />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm">ELION</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">System Status</h1>
          <div className="flex items-center gap-3">
            <div className={"w-2.5 h-2.5 rounded-full " + SC[overall]} />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {overall === "operational" ? "All systems operational" : "Some systems experiencing issues"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">{operationalCount} of {components.length} services operational</p>
        </div>

        <div className="space-y-2">
          {components.map((c) => (
            <div key={c.component_name} className="flex items-center justify-between px-5 py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <div>
                <span className="text-sm text-[var(--color-text-primary)]">{c.component_name}</span>
                {admin && c.note && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{c.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className={"w-2 h-2 rounded-full " + SC[c.status]} />
                <span className="text-xs text-[var(--color-text-muted)]">{SL[c.status]}</span>
              </div>
            </div>
          ))}
        </div>

        {admin && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
            <a href="/admin/status" className="text-xs text-[var(--color-accent)] hover:underline font-medium">Manage Status Components</a>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">Last checked: {new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT</p>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Past Incidents</h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No incidents reported.</p>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={"px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider " + (inc.status === "resolved" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>{inc.status}</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{inc.title}</span>
                  </div>
                  {inc.message && <p className="text-xs text-[var(--color-text-muted)] mt-1">{inc.message}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">Back to ELION</a>
        </div>
      </div>
    </div>
  );
}
