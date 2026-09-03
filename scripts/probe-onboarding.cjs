// Probe: does GET /api/onboarding/:id work without an admin session (client link)?
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const env = loadEnv();
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function go() {
  const { data } = await sb.from("clients").select("id, company_name").order("created_at", { ascending: false }).limit(1);
  const client = data && data[0];
  if (!client) { console.log("no clients in db"); return; }
  console.log("client:", client.id, client.company_name);
  const res = await fetch(`https://elion.com.ng/api/onboarding/${client.id}`);
  console.log("GET /api/onboarding/:id status:", res.status);
  const body = await res.text();
  console.log("body:", body.slice(0, 200));
}
go().catch((e) => { console.error(e); process.exit(1); });
