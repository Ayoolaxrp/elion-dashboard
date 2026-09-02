-- Lead Response System v1
-- Core tables for the first production automation

-- 1. Automation Templates (reusable across clients)
CREATE TABLE IF NOT EXISTS automation_templates (
  id TEXT PRIMARY KEY DEFAULT ('tmpl_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lead_response', 'follow_up', 'booking', 'revenue_recovery', 'operations')),
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',

  -- What this template needs
  required_config JSONB NOT NULL DEFAULT '{}',
  required_integrations JSONB NOT NULL DEFAULT '[]',
  required_credentials JSONB NOT NULL DEFAULT '[]',

  -- n8n workflow template
  n8n_workflow_template_id TEXT,
  n8n_workflow_config JSONB DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'draft')),
  clients_using INT DEFAULT 0
);

-- 2. Client Automation Instances
CREATE TABLE IF NOT EXISTS client_automations (
  id TEXT PRIMARY KEY DEFAULT ('ca_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES automation_templates(id),

  -- Configuration
  configuration JSONB NOT NULL DEFAULT '{}',
  template_version TEXT NOT NULL DEFAULT '1.0.0',

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'configuring', 'config_complete',
      'provisioning', 'provisioning_failed',
      'testing', 'test_failed',
      'ready', 'live', 'paused', 'failed'
    )),

  -- n8n integration
  n8n_workflow_id TEXT,
  n8n_execution_url TEXT,

  -- Health
  health TEXT DEFAULT 'unknown' CHECK (health IN ('healthy', 'degraded', 'needs_attention', 'offline', 'unknown')),
  last_execution_at TIMESTAMPTZ,
  last_execution_status TEXT,
  total_executions INT DEFAULT 0,
  failed_executions INT DEFAULT 0,

  -- Activation
  activated_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Unique: one instance of each template per client
  UNIQUE(client_id, template_id)
);

-- 3. Automation Executions (activity log)
CREATE TABLE IF NOT EXISTS automation_executions (
  id TEXT PRIMARY KEY DEFAULT ('exec_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  automation_id TEXT NOT NULL REFERENCES client_automations(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,

  -- What happened
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',

  -- Execution details
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'processing', 'responded', 'completed', 'failed', 'blocked')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  -- Channel
  channel TEXT CHECK (channel IN ('email', 'whatsapp', 'sms', 'webhook')),
  channel_status TEXT CHECK (channel_status IN ('sent', 'delivered', 'failed', 'blocked', 'not_configured')),

  -- Response details
  response_generated TEXT,
  response_sent_to TEXT,

  -- Error
  error_code TEXT,
  error_message TEXT,

  -- No secrets logged - only operational info
  metadata JSONB DEFAULT '{}'
);

