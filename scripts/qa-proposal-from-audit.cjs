// QA: proposal-from-audit (first-client sales package).
// Verifies on production: real audit -> POST /api/admin/proposals with audit_id
// maps findings into Problem -> Evidence -> Recommended system -> Scope -> Price,
// appears in the list, invalid audit ids return 404, and cleanup is clean.
// Usage: node scripts/qa-proposal-from-audit.cjs
const path = require("path");
const fs = require("fs");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, "..", ".env.local");
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BASE = "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = "Ayoolamikun$123";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = "qa-pfa-" + Date.now();
const qaEmail = uid + "@example.com";

// Node fetch to Supabase occasionally fails transiently; retry a few times.
async function qry(fn, tries = 3) {
  let lastErr = null;
  for (let i = 0; i < tries; i++) {
    try {
      const out = await fn();
      if (out && out.error) throw out.error;
      return out;
    } catch (e) {
      lastErr = e;
      await sleep(2000);
    }
  }
  return { data: null, error: lastErr };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();

  try {
    // ---- LOGIN ----
    await page.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("admin login", page.url().includes("/admin"), page.url());

    // ---- 1. Run a real audit (same API the funnel uses) ----
    let auditId = null;
    try {
      const resp = await page.evaluate(async (body) => {
        const r = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
      }, {
        company_name: "QA Test Realty — " + uid.slice(-6),
        industry: "Real Estate",
        website: "https://www.landmarkng.com",
        name: "QA Tester",
        email: qaEmail,
      });
      check("real audit runs (POST /api/audit)", resp.ok && resp.status === 200, `status=${resp.status}`);
      if (resp.body) {
        check("audit returns a score", typeof resp.body.overallScore === "number", `score=${resp.body.overallScore}`);
        check("audit returns findings", Array.isArray(resp.body.leaks) && resp.body.leaks.length > 0, `findings=${resp.body.leaks ? resp.body.leaks.length : 0}`);
        check("audit returns automation recommendations", !!(resp.body.automationRecommendations && resp.body.automationRecommendations.needs), `needs=${resp.body.automationRecommendations ? (resp.body.automationRecommendations.needs || []).length : 0}`);
      }
    } catch (e) {
      check("real audit runs (POST /api/audit)", false, errMsg(e));
    }

    // Locate the created audit row via the linked lead (service role).
    await sleep(4000);
    const { data: qaLeads, error: leadErr } = await qry(() => sb.from("leads").select("id").eq("email", qaEmail).limit(1));
    const qaLeadId = qaLeads && qaLeads[0] && qaLeads[0].id;
    if (!qaLeadId) console.log("DEBUG lead lookup: email=", qaEmail, "rows=", JSON.stringify(qaLeads), "err=", leadErr && leadErr.message);
    let audit = null;
    if (qaLeadId) {
      const { data: audits } = await qry(() =>
        sb
          .from("audits")
          .select("id, status, overall_score, critical_leaks, high_leaks, findings, lead_id, company_name")
          .eq("lead_id", qaLeadId)
          .order("created_at", { ascending: false })
          .limit(1)
      );
      audit = audits && audits[0];
    }
    check("audit row persisted (status completed)", !!audit && audit.status === "completed", audit ? `score=${audit.overall_score} critical=${audit.critical_leaks}` : "no row");
    if (audit) auditId = audit.id;

    // ---- 2. Anonymous gate on proposals POST ----
    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    const anonResp = await anonPage.evaluate(async () => {
      const r = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "anon" }),
      });
      return r.status;
    });
    check("anonymous proposal POST blocked (401)", anonResp === 401, `status=${anonResp}`);
    await anon.close();

    // ---- 3. Create proposal from the audit ----
    let proposalId = null;
    if (auditId) {
      const resp = await page.evaluate(async (body) => {
        const r = await fetch("/api/admin/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        return { ok: r.ok, status: r.status, body: await r.json().catch(() => null) };
      }, {
        audit_id: auditId,
        total_setup: 350000,
        total_monthly: 50000,
        valid_until: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      });
      check("proposal created from audit", resp.ok && resp.status === 200, `status=${resp.status}`);
      const p = resp.body && resp.body.proposal;
      if (p) {
        proposalId = p.id;
        check("proposal title references the audited business", /QA Test Realty/.test(p.title || ""), p.title);
        check("proposal company from audit/lead", /QA Test Realty/.test(p.company_name || ""), p.company_name);
        check("proposal summary cites score + leaks", /score|critical|high/i.test(p.summary || ""), (p.summary || "").slice(0, 90));
        check("proposal has mapped line items", Array.isArray(p.items) && p.items.length >= 2, `items=${p.items ? p.items.length : 0}`);
        const scopeItem = (p.items || []).find((i) => i.status === "scope");
        check("scope item includes implementation+handover", !!scopeItem && /implementation|configuration|handover/i.test(scopeItem.automation_name + " " + (scopeItem.description || "")), "");
        check("setup price on proposal", Number(p.total_setup) === 350000, `setup=${p.total_setup}`);
        check("monthly price on proposal", Number(p.total_monthly) === 50000, `monthly=${p.total_monthly}`);
        check("source_audit_id persisted", p.source_audit_id === auditId, p.source_audit_id);
        check("proposal starts as draft", p.status === "draft", p.status);
        check("lead linkage preserved", p.lead_id === audit.lead_id, `lead=${p.lead_id}`);
      }
    }

    // ---- 4. Proposal appears in the list ----
    if (proposalId) {
      const resp = await page.evaluate(async () => {
        const r = await fetch("/api/admin/proposals");
        return { ok: r.ok, body: await r.json().catch(() => null) };
      });
      const found = (resp.body && resp.body.proposals || []).some((x) => x.id === proposalId);
      check("proposal appears in GET /api/admin/proposals", resp.ok && found, "");
    }

    // ---- 5. Invalid / not-completed audit ids -> controlled 4xx ----
    const respBad = await page.evaluate(async () => {
      const r = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit_id: "00000000-0000-0000-0000-000000000000" }),
      });
      return r.status;
    });
    check("unknown audit_id -> 404 (not 500)", respBad === 404, `status=${respBad}`);

    let pendingLeadId = null;
    if (qaLeadId) {
      const { data: pl } = await qry(() => sb.from("leads").select("id").eq("id", qaLeadId).maybeSingle());
      pendingLeadId = (pl && pl.id) || null;
    }
    const { data: pendingAudit } = await qry(() =>
      sb
        .from("audits")
        .insert({
          lead_id: pendingLeadId,
          company_name: "QA Pending Co",
          status: "processing",
          overall_score: 0,
          findings: [],
        })
        .select("id")
        .single()
    );
    if (pendingAudit) {
      const respPending = await page.evaluate(async (id) => {
        const r = await fetch("/api/admin/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audit_id: id }),
        });
        return r.status;
      }, pendingAudit.id);
      check("not-completed audit -> 404", respPending === 404, `status=${respPending}`);
    }

    // ---- CLEANUP (all qa-pfa rows, including leftovers from earlier runs) ----
    if (proposalId) await sb.from("proposals").delete().eq("id", proposalId);
    if (auditId) await sb.from("audits").delete().eq("id", auditId);
    if (pendingAudit) await sb.from("audits").delete().eq("id", pendingAudit.id);
    const { data: leadRows } = await sb.from("leads").select("id").ilike("email", "qa-pfa-%");
    const { data: allAudits } = await sb.from("audits").select("id").in("lead_id", (leadRows || []).map((l) => l.id));
    for (const a of allAudits || []) await sb.from("audits").delete().eq("id", a.id);
    for (const l of leadRows || []) await sb.from("leads").delete().eq("id", l.id);
    const { count: leftovers } = await sb
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("source_audit_id", auditId || "00000000-0000-0000-0000-000000000000");
    check("cleanup complete (no orphan proposals)", !leftovers, `orphans=${leftovers || 0}`);

    await browser.close();
  } catch (e) {
    console.error("SCRIPT ERROR:", e && e.message ? e.message : e);
    try { await browser.close(); } catch {}
  }

  console.log(`\nRESULT: ${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
})();

function errMsg(e) {
  return e && e.message ? e.message : String(e);
}