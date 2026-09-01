export const dynamic = "force-dynamic";

import Image from "next/image";
import { checkDatabaseHealth } from "@/lib/supabase/server";

async function checkHealth() {
  const components: {
    name: string;
    status: string;
    note: string;
  }[] = [
    { name: "Web Application", status: "operational", note: "" },
    { name: "Free Audit Funnel", status: "operational", note: "" },
    { name: "Audit Processing", status: "operational", note: "" },
    { name: "API Endpoints", status: "operational", note: "" },
    {
      name: "Database",
      status: "not-configured",
      note: "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    },
    {
      name: "n8n Automation",
      status: "not-configured",
      note: "Set N8N_WEBHOOK_URL",
    },
    {
      name: "Email Notifications",
      status: "not-configured",
      note: "No email provider configured",
    },
    {
      name: "WhatsApp",
      status: "not-configured",
      note: "WhatsApp Business API not connected",
    },
    {
      name: "CRM Integrations",
      status: "not-configured",
      note: "No CRM provider connected",
    },
    {
      name: "Payments",
      status: "not-configured",
      note: "Paystack not connected",
    },
  ];

  // Check API health
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${siteUrl}/api/request`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) components[3].status = "degraded";
  } catch {
    components[3].status = "degraded";
  }

  // Check database health
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.ok) {
      components[4].status = "operational";
      components[4].note = "Connected";
    } else {
      components[4].status = "degraded";
      components[4].note = dbHealth.message;
    }
  }

  // Check n8n
  if (process.env.N8N_WEBHOOK_URL) {
    components[5].status = "operational";
    components[5].note = "Configured";
  }

  // Check email
  if (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY) {
    components[6].status = "operational";
    components[6].note = "Configured";
  }

  // Check WhatsApp
  if (process.env.WHATSAPP_API_TOKEN) {
    components[7].status = "operational";
    components[7].note = "Configured";
  }

  // Check CRM
  if (process.env.HUBSPOT_API_KEY || process.env.PIPEDRIVE_API_TOKEN) {
    components[8].status = "operational";
    components[8].note = "Configured";
  }

  // Check payments
  if (process.env.PAYSTACK_SECRET_KEY) {
    components[9].status = "operational";
    components[9].note = "Configured";
  }

  const operationalCount = components.filter(
    (c) => c.status === "operational"
  ).length;
  const configuredCount = components.filter(
    (c) => c.status !== "not-configured"
  ).length;
  const overall = components.some((c) => c.status === "major-outage")
    ? "major-outage"
    : components.some((c) => c.status === "degraded")
      ? "degraded"
      : "operational";

  return {
    components,
    overall,
    operationalCount,
    configuredCount,
    totalComponents: components.length,
    checkedAt: new Date().toISOString(),
  };
}

export default async function StatusPage() {
  const {
    components,
    overall,
    operationalCount,
    configuredCount,
    totalComponents,
    checkedAt,
  } = await checkHealth();

  const statusColors: Record<string, string> = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    "partial-outage": "bg-amber-500",
    "major-outage": "bg-red-500",
    maintenance: "bg-zinc-500",
    "not-configured": "bg-zinc-600",
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
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <Image src="/brand/elion-e-icon.png" alt="ELION" width={24} height={24} priority />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm">
              ELION
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            System Status
          </h1>
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${statusColors[overall]}`}
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              {overall === "operational"
                ? "All systems operational"
                : overall === "not-configured"
                  ? "System partially configured"
                  : "Some systems experiencing issues"}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            {configuredCount} of {totalComponents} services configured
          </p>
        </div>

        <div className="space-y-2">
          {components.filter(c => c.status !== "not-configured").map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between px-5 py-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <div>
                <span className="text-sm text-[var(--color-text-primary)]">
                  {c.name}
                </span>
                {c.note && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {c.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${statusColors[c.status]}`}
                />
                <span className="text-xs text-[var(--color-text-muted)]">
                  {statusLabels[c.status]}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            Last checked:{" "}
            {new Date(checkedAt).toLocaleString("en-NG", {
              timeZone: "Africa/Lagos",
            })}{" "}
            WAT
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            This page performs live health checks on each load. External
            monitoring (Uptime Robot, etc.) recommended for production.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Past Incidents
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            No incidents reported.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
            Scheduled Maintenance
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            No maintenance scheduled.
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            Back to ELION
          </a>
        </div>
      </div>
    </div>
  );
}
