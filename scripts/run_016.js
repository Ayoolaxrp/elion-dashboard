// Run migration 016 (bookings + booking_settings) against Supabase
// Usage: node --env-file=.env.local scripts/run_016.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSQL(label, sql) {
  const { data, error } = await sb.rpc('exec_sql', { query: sql });
  const ok = !error && data !== 'ERROR: ' && !String(data || '').startsWith('ERROR');
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${error ? ' :: ' + error.message : data && String(data) !== 'OK' ? ' :: ' + data : ''}`);
  return !error && !String(data || '').startsWith('ERROR');
}

async function go() {
  await runSQL('ensure exec_sql fn', `CREATE OR REPLACE FUNCTION exec_sql(query TEXT) RETURNS TEXT AS $$ BEGIN EXECUTE query; RETURN 'OK'; EXCEPTION WHEN OTHERS THEN RETURN 'ERROR: ' || SQLERRM; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`);

  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '016_bookings.sql'), 'utf8');
  // Drop full-line comments first so a statement never starts with '--'.
  const clean = sql
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n');
  // Split on ";\n" — the migration avoids semicolons inside string literals.
  const statements = clean
    .split(/;\s*\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s);

  console.log(`\n=== RUNNING ${statements.length} STATEMENTS ===`);
  let okCount = 0;
  for (let i = 0; i < statements.length; i++) {
    const label = statements[i].split('\n')[0].slice(0, 70);
    const ok = await runSQL(`[${i + 1}/${statements.length}] ${label}`, statements[i]);
    if (ok) okCount++;
  }
  console.log(`\n${okCount}/${statements.length} statements OK`);

  // Verify
  console.log('\n=== VERIFY ===');
  for (const t of ['bookings', 'booking_settings']) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    console.log(`  ${t}: ${error ? 'MISSING (' + error.message + ')' : count + ' rows'}`);
  }
  const { data: cfg } = await sb.from('booking_settings').select('value').eq('key', 'config').single();
  console.log('  config defaults:', cfg ? JSON.stringify(cfg.value).slice(0, 120) + '…' : 'MISSING');
}

go().catch((e) => { console.error(e); process.exit(1); });
