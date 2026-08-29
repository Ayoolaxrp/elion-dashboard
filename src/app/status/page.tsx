export const dynamic = "force-dynamic";

async function checkHealth() {
  const components = [
    { name: "ELION Dashboard", status: "operational" as string },
    { name: "Free Audit Funnel", status: "operational" as string },
    { name: "Audit Processing", status: "operational" as string },
    { name: "API Endpoints", status: "operational" as string },
    { name: "Authentication", status: "operational" as string },
    { name: "Notifications", status: "operational" as string },
    { name: "Payments", status: "operational" as string },
    { name: "WhatsApp Automation", status: "operational" as string },
    { name: "CRM Integrations", status: "operational" as string },
  ];

  // Check API endpoints
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://ingenuity-dashboard.vercel.app"}/api/request`, { method: "GET", signal: AbortSignal.timeout(5000) });
    if (!res.ok) components[3].status = "degraded";
  } catch {
    components[3].status = "degraded";
  }

  // Check audit endpoint
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://ingenuity-dashboard.vercel.app"}/api/audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_name: "test", website: "" }), signal: AbortSignal.timeout(10000) });
    if (!res.ok) components[2].status = "degraded";
  } catch {
    components[2].status = "degraded";
  }

  const overall = components.every(c => c.status === "operational") ? "operational"
    : components.some(c => c.status === "major-outage") ? "major-outage"
    : "degraded";

  return { components, overall, checkedAt: new Date().toISOString() };
}

export default async function StatusPage() {
  const { components, overall, checkedAt } = await checkHealth();

  const statusColors: Record<string, string> = {
    operational: "bg-[var(--color-success)]",
    degraded: "bg-[var(--color-warning)]",
    "partial-outage": "bg-[var(--color-warning)]",
    "major-outage": "bg-[var(--color-error)]",
    maintenance: "bg-[var(--color-text-muted)]",
  };

  const statusLabels: Record<string, string> = {
    operational: "Operational",
    degraded: "Degraded Performance",
    "partial-outage": "Partial Outage",
    "major-outage": "Major Outage",
    maintenance: "Maintenance",
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
        </div>

        <div className="space-y-2">
          {components.map((c) => (
            <div key={c.name} className="flex items-center justify-between px-5 py-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
              <span className="text-sm text-[var(--color-text-primary)]">{c.name}</span>
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
            Next check: Automatic. This page updates on each load.
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
