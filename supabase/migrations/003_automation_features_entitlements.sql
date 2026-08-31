-- =====================================================
-- FEATURES + ENTITLEMENTS + CONFIG + EXECUTION LOGS
-- =====================================================

-- =====================================================
-- FEATURES CATALOG
-- Every capability ELION can sell
-- =====================================================
CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY DEFAULT ('feat_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('leads', 'follow_up', 'booking', 'communication', 'operations', 'analytics', 'custom')),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- CLIENT ENTITLEMENTS
-- What each client purchased
-- =====================================================
CREATE TABLE IF NOT EXISTS client_entitlements (
  id TEXT PRIMARY KEY DEFAULT ('ent_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES features(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'pending', 'expired')),
  source TEXT DEFAULT 'manual',
  activated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(client_id, feature_id)
);

-- =====================================================
-- CLIENT CONFIGURATION
-- Per-client channel settings, rules, credentials refs
-- =====================================================
CREATE TABLE IF NOT EXISTS client_config (
  id TEXT PRIMARY KEY DEFAULT ('cfg_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  -- Business info
  business_name TEXT,
  industry TEXT,
  timezone TEXT DEFAULT 'Africa/Lagos',
  currency TEXT DEFAULT 'NGN',
  website TEXT,
  -- Channel config
  whatsapp_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT false,
  email_address TEXT,
  email_verified BOOLEAN DEFAULT false,
  calendar_provider TEXT,
  calendar_id TEXT,
  -- Workflow rules (JSON for flexibility)
  response_rules JSONB DEFAULT '{}'::jsonb,
  followup_rules JSONB DEFAULT '{}'::jsonb,
  booking_rules JSONB DEFAULT '{}'::jsonb,
  qualification_rules JSONB DEFAULT '{}'::jsonb,
  -- Working hours
  working_hours JSONB DEFAULT '{"monday_friday": "9:00-17:00", "timezone": "Africa/Lagos"}'::jsonb,
  -- Escalation
  escalation_rules JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- AUTOMATION EXECUTIONS
-- Track every automation run
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_executions (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  automation_id TEXT REFERENCES client_automations(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  error_code TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ent_client ON client_entitlements(client_id);
CREATE INDEX IF NOT EXISTS idx_ent_feature ON client_entitlements(feature_id);
CREATE INDEX IF NOT EXISTS idx_exec_client ON automation_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_exec_automation ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_exec_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_exec_created ON automation_executions(created_at DESC);

-- Triggers
CREATE TRIGGER update_client_config_updated_at
  BEFORE UPDATE ON client_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON features FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE client_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON client_entitlements FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE client_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON client_config FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON automation_executions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- SEED: Feature catalog
-- =====================================================
INSERT INTO features (key, name, description, category, sort_order) VALUES
('lead_capture', 'Lead Capture', 'Capture leads from web forms, WhatsApp, and email', 'leads', 1),
('lead_qualification', 'Lead Qualification', 'Automatically score and qualify incoming leads', 'leads', 2),
('lead_response', 'Lead Response', 'Instant automated response to new enquiries', 'leads', 3),
('lead_routing', 'Lead Routing', 'Route leads to the right team member', 'leads', 4),
('follow_up_initial', 'Initial Follow-Up', 'First follow-up after non-response', 'follow_up', 10),
('follow_up_sequence', 'Multi-Step Follow-Up', 'Automated follow-up sequences over days/weeks', 'follow_up', 11),
('lead_recovery', 'Lead Recovery', 'Re-engage dormant and unresponsive leads', 'follow_up', 12),
('re_engagement', 'Re-engagement', 'Win back cold leads and inactive customers', 'follow_up', 13),
('booking_scheduling', 'Appointment Booking', 'Automated appointment scheduling', 'booking', 20),
('booking_confirmation', 'Booking Confirmation', 'Automated booking confirmations', 'booking', 21),
('booking_reminders', 'Booking Reminders', 'Pre-appointment reminder sequences', 'booking', 22),
('booking_rescheduling', 'Rescheduling', 'Automated rescheduling flow', 'booking', 23),
('whatsapp_integration', 'WhatsApp Integration', 'WhatsApp Business API connection', 'communication', 30),
('email_integration', 'Email Integration', 'Email automation and tracking', 'communication', 31),
('sms_integration', 'SMS Integration', 'SMS notifications and sequences', 'communication', 32),
('internal_notifications', 'Internal Notifications', 'Team alerts and notifications', 'communication', 33),
('crm_sync', 'CRM Sync', 'Bi-directional CRM data sync', 'operations', 40),
('task_creation', 'Task Creation', 'Automated task and ticket creation', 'operations', 41),
('reporting', 'Reporting', 'Performance dashboards and reports', 'analytics', 50),
('lead_dashboard', 'Lead Dashboard', 'Client-facing lead management view', 'analytics', 51)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SEED: Add version column to workflow_templates
-- =====================================================
ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS config_template JSONB DEFAULT '{}'::jsonb;
