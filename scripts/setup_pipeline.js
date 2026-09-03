const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxpzvscfbemywhkehpdm.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing. Run with: node --env-file=.env.local scripts/setup_pipeline.js');
  process.exit(1);
}

async function runSQL(label, sql) {
  const { data, error } = await sb.rpc('exec_sql', { query: sql });
  console.log(label + ': ' + (error ? 'ERROR: ' + error.message : data));
  return !error;
}

async function go() {
  await runSQL('Create exec_sql', "CREATE OR REPLACE FUNCTION exec_sql(query TEXT) RETURNS TEXT AS $$ BEGIN EXECUTE query; RETURN 'OK'; EXCEPTION WHEN OTHERS THEN RETURN SQLERRM; END; $$ LANGUAGE plpgsql SECURITY DEFINER;");
  
  await runSQL('onboarding_pipeline', "CREATE TABLE IF NOT EXISTS onboarding_pipeline (id TEXT PRIMARY KEY DEFAULT ('ob_' || replace(gen_random_uuid()::text, '-', '')), client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE, current_stage TEXT NOT NULL DEFAULT 'welcome', stage_status TEXT NOT NULL DEFAULT 'in_progress', welcome_completed_at TIMESTAMPTZ, kickoff_completed_at TIMESTAMPTZ, kickoff_date DATE, kickoff_time TEXT, kickoff_call_link TEXT, configuration_completed_at TIMESTAMPTZ, build_completed_at TIMESTAMPTZ, testing_completed_at TIMESTAMPTZ, launch_completed_at TIMESTAMPTZ, handover_completed_at TIMESTAMPTZ, welcome_email_sent BOOLEAN DEFAULT FALSE, welcome_email_sent_at TIMESTAMPTZ, kickoff_message_sent BOOLEAN DEFAULT FALSE, kickoff_message_sent_at TIMESTAMPTZ, completion_email_sent BOOLEAN DEFAULT FALSE, completion_email_sent_at TIMESTAMPTZ, admin_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), CONSTRAINT unique_active_pipeline UNIQUE (client_id));");

  await runSQL('Indexes', "CREATE INDEX IF NOT EXISTS idx_onboarding_pipeline_client ON onboarding_pipeline(client_id); CREATE INDEX IF NOT EXISTS idx_onboarding_pipeline_stage ON onboarding_pipeline(current_stage);");
  
  await runSQL('RLS', "ALTER TABLE onboarding_pipeline ENABLE ROW LEVEL SECURITY;");
  await runSQL('Policy select', "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all onboarding pipelines' AND tablename = 'onboarding_pipeline') THEN CREATE POLICY 'Admins can view all onboarding pipelines' ON onboarding_pipeline FOR SELECT USING (true); END IF; END $$;");
  await runSQL('Policy all', "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage onboarding pipelines' AND tablename = 'onboarding_pipeline') THEN CREATE POLICY 'Admins can manage onboarding pipelines' ON onboarding_pipeline FOR ALL USING (true); END IF; END $$;");

  await runSQL('Col funnel_lead_id', "ALTER TABLE clients ADD COLUMN IF NOT EXISTS funnel_lead_id TEXT;");
  await runSQL('Col onboarding_started_at', "ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;");

  const { data } = await sb.from('onboarding_pipeline').select('id').limit(1);
  console.log('Pipeline table accessible:', data !== null);
  console.log('Done!');
}
go().catch(e => console.error(e));
