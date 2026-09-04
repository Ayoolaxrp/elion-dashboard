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
const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" };

async function run() {
  const stamp = Date.now().toString(36);
  const id = `lead_qa_probe_${stamp}`;

  // 1) Create a temp row (like the POST route does, WITHOUT email_verified)
  let r = await fetch(`${BASE}/rest/v1/leads?select=*`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ id, contact_name: "QA Probe", email: `qa${stamp}@probe.local`, source: "admin", lead_status: "new" }),
  });
  let body = await r.json();
  console.log("1) INSERT temp lead:", r.status, r.ok ? "OK" : JSON.stringify(body).slice(0, 200));

  // 2) Insert with email_verified (exactly what the current POST route sends)
  r = await fetch(`${BASE}/rest/v1/leads`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ contact_name: "QA Probe 2", email: `qa2${stamp}@probe.local`, email_verified: true, source: "admin" }),
  });
  body = await r.json();
  console.log("2) INSERT w/ email_verified:", r.status, r.ok ? "OK (column exists)" : "ERROR -> " + JSON.stringify(body).slice(0, 300));

  // 3) Try status 'archived'
  r = await fetch(`${BASE}/rest/v1/leads?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ lead_status: "archived" }),
  });
  body = await r.json();
  const okArch = r.ok && body[0] && body[0].lead_status === "archived";
  console.log("3) UPDATE lead_status=archived:", r.status, okArch ? "ACCEPTED" : "REJECTED -> " + JSON.stringify(body).slice(0, 300));

  // 4) Cleanup temp rows
  await fetch(`${BASE}/rest/v1/leads?id=eq.${id}`, { method: "DELETE", headers: H });
  await fetch(`${BASE}/rest/v1/leads?email=like.qa2*${stamp}*`, { method: "DELETE", headers: H });
  await fetch(`${BASE}/rest/v1/leads?email=like.qa${stamp}%40probe.local`, { method: "DELETE", headers: H });
  console.log("--- done ---");
}
run().catch((e) => { console.error("ERR", e); process.exit(1); });