-- 4. Integration Credentials (secure reference, not actual secrets)
CREATE TABLE IF NOT EXISTS integration_credentials (
  id TEXT PRIMARY KEY DEFAULT ('cred_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('whatsapp', 'email', 'calendar', 'crm', 'n8n')),

  -- Status (never store actual secrets in these columns)
  status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (status IN ('not_configured', 'pending', 'connected', 'needs_attention', 'expired', 'failed')),

  -- Reference to credential store (not the actual credential)
  credential_ref TEXT,
  last_verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Health
  health TEXT DEFAULT 'unknown' CHECK (health IN ('healthy', 'degraded', 'offline', 'unknown')),

  UNIQUE(client_id, integration_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_automations_client ON client_automations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_automations_status ON client_automations(status);
CREATE INDEX IF NOT EXISTS idx_client_automations_template ON client_automations(template_id);
CREATE INDEX IF NOT EXISTS idx_executions_client ON automation_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_executions_automation ON automation_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created ON automation_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_credentials_client ON integration_credentials(client_id);

-- RLS
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on automation_templates"
  ON automation_templates FOR ALL USING (true);
CREATE POLICY "Admin full access on client_automations"
  ON client_automations FOR ALL USING (true);
CREATE POLICY "Admin full access on automation_executions"
  ON automation_executions FOR ALL USING (true);
CREATE POLICY "Admin full access on integration_credentials"
  ON integration_credentials FOR ALL USING (true);

-- Seed Lead Response System template
INSERT INTO automation_templates (id, name, category, description, version, required_config, required_integrations, required_credentials, status)
VALUES (
  'tmpl_lead_response_v1',
  'Lead Response System',
  'lead_response',
  'Automatically responds to new leads, qualifies them, and routes qualified prospects into follow-up workflows.',
  '1.0.0',
  '{
    "business_name": { "type": "text", "required": true },
    "industry": { "type": "text", "required": true },
    "timezone": { "type": "text", "required": true, "default": "Africa/Lagos" },
    "currency": { "type": "text", "required": true, "default": "NGN" },
    "working_hours_start": { "type": "text", "required": true, "default": "09:00" },
    "working_hours_end": { "type": "text", "required": true, "default": "18:00" },
    "response_template": { "type": "textarea", "required": true },
    "qualification_questions": { "type": "array", "required": false },
    "escalation_email": { "type": "email", "required": false }
  }',
  '["whatsapp", "email"]',
  '["whatsapp_api_key", "email_smtp"]',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Seed other templates
INSERT INTO automation_templates (id, name, category, description, version, required_config, required_integrations, required_credentials, status)
VALUES
  ('tmpl_follow_up_v1', 'Follow-Up Sequence', 'follow_up', 'Automatically follow up with prospects that have not responded.', '1.0.0', '{"follow_up_count": {"type": "number", "default": 3}, "interval_hours": {"type": "number", "default": 24}, "stop_on_reply": {"type": "boolean", "default": true}}', '["whatsapp", "email"]', '["whatsapp_api_key"]', 'active'),
  ('tmpl_booking_v1', 'Booking Automation', 'booking', 'Automate booking workflows and reduce scheduling friction.', '1.0.0', '{"calendar": {"type": "text"}, "slot_duration_min": {"type": "number", "default": 30}, "working_hours": {"type": "text"}}', '["calendar"]', '["calendar_oauth"]', 'active'),
  ('tmpl_revenue_recovery_v1', 'Revenue Recovery', 'revenue_recovery', 'Identify lost opportunities and trigger recovery workflows.', '1.0.0', '{"dormant_days": {"type": "number", "default": 30}, "recovery_channels": {"type": "array"}}', '["email"]', '["email_smtp"]', 'active'),
  ('tmpl_operations_v1', 'Operations Automation', 'operations', 'Automate repetitive internal business processes.', '1.0.0', '{"workflows": {"type": "array"}}', '["n8n"]', '["n8n_api_key"]', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed test client A: Real Estate (ABC Properties)
INSERT INTO client_automations (id, client_id, template_id, configuration, template_version, status, health)
VALUES (
  'ca_test_a_real_estate',
  'client_2595d414-d84a-43b5-bdb9-9caac035895e',
  'tmpl_lead_response_v1',
  '{
    "business_name": "ABC Properties Ltd",
    "industry": "Real Estate",
    "timezone": "Africa/Lagos",
    "currency": "NGN",
    "working_hours_start": "08:00",
    "working_hours_end": "19:00",
    "response_template": "Hello {{contact_name}},\n\nThank you for your interest in ABC Properties. We have received your inquiry and a member of our team will be in touch shortly.\n\nBest regards,\nABC Properties Team",
    "qualification_questions": ["Budget range", "Location preference", "Timeline"],
    "escalation_email": "info@abcproperties.ng",
    "preferred_channel": "whatsapp"
  }',
  '1.0.0',
  'live',
  'healthy'
) ON CONFLICT (id) DO NOTHING;

-- Seed test client B: Restaurant (Fresh Ventures)
INSERT INTO client_automations (id, client_id, template_id, configuration, template_version, status, health)
VALUES (
  'ca_test_b_restaurant',
  'client_e2e_1788353988213',
  'tmpl_lead_response_v1',
  '{
    "business_name": "Fresh Ventures",
    "industry": "Restaurant & Catering",
    "timezone": "Africa/Lagos",
    "currency": "NGN",
    "working_hours_start": "07:00",
    "working_hours_end": "22:00",
    "response_template": "Hi {{contact_name}},\n\nThanks for reaching out to Fresh Ventures! Your catering inquiry has been received. We will get back to you within the hour.\n\nFresh Ventures Team",
    "qualification_questions": ["Event date", "Number of guests", "Cuisine preference"],
    "escalation_email": "events@freshventures.ng",
    "preferred_channel": "email"
  }',
  '1.0.0',
  'live',
  'healthy'
) ON CONFLICT (id) DO NOTHING;

-- Seed integration credentials for test clients
INSERT INTO integration_credentials (client_id, integration_type, status, health)
VALUES
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'whatsapp', 'connected', 'healthy'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'email', 'connected', 'healthy'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'n8n', 'connected', 'healthy'),
  ('client_e2e_1788353988213', 'whatsapp', 'not_configured', 'unknown'),
  ('client_e2e_1788353988213', 'email', 'connected', 'healthy'),
  ('client_e2e_1788353988213', 'n8n', 'connected', 'healthy')
ON CONFLICT DO NOTHING;

-- Seed some execution logs for Client A
INSERT INTO automation_executions (client_id, automation_id, template_id, trigger_type, trigger_data, status, started_at, completed_at, duration_ms, channel, channel_status, response_sent_to, metadata)
VALUES
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_test_a_real_estate', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name": "John Adekunle", "source": "website_form"}', 'completed', now() - interval '2 hours', now() - interval '2 hours' + interval '8 seconds', 8200, 'whatsapp', 'sent', '+2348031234567', '{"response_time_ms": 8200}'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_test_a_real_estate', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name": "Sarah Okafor", "source": "instagram"}', 'completed', now() - interval '5 hours', now() - interval '5 hours' + interval '6 seconds', 6100, 'whatsapp', 'sent', '+2348059876543', '{"response_time_ms": 6100}'),
  ('client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_test_a_real_estate', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name": "Chidi Nwosu", "source": "referral"}', 'completed', now() - interval '1 day', now() - interval '1 day' + interval '12 seconds', 12000, 'whatsapp', 'delivered', '+2348071112222', '{"response_time_ms": 12000}');
