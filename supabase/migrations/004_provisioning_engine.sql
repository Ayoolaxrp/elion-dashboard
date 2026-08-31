-- =====================================================
-- PROVISIONING ENGINE
-- Logs, version tracking, activation gates
-- =====================================================

-- PROVISIONING LOGS
CREATE TABLE IF NOT EXISTS provisioning_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  automation_id TEXT REFERENCES client_automations(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES workflow_templates(id) ON DELETE SET NULL,
  template_version TEXT,
  action TEXT NOT NULL CHECK (action IN ('provision','activate','pause','deactivate','upgrade','downgrade','test','retry')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','passed','failed','blocked','skipped')),
  steps JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  initiated_by TEXT DEFAULT 'admin',
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pl_client ON provisioning_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_pl_automation ON provisioning_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_pl_status ON provisioning_logs(status);
CREATE INDEX IF NOT EXISTS idx_pl_created ON provisioning_logs(created_at DESC);

-- TEMPLATE VERSIONS
CREATE TABLE IF NOT EXISTS template_versions (
  id TEXT PRIMARY KEY DEFAULT ('tv_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template_id TEXT NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  n8n_workflow_id TEXT,
  n8n_workflow_json JSONB,
  config_schema JSONB DEFAULT '{}'::jsonb,
  default_config JSONB DEFAULT '{}'::jsonb,
  required_credentials JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','testing','active','deprecated')),
  validation_rules JSONB DEFAULT '{}'::jsonb,
  UNIQUE(template_id, version)
);
CREATE INDEX IF NOT EXISTS idx_tv_template ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_tv_status ON template_versions(status);

-- CLIENT CREDENTIALS
CREATE TABLE IF NOT EXISTS client_credentials (
  id TEXT PRIMARY KEY DEFAULT ('cred_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL CHECK (credential_type IN ('whatsapp_api','email_smtp','calendar_oauth','crm_api','n8n_webhook','custom')),
  provider TEXT,
  credential_ref TEXT,
  credential_metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'not_configured' CHECK (status IN ('not_configured','configured','verified','expired','error')),
  last_verified_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(client_id, credential_type)
);
CREATE INDEX IF NOT EXISTS idx_cc_client ON client_credentials(client_id);

-- RLS
ALTER TABLE provisioning_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON provisioning_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON template_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
ALTER TABLE client_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON client_credentials FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_client_credentials_updated_at
  BEFORE UPDATE ON client_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED: Template versions for existing templates
INSERT INTO template_versions (template_id, version, status, required_credentials, config_schema, validation_rules)
SELECT id, '1.0', 'active',
  '["whatsapp_api", "email_smtp"]'::jsonb,
  config_schema,
  '{"required_fields": ["business_name"], "required_integrations": ["whatsapp"]}'::jsonb
FROM workflow_templates WHERE is_active = true
ON CONFLICT (template_id, version) DO NOTHING;
