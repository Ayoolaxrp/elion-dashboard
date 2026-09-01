-- Migration 009: Client dashboard infrastructure
-- Run this AFTER migrations 001-008

-- Organizations table (links users to clients)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT ('org_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  org_type TEXT NOT NULL DEFAULT 'client'
    CHECK (org_type IN ('internal', 'client')),
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Organization memberships (links users to organizations)
CREATE TABLE IF NOT EXISTS organization_memberships (
  id TEXT PRIMARY KEY DEFAULT ('membership_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client'
    CHECK (role IN ('super_admin', 'admin', 'owner', 'staff', 'client')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'invited')),
  UNIQUE(user_id, organization_id)
);

-- Workflow templates (reusable automation definitions)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY DEFAULT ('tpl_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('lead_response', 'follow_up', 'booking', 'revenue_recovery', 'operations')),
  description TEXT DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'deprecated', 'draft')),
  required_config JSONB DEFAULT '{}',
  required_integrations TEXT[] DEFAULT '{}'
);

-- Client automations (provisioned instances per client)
CREATE TABLE IF NOT EXISTS client_automations (
  id TEXT PRIMARY KEY DEFAULT ('ca_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES workflow_templates(id),
  custom_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'configuring', 'testing', 'live', 'paused', 'failed')),
  configuration JSONB DEFAULT '{}',
  deployed_at TIMESTAMPTZ,
  last_execution_at TIMESTAMPTZ
);

-- Activity log (tracks events across the platform)
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id TEXT,
  client_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated read organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated read memberships" ON organization_memberships FOR SELECT USING (true);
CREATE POLICY "Authenticated read templates" ON workflow_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated read automations" ON client_automations FOR SELECT USING (true);
CREATE POLICY "Authenticated read activity" ON activity_log FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON organizations FOR ALL USING (true);
CREATE POLICY "Service role full access memberships" ON organization_memberships FOR ALL USING (true);
CREATE POLICY "Service role full access templates" ON workflow_templates FOR ALL USING (true);
CREATE POLICY "Service role full access automations" ON client_automations FOR ALL USING (true);
CREATE POLICY "Service role full access activity" ON activity_log FOR ALL USING (true);

-- Seed workflow templates
INSERT INTO workflow_templates (name, category, description, version, required_integrations) VALUES
  ('Lead Response System', 'lead_response', 'Automatically responds to new leads and routes qualified prospects', '1.0', '["whatsapp","email"]'::jsonb),
  ('Follow-Up Sequence', 'follow_up', 'Timed follow-up sequences for leads who didnt convert initially', '1.0', '["whatsapp","email"]'::jsonb),
  ('Booking Automation', 'booking', 'Calendar sync and automated appointment scheduling', '1.0', '["calendar","whatsapp"]'::jsonb),
  ('Revenue Recovery', 'revenue_recovery', 'Identify lost opportunities and trigger recovery workflows', '1.0', '["whatsapp","email"]'::jsonb),
  ('Operations Automation', 'operations', 'Internal task automation, notifications, and reporting', '1.0', '["email"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create internal organization for ELION
INSERT INTO organizations (id, name, org_type, status) VALUES
  ('org_elion_internal', 'ELION', 'internal', 'active')
ON CONFLICT (id) DO NOTHING;

-- Add foreign key from clients to organizations if not exists
DO $$ BEGIN
  ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

