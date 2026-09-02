"use client";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Play, CheckCircle, XCircle, Loader2, Copy, Database } from "lucide-react";

const MIGRATIONS = [
  {
    id: "012b",
    name: "Automation Infrastructure",
    description: "Create workflow_templates, client_credentials tables and seed Lead Response template",
    sql: `-- Create automation_templates table (wraps workflow_templates)
CREATE TABLE IF NOT EXISTS automation_templates (
  id TEXT PRIMARY KEY DEFAULT ('tmpl_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  required_config JSONB NOT NULL DEFAULT '{}',
  required_integrations JSONB NOT NULL DEFAULT '[]',
  required_credentials JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  clients_using INT DEFAULT 0
);

-- Create integration_credentials table
CREATE TABLE IF NOT EXISTS integration_credentials (
  id TEXT PRIMARY KEY DEFAULT ('cred_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_configured',
  credential_ref TEXT,
  last_verified_at TIMESTAMPTZ,
  health TEXT DEFAULT 'unknown',
  UNIQUE(client_id, integration_type)
);

-- Create automation_executions table
CREATE TABLE IF NOT EXISTS automation_executions (
  id TEXT PRIMARY KEY DEFAULT ('exec_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  automation_id TEXT,
  template_id TEXT,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'started',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  channel TEXT,
  channel_status TEXT,
  response_generated TEXT,
  response_sent_to TEXT,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_credentials_client ON integration_credentials(client_id);
CREATE INDEX IF NOT EXISTS idx_executions_client ON automation_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_executions_automation ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created ON automation_executions(created_at DESC);

-- RLS
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON automation_templates FOR ALL USING (true);
CREATE POLICY "Admin full access" ON integration_credentials FOR ALL USING (true);
CREATE POLICY "Admin full access" ON automation_executions FOR ALL USING (true);

-- Seed Lead Response template
INSERT INTO automation_templates (id, name, category, description, version, required_config, required_integrations, required_credentials, status)
VALUES (
  'tmpl_lead_response_v1',
  'Lead Response System',
  'lead_response',
  'Automatically responds to new leads, qualifies them, and routes qualified prospects.',
  '1.0.0',
  '{"business_name": {"type": "text", "required": true}, "industry": {"type": "text", "required": true}, "timezone": {"type": "text", "default": "Africa/Lagos"}, "response_template": {"type": "textarea", "required": true}, "preferred_channel": {"type": "text", "default": "whatsapp"}}',
  '["whatsapp", "email"]',
  '["whatsapp_api_key", "email_smtp"]',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed other templates
INSERT INTO automation_templates (id, name, category, description, version, required_integrations, status)
VALUES
  ('tmpl_follow_up_v1', 'Follow-Up Sequence', 'follow_up', 'Follow up with prospects automatically.', '1.0.0', '["whatsapp", "email"]', 'active'),
  ('tmpl_booking_v1', 'Booking Automation', 'booking', 'Automate booking workflows.', '1.0.0', '["calendar"]', 'active'),
  ('tmpl_revenue_recovery_v1', 'Revenue Recovery', 'revenue_recovery', 'Recover lost opportunities.', '1.0.0', '["email"]', 'active'),
  ('tmpl_operations_v1', 'Operations Automation', 'operations', 'Automate internal processes.', '1.0.0', '["n8n"]', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed integration credentials for test client
INSERT INTO integration_credentials (client_id, integration_type, status, health)
VALUES
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'whatsapp', 'connected', 'healthy'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'email', 'connected', 'healthy'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'n8n', 'connected', 'healthy')
ON CONFLICT DO NOTHING;

-- Seed test execution logs
INSERT INTO automation_executions (client_id, automation_id, template_id, trigger_type, trigger_data, status, started_at, completed_at, duration_ms, channel, channel_status, response_sent_to, metadata)
VALUES
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name": "John Adekunle", "source": "website_form"}', 'completed', now() - interval '2 hours', now() - interval '2 hours' + interval '8 seconds', 8200, 'whatsapp', 'sent', '+2348031234567', '{"response_time_ms": 8200}'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name": "Sarah Okafor", "source": "instagram"}', 'completed', now() - interval '5 hours', now() - interval '5 hours' + interval '6 seconds', 6100, 'whatsapp', 'sent', '+2348059876543', '{"response_time_ms": 6100}'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name": "Chidi Nwosu", "source": "referral"}', 'completed', now() - interval '1 day', now() - interval '1 day' + interval '12 seconds', 12000, 'whatsapp', 'delivered', '+2348071112222', '{"response_time_ms": 12000}');`,
  },
  {
    id: "012c",
    name: "Update existing client automation",
    description: "Set custom_config on existing client automation for ABC Properties",
    sql: `UPDATE client_automations SET custom_config = '{
  "business_name": "ABC Properties Ltd",
  "industry": "Real Estate",
  "timezone": "Africa/Lagos",
  "currency": "NGN",
  "working_hours_start": "08:00",
  "working_hours_end": "19:00",
  "response_template": "Hello {{contact_name}},\\n\\nThank you for your interest in ABC Properties. We have received your inquiry and a member of our team will be in touch shortly.\\n\\nBest regards,\\nABC Properties Team",
  "preferred_channel": "whatsapp",
  "escalation_email": "info@abcproperties.ng"
}' WHERE id = 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74';`,
  },
];

export default function MigrationsPage() {
  const [results, setResults] = useState<Record<string, { status: "pending" | "running" | "success" | "error"; message?: string }>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const runMigration = async (migration: (typeof MIGRATIONS)[0]) => {
    setResults((prev) => ({ ...prev, [migration.id]: { status: "running" } }));

    try {
      // Execute SQL via the API route
      const res = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: migration.sql }),
      });

      const data = await res.json();

      if (res.ok) {
        setResults((prev) => ({ ...prev, [migration.id]: { status: "success", message: data.message || "Migration completed" } }));
      } else {
        setResults((prev) => ({ ...prev, [migration.id]: { status: "error", message: data.error || "Unknown error" } }));
      }
    } catch (err) {
      setResults((prev) => ({ ...prev, [migration.id]: { status: "error", message: String(err) } }));
    }
  };

  const copySql = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <Database className="w-8 h-8 text-[var(--color-accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Database Migrations</h1>
            <p className="text-[var(--color-text-muted)]">Run Supabase SQL migrations for the automation infrastructure</p>
          </div>
        </div>

        <div className="space-y-4">
          {MIGRATIONS.map((m) => {
            const result = results[m.id];
            return (
              <div key={m.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">{m.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{m.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {result?.status === "success" && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {result?.status === "error" && <XCircle className="w-5 h-5 text-red-400" />}
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{m.id}</span>
                  </div>
                </div>

                {result?.message && (
                  <p className={`text-sm mb-3 ${result.status === "error" ? "text-red-400" : "text-green-400"}`}>
                    {result.message}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => runMigration(m)}
                    disabled={result?.status === "running"}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {result?.status === "running" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Migration
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => copySql(m.sql, m.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-surface-elevated)] transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    {copied === m.id ? "Copied!" : "Copy SQL"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            If the automated runner fails, copy the SQL and paste it into the{" "}
            <a
              href="https://supabase.com/dashboard/project/dxpzvscfbemywhkehpdm/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              Supabase SQL Editor
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
