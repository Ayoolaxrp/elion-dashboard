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
  let r = await fetch(`${BASE}/rest/v1/leads?select=*`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ id, contact_name: "QA Probe", email: `qa${stamp}@probe.local`, source: "admin" }),
  });
  if (!r.ok) { console.log("insert failed", r.status, (await r.text()).slice(0, 200)); return; }

  const candidates = ["new","audited","contacted","qualified","paid","lost","won","closed","active","unqualified","junk","no_show","proposal","negotiation","follow_up","archived","lead"];
  for (const c of candidates) {
    r = await fetch(`${BASE}/rest/v1/leads?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ lead_status: c }),
    });
    console.log(c.padEnd(14), r.status === 204 ? "ALLOWED" : "REJECTED " + r.status);
  }
  await fetch(`${BASE}/rest/v1/leads?id=eq.${id}`, { method: "DELETE", headers: H });
  console.log("--- done ---");
}
run().catch((e) => { console.error("ERR", e); process.exit(1); });
