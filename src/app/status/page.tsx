export const dynamic = "force-dynamic";

async function checkHealth() {
  const components = [
    { name: "ELION Dashboard", status: "operational" as string, note: "" },
    { name: "Free Audit Funnel", status: "operational" as string, note: "" },
    { name: "Audit Processing", status: "operational" as string, note: "" },
    { name: "API Endpoints", status: "operational" as string, note: "" },
    { name: "Authentication", status: "not-configured" as string, note: "No auth provider configured" },
    { name: "Notifications", status: "not-configured" as string, note: "No email/SMS provider configured" },
    { name: "Payments", status: "not-configured" as string, note: "Paystack not connected" },
    { name: "WhatsApp Automation", status: "not-configured" as string, note: "WhatsApp Business API not connected" },
    { name: "CRM Integrations", status: "not-configured" as string, note: "No CRM provider connected" },
  ];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://elion-7o4jevsmg-ayoolamikuns-projects.vercel.app"}/api/request`, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (!res.ok) components[3].status = "degraded";
  } catch {
    components[3].status = "degraded";
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://elion-7o4jevsmg-ayoolamikuns-projects.vercel.app"}/api/audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_name: "healthcheck", website: "" }), signal: AbortSignal.timeout(10000) });
    if (!res.ok) components[2].status = "degraded";
  } catch {
    components[2].status = "degraded";
  }

  const operationalCount = components.filter(c => c.status === "operational").length;
  const configuredCount = components.filter(c => c.status !== "not-configured").length;
  const overall = components.some(c => c.status === "major-outage") ? "major-outage"
    : components.some(c => c.status === "degraded") ? "degraded"
    : "operational";

  return { components, overall, operationalCount, configuredCount, totalComponents: components.length, checkedAt: new Date().toISOString() };
}

export default async function StatusPage() {
  const { components, overall, operationalCount, configuredCount, totalComponents, checkedAt } = await checkHealth();

  const statusColors: Record<string, string> = {
    operational: "bg-[var(--color-success)]",
    degraded: "bg-[var(--color-warning)]",
    "partial-outage": "bg-[var(--color-warning)]",
    "major-outage": "bg-[var(--color-error)]",
    maintenance: "bg-[var(--color-text-muted)]",
    "not-configured": "bg-[var(--color-text-muted)]/40",
  };

  const statusLabels: Record<string, string> = {
    operational: "Operational",
    degraded: "Degraded",
    "partial-outage": "Partial Outage",
    "major-outage": "Outage",
    maintenance: "Maintenance",
    "not-configured": "Not Configured",
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">E</span>
            </div>
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm">ELION</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">System Status</h1>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[overall]}`} />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {overall === "operational" ? "All systems operational" : "Some systems experiencing issues"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            {operationalCount} of {configuredCount} configured systems operational
          </p>
        </div>

        <div className="space-y-2">
          {components.map((c) => (
            <div key={c.name} className="flex items-center justify-between px-5 py-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
              <div>
                <span className="text-sm text-[var(--color-text-primary)]">{c.name}</span>
                {c.note && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{c.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[c.status]}`} />
                <span className="text-xs text-[var(--color-text-muted)]">{statusLabels[c.status]}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)]/30">
          <p className="text-xs text-[var(--color-text-muted)]">
            Last checked: {new Date(checkedAt).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            This page performs live health checks on each load. External monitoring recommended for production.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Past Incidents</h2>
          <p className="text-sm text-[var(--color-text-muted)]">No incidents reported.</p>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Scheduled Maintenance</h2>
          <p className="text-sm text-[var(--color-text-muted)]">No maintenance scheduled.</p>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">Back to ELION</a>
        </div>
      </div>
    </div>
  );
}
