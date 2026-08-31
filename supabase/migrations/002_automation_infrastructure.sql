-- =====================================================
-- AUTOMATION INFRASTRUCTURE
-- Client management, workflow templates, assignments
-- =====================================================

-- =====================================================
-- WORKFLOW TEMPLATES
-- Reusable automation blueprints that ELION builds once
-- and deploys to multiple clients
-- =====================================================
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY DEFAULT ('tmpl_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Template identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('lead_response', 'follow_up', 'booking', 'revenue_recovery', 'operations', 'custom')),

  -- What this template does
  value_proposition TEXT,
  what_it_fixes TEXT,
  expected_outcome TEXT,

  -- Required integrations (JSON array of integration types needed)
  required_integrations JSONB DEFAULT '[]'::jsonb,

  -- Configuration schema (what can be customized per client)
  config_schema JSONB DEFAULT '{}'::jsonb,

  -- Default configuration
  default_config JSONB DEFAULT '{}'::jsonb,

  -- Pricing
  setup_price INTEGER, -- in kobo
  monthly_price INTEGER, -- in kobo, optional ongoing

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false -- visible to admin
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON workflow_templates(slug);

-- =====================================================
-- CLIENTS
-- A client is a lead that has paid and is receiving
-- automation services
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT ('client_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Link to original lead
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,

  -- Client identity
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,

  -- Business info
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  company_size TEXT,

  -- Plan
  plan_name TEXT, -- Starter, Growth, Scale, Custom
  plan_price INTEGER, -- in kobo, what they paid

  -- Onboarding
  onboarding_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (onboarding_status IN (
      'pending',        -- waiting to start
      'in_review',      -- reviewing requirements
      'building',       -- ELION is building
      'testing',        -- testing the automation
      'go_live',        -- live, client using it
      'completed',      -- handover complete
      'suspended'       -- paused
    )),

  -- Onboarding notes (internal)
  onboarding_notes TEXT,
  handover_date TIMESTAMPTZ,

  -- Access
  dashboard_access BOOLEAN DEFAULT true,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'churned', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_clients_lead ON clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding ON clients(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_clients_auth ON clients(auth_user_id);

-- =====================================================
-- CLIENT AUTOMATIONS
-- What automations each client has deployed
-- =====================================================
CREATE TABLE IF NOT EXISTS client_automations (
  id TEXT PRIMARY KEY DEFAULT ('ca_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,

  -- What was customized for this client
  custom_name TEXT, -- optional display name
  custom_config JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',        -- assigned, not yet configured
      'configuring',    -- being set up
      'testing',        -- testing
      'live',           -- actively running
      'pending_activation', -- awaiting n8n/activation
      'paused',         -- temporarily stopped
      'failed',         -- error state
      'archived'        -- no longer active
    )),

  -- Performance (updated periodically)
  last_run_at TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2), -- percentage

  -- Dates
  deployed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  last_health_check TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ca_client ON client_automations(client_id);
CREATE INDEX IF NOT EXISTS idx_ca_template ON client_automations(template_id);
CREATE INDEX IF NOT EXISTS idx_ca_status ON client_automations(status);

-- =====================================================
-- CLIENT INTEGRATIONS
-- What tools/services each client has connected
-- =====================================================
CREATE TABLE IF NOT EXISTS client_integrations (
  id TEXT PRIMARY KEY DEFAULT ('ci_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  integration_type TEXT NOT NULL
    CHECK (integration_type IN (
      'whatsapp', 'email', 'crm', 'calendar', 'booking',
      'forms', 'website', 'analytics', 'custom'
    )),
  provider TEXT, -- HubSpot, Pipedrive, Google Calendar, etc.

  -- Connection status
  status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (status IN ('not_configured', 'configured', 'connected', 'error')),

  -- Config (never store secrets here)
  config JSONB DEFAULT '{}'::jsonb,

  -- Health
  last_verified_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_ci_client ON client_integrations(client_id);
CREATE INDEX IF NOT EXISTS idx_ci_type ON client_integrations(integration_type);

-- =====================================================
-- CLIENT METRICS
-- Periodic performance snapshots per client
-- =====================================================
CREATE TABLE IF NOT EXISTS client_metrics (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Metrics for this snapshot
  metric_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Lead metrics
  leads_captured INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_responded INTEGER DEFAULT 0,

  -- Response metrics
  avg_response_time_seconds INTEGER,

  -- Follow-up metrics
  followups_sent INTEGER DEFAULT 0,
  followups_responded INTEGER DEFAULT 0,

  -- Booking metrics
  bookings_created INTEGER DEFAULT 0,
  bookings_confirmed INTEGER DEFAULT 0,

  -- Conversion
  conversion_rate NUMERIC(5,2),

  -- Raw data
  data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cm_client ON client_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_cm_period ON client_metrics(period_start, period_end);

-- =====================================================
-- AUTO-UPDATE updated_at for new tables
-- =====================================================
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_automations_updated_at
  BEFORE UPDATE ON client_automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_integrations_updated_at
  BEFORE UPDATE ON client_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Templates: service role only (admin manages these)
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON workflow_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Clients: service role only
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON clients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Client automations: service role only
ALTER TABLE client_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON client_automations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Client integrations: service role only
ALTER TABLE client_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON client_integrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Client metrics: service role only
ALTER TABLE client_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON client_metrics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- SEED: Pre-built workflow templates
-- =====================================================

INSERT INTO workflow_templates (name, slug, description, category, value_proposition, what_it_fixes, expected_outcome, required_integrations, config_schema, default_config, setup_price) VALUES

('Lead Response System', 'lead_response',
 'Automatically capture, qualify, and respond to new enquiries across WhatsApp, email, and web forms.',
 'lead_response',
 'Leads get an instant, personalised response 24/7 regardless of when they enquire.',
 'Slow manual response times that cause prospects to go cold.',
 'Response time drops from hours to seconds. No lead goes unacknowledged.',
 '["whatsapp", "email", "forms"]'::jsonb,
 '{"response_template": "string", "qualification_questions": "array", "routing_rules": "object"}'::jsonb,
 '{"response_template": "Hi {name}, thanks for reaching out. We have received your enquiry and will be in touch shortly.", "qualification_questions": ["What service are you interested in?", "What is your budget range?"], "routing_rules": {"priority": "high", "assign_to": "default"}}'::jsonb,
 10000000), -- 100,000 NGN

('Follow-Up Sequence', 'follow_up',
 'Automated follow-up sequences that nurture leads who did not convert on first contact.',
 'follow_up',
 'Leads that would have gone cold get systematically re-engaged.',
 'Forgotten leads and inconsistent follow-up across the team.',
 'Follow-up rate goes from ad-hoc to 100% systematic coverage.',
 '["email", "whatsapp", "crm"]'::jsonb,
 '{"sequence_steps": "array", "delay_hours": "number", "channels": "array"}'::jsonb,
 '{"sequence_steps": ["Initial follow-up", "Value reminder", "Case study share", "Final check-in"], "delay_hours": [24, 72, 168, 336], "channels": ["email", "whatsapp"]}'::jsonb,
 7500000), -- 75,000 NGN

('Booking Automation', 'booking',
 'Automated appointment scheduling with calendar sync and confirmation.',
 'booking',
 'Prospects book directly without back-and-forth scheduling.',
 'Manual scheduling wastes time and loses bookings.',
 'Booking rate increases, scheduling friction eliminated.',
 '["calendar", "whatsapp", "email"]'::jsonb,
 '{"calendar_provider": "string", "available_slots": "object", "confirmation_template": "string"}'::jsonb,
 '{"calendar_provider": "google", "available_slots": {"monday_friday": "9:00-17:00", "buffer_minutes": 30}, "confirmation_template": "Your appointment has been confirmed for {date} at {time}."}'::jsonb,
 7500000), -- 75,000 NGN

('Revenue Recovery', 'revenue_recovery',
 'Identify dormant customers and trigger reactivation sequences.',
 'revenue_recovery',
 'Revenue from dormant customers gets systematically recovered.',
 'Old leads and customers are never reactivated.',
 'Dormant revenue pipeline gets reactivated.',
 '["crm", "email", "whatsapp"]'::jsonb,
 '{"dormancy_days": "number", "reactivation_sequence": "array", "eligibility_rules": "object"}'::jsonb,
 '{"dormancy_days": 30, "reactivation_sequence": ["We noticed you have been away", "Here is what is new", "Special offer to come back"], "eligibility_rules": {"min_spend": 0, "last_activity_days": 30}}'::jsonb,
 10000000), -- 100,000 NGN

('Operations Automation', 'operations',
 'Automate repetitive internal workflows: data entry, notifications, approvals, reporting.',
 'operations',
 'Team stops doing work that software should handle.',
 'Hours wasted on repetitive manual tasks.',
 'Team focuses on high-value work instead of data shuffling.',
 '["custom", "email", "forms"]'::jsonb,
 '{"workflow_type": "string", "trigger": "object", "actions": "array"}'::jsonb,
 '{"workflow_type": "data_sync", "trigger": {"event": "form_submission"}, "actions": ["validate_data", "update_record", "send_notification"]}'::jsonb,
 12500000); -- 125,000 NGN
