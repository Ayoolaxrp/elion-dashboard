-- Fix 012: Create missing tables and seed data
-- Uses correct column names matching existing schema

-- 1. Create automation_templates (does not exist yet)
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

-- 2. Create integration_credentials (does not exist yet)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_credentials_client ON integration_credentials(client_id);

-- RLS
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on automation_templates" ON automation_templates FOR ALL USING (true);
CREATE POLICY "Admin full access on integration_credentials" ON integration_credentials FOR ALL USING (true);

-- 3. Seed Lead Response System template
INSERT INTO automation_templates (id, name, category, description, version, required_config, required_integrations, required_credentials, status)
VALUES (
  'tmpl_lead_response_v1',
  'Lead Response System',
  'lead_response',
  'Automatically responds to new leads, qualifies them, and routes qualified prospects into follow-up workflows.',
  '1.0.0',
  '{"business_name": {"type": "text", "required": true}, "industry": {"type": "text", "required": true}, "timezone": {"type": "text", "required": true, "default": "Africa/Lagos"}, "currency": {"type": "text", "required": true, "default": "NGN"}, "working_hours_start": {"type": "text", "required": true, "default": "09:00"}, "working_hours_end": {"type": "text", "required": true, "default": "18:00"}, "response_template": {"type": "textarea", "required": true}, "preferred_channel": {"type": "text", "default": "whatsapp"}}',
  '["whatsapp", "email"]',
  '["whatsapp_api_key", "email_smtp"]',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed other templates
INSERT INTO automation_templates (id, name, category, description, version, required_config, required_integrations, required_credentials, status)
VALUES
  ('tmpl_follow_up_v1', 'Follow-Up Sequence', 'follow_up', 'Automatically follow up with prospects that have not responded.', '1.0.0', '{"follow_up_count": {"type": "number", "default": 3}, "interval_hours": {"type": "number", "default": 24}}', '["whatsapp", "email"]', '["whatsapp_api_key"]', 'active'),
  ('tmpl_booking_v1', 'Booking Automation', 'booking', 'Automate booking workflows and reduce scheduling friction.', '1.0.0', '{"slot_duration_min": {"type": "number", "default": 30}}', '["calendar"]', '["calendar_oauth"]', 'active'),
  ('tmpl_revenue_recovery_v1', 'Revenue Recovery', 'revenue_recovery', 'Identify lost opportunities and trigger recovery workflows.', '1.0.0', '{"dormant_days": {"type": "number", "default": 30}}', '["email"]', '["email_smtp"]', 'active'),
  ('tmpl_operations_v1', 'Operations Automation', 'operations', 'Automate repetitive internal business processes.', '1.0.0', '{}', '["n8n"]', '["n8n_api_key"]', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Update existing client_automations with custom_config for test clients
UPDATE client_automations SET custom_config = '{
  "business_name": "ABC Properties Ltd",
  "industry": "Real Estate",
  "timezone": "Africa/Lagos",
  "currency": "NGN",
  "working_hours_start": "08:00",
  "working_hours_end": "19:00",
  "response_template": "Hello {{contact_name}},\n\nThank you for your interest in ABC Properties. We have received your inquiry and a member of our team will be in touch shortly.\n\nBest regards,\nABC Properties Team",
  "preferred_channel": "whatsapp",
  "escalation_email": "info@abcproperties.ng"
}' WHERE id = 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74';

-- 5. Seed integration credentials for test client
INSERT INTO integration_credentials (client_id, integration_type, status, health)
VALUES
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'whatsapp', 'connected', 'healthy'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'email', 'connected', 'healthy'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'n8n', 'connected', 'healthy')
ON CONFLICT DO NOTHING;

-- 6. Seed execution logs for test client (optional - only runs if table is empty)
-- Uses actual automation_executions columns: trigger_type, trigger_data, status, started_at, completed_at, duration_ms, result
INSERT INTO automation_executions (client_id, automation_id, trigger_type, trigger_data, status, started_at, completed_at, duration_ms, result)
SELECT 'client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74', 'new_lead', v.lead_data, 'completed', now() - v.age, now() - v.age + make_interval(secs => v.ms / 1000.0), v.ms, jsonb_build_object('channel', 'whatsapp', 'channel_status', 'sent', 'response_sent_to', v.phone, 'response_time_ms', v.ms)
FROM (VALUES
  ('{"lead_name": "John Adekunle", "source": "website_form"}'::jsonb, '+2348031234567', 8200, interval '2 hours'),
  ('{"lead_name": "Sarah Okafor", "source": "instagram"}'::jsonb, '+2348059876543', 6100, interval '5 hours'),
  ('{"lead_name": "Chidi Nwosu", "source": "referral"}'::jsonb, '+2348071112222', 12000, interval '1 day')
) AS v(lead_data, phone, ms, age)
WHERE NOT EXISTS (SELECT 1 FROM automation_executions WHERE client_id = 'client_2595d414-d84a-43b5-bdb9-9caac035895e');
