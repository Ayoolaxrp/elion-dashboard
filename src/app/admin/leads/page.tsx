export const dynamic = "force-dynamic";

import { getSupabaseAdmin } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  audited: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  contacted: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  qualified: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  proposal: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  payment_pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  implementation: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  lost: "bg-red-500/10 text-red-400 border border-red-500/20",
};

async function getLeads() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { leads: [], error: "Database not configured" };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return { leads: [], error: error.message };
    }

    return { leads: data || [], error: null };
  } catch (err) {
    return { leads: [], error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function LeadsPage() {
  const { leads, error } = await getLeads();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Leads</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {error ? (
                <span className="text-[var(--color-error)]">Error: {error}</span>
              ) : (
                `${leads.length} total leads`
              )}
            </p>
          </div>
          <a
            href="/"
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            Back to Dashboard
          </a>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)]">No leads yet.</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Leads will appear here when funnel submissions are received.
            </p>
            {!process.env.SUPABASE_URL && (
              <p className="text-xs text-[var(--color-warning)] mt-4">
                Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead: Record<string, string | null>) => (
              <div
                key={lead.id as string}
                className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 hover:border-[var(--color-accent)]/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {lead.contact_name || ""}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{lead.email || ""}</p>
                    {lead.phone && (
                      <p className="text-xs text-[var(--color-text-muted)]">{lead.phone || ""}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                        STATUS_COLORS[lead.lead_status || "new"] ||
                        "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {(lead.lead_status || "new").replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                  {lead.company_name && lead.company_name !== "Not specified" && (
                    <span>Company: {lead.company_name || ""}</span>
                  )}
                  {lead.website && <span>Website: {lead.website || ""}</span>}
                  {lead.primary_problem && <span>Problem: {lead.primary_problem || ""}</span>}
                  {lead.industry && <span>Industry: {lead.industry || ""}</span>}
                  {lead.source && <span>Source: {lead.source || ""}</span>}
                </div>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
                  <span>
                    Created:{" "}
                    {new Date(lead.created_at as string).toLocaleString("en-NG", {
                      timeZone: "Africa/Lagos",
                    })}{" "}
                    WAT
                  </span>
                  {lead.n8n_status && lead.n8n_status !== "not_sent" && (
                    <span className={lead.n8n_status === "sent" ? "text-emerald-400" : "text-red-400"}>
                      n8n: {lead.n8n_status || ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
