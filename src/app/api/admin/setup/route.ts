import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email || !(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes(email.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results: string[] = [];

    // Run all SQL statements
    const statements = [
      `CREATE OR REPLACE FUNCTION exec_sql(query TEXT) RETURNS TEXT AS $$ BEGIN EXECUTE query; RETURN 'OK'; EXCEPTION WHEN OTHERS THEN RETURN SQLERRM; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`,
      `CREATE TABLE IF NOT EXISTS onboarding_pipeline (id TEXT PRIMARY KEY DEFAULT ('ob_' || replace(gen_random_uuid()::text, '-', '')), client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE, current_stage TEXT NOT NULL DEFAULT 'welcome', stage_status TEXT NOT NULL DEFAULT 'in_progress', welcome_completed_at TIMESTAMPTZ, kickoff_completed_at TIMESTAMPTZ, kickoff_date DATE, kickoff_time TEXT, kickoff_call_link TEXT, configuration_completed_at TIMESTAMPTZ, build_completed_at TIMESTAMPTZ, testing_completed_at TIMESTAMPTZ, launch_completed_at TIMESTAMPTZ, handover_completed_at TIMESTAMPTZ, welcome_email_sent BOOLEAN DEFAULT FALSE, welcome_email_sent_at TIMESTAMPTZ, kickoff_message_sent BOOLEAN DEFAULT FALSE, kickoff_message_sent_at TIMESTAMPTZ, completion_email_sent BOOLEAN DEFAULT FALSE, completion_email_sent_at TIMESTAMPTZ, admin_notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), CONSTRAINT unique_active_pipeline UNIQUE (client_id));`,
      `CREATE INDEX IF NOT EXISTS idx_onboarding_pipeline_client ON onboarding_pipeline(client_id);`,
      `CREATE INDEX IF NOT EXISTS idx_onboarding_pipeline_stage ON onboarding_pipeline(current_stage);`,
      `ALTER TABLE onboarding_pipeline ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS funnel_lead_id TEXT;`,
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;`,
    ];

    for (const sql of statements) {
      const { data, error } = await sb.rpc("exec_sql", { query: sql });
      results.push(`${error ? "FAIL" : "OK"}: ${sql.substring(0, 60)}... ${error ? error.message : data}`);
    }

    // Check if pipeline table exists
    const { data: check } = await sb.from("onboarding_pipeline").select("id").limit(1);
    results.push("Pipeline table accessible: " + (check !== null));

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
