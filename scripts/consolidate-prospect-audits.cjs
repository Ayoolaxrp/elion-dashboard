// Merge the 20 good prospect audits into scripts/prospect-audits-results.json:
// rows in the DB (lead_id null, real analysis), kept to the explicit list
// below (the 7 sites the audit bot cannot reach were deliberately dropped).
const KEEP = [
  "Ramos Real Estate", "Chaman Properties", "CW Real Estate", "Oparah Realty",
  "Palton Morgan Holdings", "Zylus Group", "Vines Realty", "Adron Homes",
  "Alpha Mead Group", "Veritasi Homes", "Gracias Global", "Megamound",
  "Homework Group", "Homely (Lagos)", "Jupitaar", "Broll Nigeria",
  "27th Development", "Knight Frank Nigeria", "Jide Taiwo & Co", "Sujimoto Group",
];
const path = require("path");
const fs = require("fs");
const { createClient } = require(path.join(process.cwd(), "node_modules", "@supabase/supabase-js"));
const env = {};
for (const line of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function toRow(a) {
  const findings = Array.isArray(a.findings) ? a.findings : Array.isArray(a.leaks) ? a.leaks : [];
  return {
    name: a.name || a.company_name,
    website: a.website,
    type: a.type || a.industry,
    score: a.score ?? a.overall_score,
    leakCount: a.leakCount ?? a.leak_count ?? findings.length,
    critical: a.critical ?? a.criticalLeaks ?? a.critical_leaks ?? findings.filter((f) => f.severity === "critical").length,
    high: a.high ?? a.highLeaks ?? a.high_leaks ?? findings.filter((f) => f.severity === "high").length,
    summary: a.summary || "",
    findings,
    recommendations: a.recommendations || a.automationRecommendations || null,
    auditId: a.auditId || a.id || null,
    totalSavings: a.totalSavings || null,
    hasWhatsApp: a.hasWhatsApp ?? null,
    hasOnlineBooking: a.hasOnlineBooking ?? null,
    created_at: a.created_at || null,
  };
}

(async () => {
  const rows = [];
  const { data: audits, error } = await sb
    .from("audits")
    .select("id,company_name,website,industry,overall_score,leak_count,critical_leaks,high_leaks,summary,findings,recommendations,created_at")
    .is("lead_id", null)
    .order("created_at", { ascending: false });
  if (error) { console.log("DB ERR", error.message); return; }
  for (const a of audits || []) {
    if (a.overall_score === null || !KEEP.includes(a.company_name)) continue;
    rows.push(toRow(a));
  }
  rows.sort((a, b) => (a.score ?? 0) - (b.score ?? 0)); // worst first = outreach priority
  fs.writeFileSync(path.join(__dirname, "prospect-audits-results.json"), JSON.stringify(rows, null, 2));
  console.log(`Consolidated ${rows.length} prospect audits -> scripts/prospect-audits-results.json`);
  for (const r of rows) {
    const top = (r.findings || []).find((f) => f.severity === "critical") || (r.findings || [])[0];
    console.log(`- ${r.name} [${r.type}] score=${r.score} crit=${r.critical} high=${r.high} | top: ${top ? top.area + " (" + top.severity + ")" : ""}`);
  }
})();