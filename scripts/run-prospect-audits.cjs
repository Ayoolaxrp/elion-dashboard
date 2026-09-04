// Run the real ELION audit (production /api/audit) against prospect candidates.
// These audits persist as prospect leads/audits in the admin pipeline (no
// fabricated contact info — no email is submitted, lead_id stays null).
// Results are saved to scripts/prospect-audits-results.json.
// Usage: node scripts/run-prospect-audits.cjs
const fs = require("fs");
const path = require("path");

const BASE = process.env.PROSPECT_AUDIT_BASE || "https://elion.com.ng";
const candidates = JSON.parse(
  fs.readFileSync(path.join(__dirname, "prospect-candidates.json"), "utf8")
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOne(c, industry) {
  const started = Date.now();
  const r = await fetch(`${BASE}/api/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: c.name,
      industry,
      website: c.website,
      name: "",
      email: "",
    }),
  });
  const ms = Date.now() - started;
  const body = await r.json().catch(() => null);
  if (r.status === 429) {
    const retryAfter = parseInt(r.headers.get("retry-after") || "60", 10);
    return { retryAfter: Math.max(retryAfter, 45) };
  }
  return { r, ms, body };
}

(async () => {
  const results = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const industry =
      c.type === "developer" ? "Real Estate Development"
      : c.type === "property-management" ? "Property Management"
      : c.type === "shortlet" ? "Short-Let / Vacation Rentals"
      : "Real Estate";
    process.stdout.write(`[${i + 1}/${candidates.length}] ${c.name} ... `);
    try {
      let out = null;
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          out = await runOne(c, industry);
          break;
        } catch (e) {
          if (attempt === 4) throw e;
          process.stdout.write("net-retry ");
          await sleep(8000);
        }
      }
      if (out.retryAfter) {
        console.log(`rate-limited — waiting ${out.retryAfter}s`);
        await sleep(out.retryAfter * 1000);
        i--; // retry this candidate
        continue;
      }
      const { r, ms, body } = out;
      if (!r.ok) {
        console.log(`FAIL status=${r.status} (${ms}ms)`);
        results.push({ ...c, ok: false, status: r.status, ms, error: (body && body.error) || "" });
        continue;
      }
      const leaks = Array.isArray(body.leaks) ? body.leaks : [];
      const critical = leaks.filter((l) => l.severity === "critical");
      const high = leaks.filter((l) => l.severity === "high");
      const top = critical[0] || high[0] || leaks[0] || null;
      console.log(`ok score=${body.overallScore} leaks=${leaks.length} crit=${critical.length} high=${high.length} (${ms}ms) website=${body.webResearch && body.webResearch.hasWebsite}`);
      results.push({
        ...c,
        ok: true,
        ms,
        score: body.overallScore,
        subScores: body.scores,
        leaks,
        criticalLeaks: body.criticalLeaks,
        highLeaks: body.highLeaks,
        totalSavings: body.totalSavings,
        hasWebsite: !!(body.webResearch && body.webResearch.hasWebsite),
        websiteScore: body.webResearch && body.webResearch.websiteScore,
        hasWhatsApp: !!(body.webResearch && body.webResearch.hasWhatsApp),
        hasOnlineBooking: !!(body.webResearch && body.webResearch.hasOnlineBooking),
        hasCRM: !!(body.webResearch && body.webResearch.hasCRM),
        quickWins: (body.webResearch && body.webResearch.quickWins) || [],
        recommendations: body.automationRecommendations || {},
        topLeak: top ? { area: top.area, severity: top.severity, description: top.description, evidenceLevel: top.evidenceLevel, recommendation: top.recommendation } : null,
        analyzedAt: body.analyzedAt,
      });
    } catch (e) {
      console.log(`ERROR ${e && e.message}`);
      results.push({ ...c, ok: false, error: e && e.message });
    }
    await sleep(7500); // stay under the 10/min rate limit
  }

  fs.writeFileSync(
    path.join(__dirname, "prospect-audits-results.json"),
    JSON.stringify(results, null, 2)
  );
  // Clean up rows from PREVIOUS runner executions only (before this run
  // started) so we never delete the fresh audits just created above.
  try {
    const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));
    const env = {};
    for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
    const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const websites = candidates.map((c) => c.website);
    const runStart = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min window
    const { data: stale } = await sb
      .from("audits")
      .select("id")
      .is("lead_id", null)
      .in("website", websites)
      .lt("created_at", runStart);
    for (const a of stale || []) await sb.from("audits").delete().eq("id", a.id);
    console.log(`\nCleanup: removed ${(stale || []).length} stale runner audits older than this run.`);
  } catch (e) {
    console.log("Cleanup skipped:", e && e.message);
  }

  const ok = results.filter((r) => r.ok);
  console.log(`\nDONE: ${ok.length}/${results.length} audits succeeded -> scripts/prospect-audits-results.json`);
  console.log("\nTop leaks summary:");
  for (const r of ok) {
    const t = r.topLeak;
    console.log(`- ${r.name} [${r.type}] score=${r.score} | top: ${t ? t.area + " (" + t.severity + ")" : "none"}`);
  }
})();