const fs = require("fs");
function loadEnv(p) {
  const env = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = { ...loadEnv(".env.local"), ...process.env };
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" };

async function run() {
  // columns
  let r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads?select=*&limit=1`, { headers: H });
  const body = await r.json();
  const row = Array.isArray(body) ? body[0] : body;
  if (row && typeof row === "object") {
    console.log("COLUMNS:", Object.keys(row).join(", "));
    console.log("SAMPLE:", JSON.stringify(row).slice(0, 900));
  } else {
    console.log("no rows / response:", JSON.stringify(body).slice(0, 300));
  }
  // check constraint on lead_status
  r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads?select=id&limit=0`, { headers: H });
  // try information_schema for check constraints
  const q = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/nonexistent_check`;
  console.log("statuses fetch skipped");
  // constraint via postgrest? use raw sql endpoint unavailable. Try inserting nothing; instead fetch pg_constraint via supabase? skip.
  console.log("--- done ---");
}
run().catch((e) => { console.error("ERR", e); process.exit(1); });
