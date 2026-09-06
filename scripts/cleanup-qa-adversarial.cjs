// Removes only the QA rows this adversarial battery created on production.
// Scope: audits + leads from QA-prefixed submissions and their related
// notifications/activity rows. Never touches real prospect audits.
const path = require("path");
const fs = require("fs");
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env = loadEnv(path.join(__dirname, "..", ".env.local"));
const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("missing env"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

(async () => {
  const audits = await sb.from("audits").select("id").ilike("company_name", "QA %");
  if (audits.error) console.error("audit select err", audits.error.message);
  const auditIds = (audits.data || []).map((r) => r.id);
  if (auditIds.length) {
    const del = await sb.from("audits").delete().in("id", auditIds);
    console.log("deleted QA audits:", del.error ? "ERR " + del.error.message : auditIds.length);
  } else console.log("QA audits: none");

  const leadMatches = [];
  const byEmail = await sb.from("leads").select("id, email, company_name").ilike("email", "qa-%@elion.local");
  if (byEmail.data) leadMatches.push(...byEmail.data);
  const byName = await sb.from("leads").select("id, email, company_name").ilike("company_name", "QA %");
  if (byName.data) leadMatches.push(...byName.data);
  const seen = new Set();
  const leadIds = leadMatches.filter((l) => { if (seen.has(l.id)) return false; seen.add(l.id); return true; }).map((l) => l.id);
  console.log("QA leads found:", leadIds.length);
  if (leadIds.length) {
    // notifications whose metadata.lead_id matches
    let notifIds = [];
    for (let i = 0; i < leadIds.length; i += 50) {
      const chunk = leadIds.slice(i, i + 50);
      const q = await sb.from("notifications").select("id, metadata").in("lead_id", chunk);
      if (q.data) notifIds.push(...q.data.map((n) => n.id));
    }
    if (notifIds.length) { const d = await sb.from("notifications").delete().in("id", notifIds); console.log("deleted notifications:", d.error ? "ERR " + d.error.message : notifIds.length); }
    for (let i = 0; i < leadIds.length; i += 50) {
      const chunk = leadIds.slice(i, i + 50);
      await sb.from("activity_log").delete().in("lead_id", chunk);
    }
    const d = await sb.from("leads").delete().in("id", leadIds);
    console.log("deleted leads:", d.error ? "ERR " + d.error.message : leadIds.length);
  }

  const c1 = await sb.from("audits").select("id", { count: "exact", head: true }).ilike("company_name", "QA %");
  const c2 = await sb.from("leads").select("id", { count: "exact", head: true }).ilike("email", "qa-%@elion.local");
  console.log("remaining QA audits:", c1.count, "| remaining QA-submission leads:", c2.count);
})().catch((e) => { console.error(e); process.exit(1); });
