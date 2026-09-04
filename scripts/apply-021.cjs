// Apply supabase/migrations/021_status_page.sql to the live project.
const fs = require("fs");
const path = require("path");
const os = require("os");

const token = process.env.SB_ACCESS_TOKEN || (() => {
  const candidates = [path.join(os.tmpdir(), "sb-token.txt"), path.join(os.tmpdir(), "sb_token.txt")];
  for (const c of candidates) { try { const t = fs.readFileSync(c, "utf8").trim(); if (t) return t; } catch {} }
  return "";
})();
if (!token) { console.error("SB_ACCESS_TOKEN required"); process.exit(1); }

const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "021_status_page.sql"), "utf8");

async function run() {
  const res = await fetch("https://api.supabase.com/v1/projects/dxpzvscfbemywhkehpdm/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("FAIL", res.status, body.slice(0, 800));
    process.exit(1);
  }
  console.log("OK migration 021 applied.");
  const check = await fetch("https://api.supabase.com/v1/projects/dxpzvscfbemywhkehpdm/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT (SELECT count(*) FROM status_daily_snapshots) AS snaps, (SELECT count(*) FROM incident_updates) AS updates, (SELECT count(*) FROM system_status WHERE is_visible AND status <> 'not-configured') AS public_comps;" }),
  });
  const rows = await check.json();
  console.log("VERIFY:", JSON.stringify(rows));
}

run();