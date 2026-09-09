// Remove QA audit rows created by this session's verification runs.
// Targets ONLY rows created in the last 3 hours for the QA company names used
// in testing (Mozilla / T / Ingenuity HR via dev-server runs). Real prospect
// audits (20 Lagos + 2 Ingenuity HR from Sep 5) are preserved.
const path = require("path");
const fs = require("fs");
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

(async () => {
  const env = loadEnv(path.join(__dirname, "..", ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  if (!url || !key) { console.error("Missing Supabase env"); process.exit(1); }
  const sb = createClient(url, key);

  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await sb
    .from("audits")
    .select("id, company_name, created_at")
    .gte("created_at", cutoff)
    .in("company_name", ["Mozilla", "T", "Ingenuity HR Solutions"]);
  if (error) { console.error("query error:", error.message); process.exit(1); }

  if (!rows || rows.length === 0) {
    console.log("No session QA audit rows found (0 to delete).");
  } else {
    const ids = rows.map((r) => r.id);
    const { error: del } = await sb.from("audits").delete().in("id", ids);
    if (del) { console.error("delete error:", del.message); process.exit(1); }
    console.log(`Deleted ${ids.length} session QA audit row(s):`, rows.map((r) => `${r.company_name}@${r.created_at.slice(0, 16)}`).join(", "));
  }

  // Also remove any QA lead rows the audit persistence created this session
  // (source=audit, created in the window, for the same QA companies).
  const { data: leads } = await sb
    .from("leads")
    .select("id, email, company_name, created_at")
    .gte("created_at", cutoff)
    .in("company_name", ["Mozilla", "T"]);
  if (leads && leads.length) {
    const { error: delLead } = await sb.from("leads").delete().in("id", leads.map((l) => l.id));
    if (!delLead) console.log(`Deleted ${leads.length} session QA lead row(s).`);
    else console.error("lead delete error:", delLead.message);
  } else {
    console.log("No session QA lead rows found.");
  }

  // Final state check
  const { count } = await sb.from("audits").select("id", { count: "exact", head: true });
  console.log(`Remaining audits total: ${count}`);
})();
