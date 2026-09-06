const path = require("path");
const fs = require("fs");
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

function loadEnv(f) {
  const o = {};
  for (const l of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return o;
}
(async () => {
  const env = loadEnv(path.join(__dirname, "..", ".env.local"));
  const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const del = await sb.from("audits").delete().eq("company_name", "Deploy Probe QA");
  console.log("deleted probe rows:", del.error ? "ERR " + del.error.message : "ok");
  const res = await fetch("https://elion.com.ng/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://elion.com.ng" },
    body: JSON.stringify({ company_name: "Ingenuity HR Solutions", industry: "Recruitment", website: "https://ingenuityhrm.com" }),
  });
  const j = await res.json();
  const fb = (j.webResearch.socialLinks || []).find((s) => s.platform === "Facebook");
  console.log("facebook link now:", fb ? fb.url : "(none)");
})().catch((e) => { console.error(e); process.exit(1); });
