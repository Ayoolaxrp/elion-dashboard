// Run migration 012b (automation_templates + integration_credentials) against Supabase
// Usage: node --env-file=.env.local scripts/run_012b.js
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSQL(label, sql) {
  const { data, error } = await sb.rpc('exec_sql', { query: sql });
  const ok = !error && data !== 'ERROR: ' && !String(data || '').startsWith('ERROR');
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}: ${error ? error.message : data}`);
  return !error;
}

async function tableExists(table) {
  const { error } = await sb.from(table).select('*', { count: 'exact', head: true });
  return !error;
}

async function go() {
  // --- 0. Ensure exec_sql exists and actually runs DDL ---
  await runSQL('ensure exec_sql fn', `CREATE OR REPLACE FUNCTION exec_sql(query TEXT) RETURNS TEXT AS $$ BEGIN EXECUTE query; RETURN 'OK'; EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`);

  // --- 1. Check current state ---
  console.log('\n=== CURRENT STATE ===');
  for (const t of ['automation_templates', 'integration_credentials']) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${t}: ${error ? 'MISSING' : count + ' rows'}`);
  }

  // Probe automation_executions columns so section 6 doesn't blow up the whole run
  const probe = await runSQL('probe automation_executions cols', `
    SELECT string_agg(column_name, ',') FROM information_schema.columns
    WHERE table_schema='public' AND table_name='automation_executions';`);
  let execCols = '';
  if (probe) {
    const { data } = await sb.rpc('exec_sql', { query: `SELECT string_agg(column_name, ',') FROM information_schema.columns WHERE table_schema='public' AND table_name='automation_executions'` });
    execCols = String(data || '');
    console.log('  automation_executions columns:', execCols || '(table missing)');
  }

  // --- 2. Create automation_templates ---
  await runSQL('create automation_templates', `
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
);`);

  // --- 3. Create integration_credentials ---
  await runSQL('create integration_credentials', `
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
);`);

  // --- 4. Indexes + RLS ---
  await runSQL('indexes + RLS', `
CREATE INDEX IF NOT EXISTS idx_integration_credentials_client ON integration_credentials(client_id);
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admin full access on automation_templates' AND tablename='automation_templates') THEN
    CREATE POLICY "Admin full access on automation_templates" ON automation_templates FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admin full access on integration_credentials' AND tablename='integration_credentials') THEN
    CREATE POLICY "Admin full access on integration_credentials" ON integration_credentials FOR ALL USING (true);
  END IF;
END $$;`);

  // --- 5. Seed templates ---
  await runSQL('seed templates', `
INSERT INTO automation_templates (id, name, category, description, version, required_config, required_integrations, required_credentials, status) VALUES
  ('tmpl_lead_response_v1', 'Lead Response System', 'lead_response', 'Automatically responds to new leads, qualifies them, and routes qualified prospects into follow-up workflows.', '1.0.0', '{"business_name":{"type":"text","required":true},"industry":{"type":"text","required":true},"timezone":{"type":"text","required":true,"default":"Africa/Lagos"},"currency":{"type":"text","required":true,"default":"NGN"},"working_hours_start":{"type":"text","required":true,"default":"09:00"},"working_hours_end":{"type":"text","required":true,"default":"18:00"},"response_template":{"type":"textarea","required":true},"preferred_channel":{"type":"text","default":"whatsapp"}}', '["whatsapp","email"]', '["whatsapp_api_key","email_smtp"]', 'active'),
  ('tmpl_follow_up_v1', 'Follow-Up Sequence', 'follow_up', 'Automatically follow up with prospects that have not responded.', '1.0.0', '{"follow_up_count":{"type":"number","default":3},"interval_hours":{"type":"number","default":24}}', '["whatsapp","email"]', '["whatsapp_api_key"]', 'active'),
  ('tmpl_booking_v1', 'Booking Automation', 'booking', 'Automate booking workflows and reduce scheduling friction.', '1.0.0', '{"slot_duration_min":{"type":"number","default":30}}', '["calendar"]', '["calendar_oauth"]', 'active'),
  ('tmpl_revenue_recovery_v1', 'Revenue Recovery', 'revenue_recovery', 'Identify lost opportunities and trigger recovery workflows.', '1.0.0', '{"dormant_days":{"type":"number","default":30}}', '["email"]', '["email_smtp"]', 'active'),
  ('tmpl_operations_v1', 'Operations Automation', 'operations', 'Automate repetitive internal business processes.', '1.0.0', '{}', '["n8n"]', '["n8n_api_key"]', 'active')
ON CONFLICT (id) DO NOTHING;`);

  // --- 6. Update client_automations custom_config for test client ---
  await runSQL('seed client config', `
UPDATE client_automations SET custom_config = '{
  "business_name": "ABC Properties Ltd",
  "industry": "Real Estate",
  "timezone": "Africa/Lagos",
  "currency": "NGN",
  "working_hours_start": "08:00",
  "working_hours_end": "19:00",
  "response_template": "Hello {{contact_name}},\\n\\nThank you for your interest in ABC Properties. We have received your inquiry and a member of our team will be in touch shortly.\\n\\nBest regards,\\nABC Properties Team",
  "preferred_channel": "whatsapp",
  "escalation_email": "info@abcproperties.ng"
}' WHERE id = 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74';`);

  // --- 7. Seed integration credentials (only if no rows yet) ---
  await runSQL('seed credentials', `
INSERT INTO integration_credentials (client_id, integration_type, status, health)
SELECT 'client_2595d414-d84a-43b5-bdb9-9caac035895e', x.integration_type, 'connected', 'healthy'
FROM (VALUES ('whatsapp'), ('email'), ('n8n')) AS x(integration_type)
WHERE NOT EXISTS (SELECT 1 FROM integration_credentials i WHERE i.client_id = 'client_2595d414-d84a-43b5-bdb9-9caac035895e' AND i.integration_type = x.integration_type);`);

  // --- 8. Seed execution logs only if automation_executions has the right columns ---
  if (execCols.includes('trigger_type') && execCols.includes('channel_status')) {
    await runSQL('seed executions', `
INSERT INTO automation_executions (client_id, automation_id, template_id, trigger_type, trigger_data, status, started_at, completed_at, duration_ms, channel, channel_status, response_sent_to, metadata)
SELECT 'client_2595d414-d84a-43b5-bdb9-9caac035895e', 'ca_fbe06ee6-23aa-436c-a4fb-f6970e75ef74', 'tmpl_lead_response_v1', 'new_lead', '{"lead_name":"John Adekunle","source":"website_form"}', 'completed', now() - interval '2 hours', now() - interval '2 hours' + interval '8 seconds', 8200, 'whatsapp', 'sent', '+2348031234567', '{"response_time_ms":8200}'
WHERE NOT EXISTS (SELECT 1 FROM automation_executions WHERE client_id='client_2595d414-d84a-43b5-bdb9-9caac035895e' AND metadata IS NOT NULL);`);
  } else {
    console.log('SKIP seed executions: automation_executions lacks expected columns');
  }

  // --- 9. Final verification ---
  console.log('\n=== VERIFICATION ===');
  const { count: tCount, error: tErr } = await sb.from('automation_templates').select('*', { count: 'exact', head: true });
  console.log(`  automation_templates: ${tErr ? 'FAIL ' + tErr.message : tCount + ' rows'}`);
  const { count: cCount, error: cErr } = await sb.from('integration_credentials').select('*', { count: 'exact', head: true });
  console.log(`  integration_credentials: ${cErr ? 'FAIL ' + cErr.message : cCount + ' rows'}`);

  const { data: tmpls } = await sb.from('automation_templates').select('name, category, version, status');
  if (tmpls?.length) tmpls.forEach(t => console.log(`    - ${t.name} (${t.category}) v${t.version} ${t.status}`));

  const { data: creds } = await sb.from('integration_credentials').select('client_id, integration_type, status, health');
  if (creds?.length) creds.forEach(c => console.log(`    - ${c.client_id.slice(0, 12)}… ${c.integration_type}: ${c.status}/${c.health}`));
}
go().catch(e => console.error('FATAL:', e.message));