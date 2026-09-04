// Apply supabase/migrations/020_proposal_source_audit.sql to the live project.
const fs = require("fs");
const path = require("path");

const token = process.env.SB_ACCESS_TOKEN;
if (!token) { console.error("SB_ACCESS_TOKEN required"); process.exit(1); }

const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "020_proposal_source_audit.sql"), "utf8");

async function run() {
  const res = await fetch("https://api.supabase.com/v1/projects/dxpzvscfbemywhkehpdm/database/query", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("FAIL", res.status, body.slice(0, 500));
    process.exit(1);
  }
  console.log("OK migration 020 applied (empty result = statements ran).");

  // Verify column exists
  const check = await fetch("https://api.supabase.com/v1/projects/dxpzvscfbemywhkehpdm/database/query", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='proposals' AND column_name='source_audit_id';" }),
  });
  const rows = await check.json();
  console.log("VERIFY:", JSON.stringify(rows));
}
run().catch((e) => { console.error("ERR", e); process.exit(1); });