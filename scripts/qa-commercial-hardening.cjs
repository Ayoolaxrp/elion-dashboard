// QA: commercial lifecycle hardening verification on production.
// Covers the original 33 checks plus: payment idempotency (double mark-paid),
// lead-linked payment, invalid transition rejection, 404 on unknown ids,
// non-admin authenticated user blocked, and the /api/admin/commercial gate.
// Usage: node scripts/qa-commercial-hardening.cjs
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
const uid = "qa-hard-" + Date.now();
const createdIds = { proposals: [], contracts: [], invoices: [], payments: [], leads: [] };
let nonAdminUserId = null;

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

    // ---- ANONYMOUS GATE (all commercial admin routes + the combined route) ----
    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    const anonStatus = await anonPage.evaluate(async () => {
      const out = {};
      for (const u of ["/api/admin/proposals", "/api/admin/contracts", "/api/admin/invoices", "/api/admin/payments"]) {
        out[u] = (await fetch(u)).status;
      }
      out["commercial GET"] = (await fetch("/api/admin/commercial?client_id=x")).status;
      out["commercial POST"] = (await fetch("/api/admin/commercial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_payment" }) })).status;
      out["commercial PATCH"] = (await fetch("/api/admin/commercial", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })).status;
      return out;
    });
    for (const [k, v] of Object.entries(anonStatus)) {
      check(`anonymous ${k} -> 401`, v === 401, `status=${v}`);
    }
    await anon.close();

    // ---- NON-ADMIN AUTHENTICATED USER GATE ----
    console.log("\n== NON-ADMIN USER ==");
    const nonAdminEmail = `nonadmin-${uid}@example.com`;
    const { data: createdUser, error: createErr } = await sb.auth.admin.createUser({
      email: nonAdminEmail,
      password: "TestPass123!",
      email_confirm: true,
    });
    check("create non-admin test user", !createErr && !!createdUser?.user?.id, createErr?.message || "");
    nonAdminUserId = createdUser?.user?.id || null;
    if (createdUser?.user?.id) {
      const naCtx = await browser.createBrowserContext();
      const naPage = await naCtx.newPage();
      await naPage.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
      await naPage.waitForSelector('input[type="email"]', { timeout: 20000 });
      await naPage.type('input[type="email"]', nonAdminEmail, { delay: 10 });
      await naPage.type('input[type="password"]', "TestPass123!", { delay: 10 });
      await naPage.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
      await sleep(3500);
      const naStatus = await naPage.evaluate(async () => {
        const out = {};
        for (const u of ["/api/admin/proposals", "/api/admin/contracts", "/api/admin/invoices", "/api/admin/payments", "/api/admin/commercial?client_id=x"]) {
          out[u] = (await fetch(u)).status;
        }
        return out;
      });
      for (const [k, v] of Object.entries(naStatus)) {
        check(`non-admin ${k} -> 401`, v === 401, `status=${v}`);
      }
      await naCtx.close();
    }

    // ---- AUTHENTICATED API HELPER ----
    const api = async (url, opts = {}) => {
      return page.evaluate(async ({ u, o }) => {
        const r = await fetch("https://elion.com.ng" + u, {
          method: o.method || "GET",
          headers: { "Content-Type": "application/json", ...(o.headers || {}) },
          body: o.body ? JSON.stringify(o.body) : undefined,
        });
        let j = null;
        try { j = await r.json(); } catch {}
        return { status: r.status, body: j };
      }, { u: url, o: opts });
    };

    // ---- FULL PIPELINE ----
    console.log("\n== PROPOSAL -> CONTRACT -> INVOICE -> PAYMENT ==");
    const prop = await api("/api/admin/proposals", { method: "POST", body: {
      title: "QA Hardening " + uid, company_name: "QA Hard Corp", client_name: "QA Hard Client",
      client_email: uid + "@example.com", total_setup: 300000, total_monthly: 75000,
    }});
    const propId = prop.body?.proposal?.id;
    check("create proposal", prop.status === 200 && !!propId, `status=${prop.status}`);
    createdIds.proposals.push(propId);

    // Invalid transitions on proposal
    const skipAccept = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "accepted" } });
    check("draft -> accepted rejected (400)", skipAccept.status === 400, `status=${skipAccept.status} ${skipAccept.body?.error || ""}`);
    const skipSign = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "rejected" } });
    check("draft -> rejected rejected (400)", skipSign.status === 400, `status=${skipSign.status}`);

    const sent = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "sent" } });
    check("proposal sent", sent.status === 200 && sent.body?.proposal?.status === "sent", `status=${sent.status}`);
    const accepted = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "accepted" } });
    check("proposal accepted", accepted.status === 200 && accepted.body?.proposal?.status === "accepted", `status=${accepted.status}`);
    // Re-sending an accepted proposal must fail
    const resend = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "sent" } });
    check("accepted -> sent rejected (400)", resend.status === 400, `status=${resend.status}`);

    // 404 on unknown proposal
    const ghostProp = await api("/api/admin/proposals", { method: "PATCH", body: { id: "prop_does-not-exist", status: "sent" } });
    check("unknown proposal -> 404", ghostProp.status === 404, `status=${ghostProp.status}`);

    const cont = await api("/api/admin/contracts", { method: "POST", body: { proposal_id: propId } });
    const contId = cont.body?.contract?.id;
    check("contract from accepted proposal", cont.status === 200 && !!contId, `status=${cont.status} ${cont.body?.error || ""}`);
    createdIds.contracts.push(contId);
    check("contract inherits company+amount", cont.body?.contract?.company_name === "QA Hard Corp" && cont.body?.contract?.total_amount === 300000);

    const earlySign = await api("/api/admin/contracts", { method: "PATCH", body: { id: contId, status: "signed" } });
    check("draft contract -> signed rejected (400)", earlySign.status === 400, `status=${earlySign.status}`);
    const cSent = await api("/api/admin/contracts", { method: "PATCH", body: { id: contId, status: "sent" } });
    check("contract sent", cSent.status === 200, `status=${cSent.status}`);
    const cSigned = await api("/api/admin/contracts", { method: "PATCH", body: { id: contId, status: "signed", signatory: "QA Signatory" } });
    check("contract signed", cSigned.status === 200 && cSigned.body?.contract?.status === "signed" && cSigned.body?.contract?.signatory === "QA Signatory", `status=${cSigned.status}`);

    const inv = await api("/api/admin/invoices", { method: "POST", body: { title: "Hard Invoice " + uid, company_name: "QA Hard Corp", client_name: "QA Hard Client", amount: 300000 } });
    const invId = inv.body?.invoice?.id;
    check("create invoice", inv.status === 200 && !!invId, `status=${inv.status}`);
    createdIds.invoices.push(invId);

    // mark paid twice -> idempotent, exactly one payment row
    const pay1 = await api("/api/admin/invoices", { method: "PATCH", body: { id: invId, status: "paid", reference: "QA-HARD-" + uid } });
    check("invoice paid #1", pay1.status === 200 && pay1.body?.invoice?.status === "paid", `status=${pay1.status}`);
    const pay2 = await api("/api/admin/invoices", { method: "PATCH", body: { id: invId, status: "paid", reference: "QA-HARD-2" } });
    check("invoice paid #2 idempotent", pay2.status === 200 && pay2.body?.invoice?.status === "paid", `status=${pay2.status}`);
    const { data: payRows } = await sb.from("payments").select("id, invoice_id, amount, status, reference").eq("invoice_id", invId);
    check("exactly one payment row after double mark-paid", (payRows || []).length === 1, `count=${(payRows || []).length}`);
    if (payRows?.length === 1) {
      check("payment amount correct", payRows[0].amount === 300000, String(payRows[0].amount));
      check("payment status success", payRows[0].status === "success", payRows[0].status);
      check("first reference preserved", payRows[0].reference === "QA-HARD-" + uid, payRows[0].reference);
      createdIds.payments.push(payRows[0].id);
    }
    // Invoice state transitions: paid -> sent must fail
    const badInv = await api("/api/admin/invoices", { method: "PATCH", body: { id: invId, status: "sent" } });
    check("paid invoice -> sent rejected (400)", badInv.status === 400, `status=${badInv.status}`);
    const ghostInv = await api("/api/admin/invoices", { method: "PATCH", body: { id: "inv_nope", status: "paid" } });
    check("unknown invoice -> 404", ghostInv.status === 404, `status=${ghostInv.status}`);

    // ---- LEAD-LINKED PAYMENT ----
    console.log("\n== LEAD-LINKED PAYMENT ==");
    const lead = await api("/api/admin/leads", { method: "POST", body: {
      contact_name: "QA Hard Lead", email: `lead-${uid}@example.com`, phone: "+2348000000000",
      company_name: "QA Lead Co", website: "https://qalead.example", industry: "QA", primary_problem: "lead-linked payment",
    }});
    const leadId = lead.body?.lead?.id;
    check("create lead for payment", lead.status === 200 && !!leadId, `status=${lead.status}`);
    if (leadId) createdIds.leads.push(leadId);

    const lp = await api("/api/admin/payments", { method: "POST", body: { lead_id: leadId, amount: 150000, method: "bank_transfer", reference: "QA-LEADPAY-" + uid, status: "success" } });
    check("lead-linked payment created", lp.status === 200 && !!lp.body?.payment?.id, `status=${lp.status} ${lp.body?.error || ""}`);
    if (lp.body?.payment?.id) {
      createdIds.payments.push(lp.body.payment.id);
      check("lead_id persisted", lp.body.payment.lead_id === leadId, lp.body.payment.lead_id);
      check("company resolved from lead", lp.body.payment.company_name === "QA Lead Co", lp.body.payment.company_name);
      check("lead-linked amount", lp.body.payment.amount === 150000, String(lp.body.payment.amount));
    }
    const badLead = await api("/api/admin/payments", { method: "POST", body: { lead_id: "lead_nope", amount: 100 } });
    check("payment with unknown lead -> 404", badLead.status === 404, `status=${badLead.status}`);

    // ---- STANDALONE PAYMENT (no lead) ----
    console.log("\n== STANDALONE PAYMENT ==");
    const sp = await api("/api/admin/payments", { method: "POST", body: { company_name: "QA Standalone Co", amount: 50000, method: "bank_transfer", reference: "QA-STAND-" + uid, status: "success" } });
    check("standalone payment created", sp.status === 200 && !!sp.body?.payment?.id, `status=${sp.status}`);
    if (sp.body?.payment?.id) {
      createdIds.payments.push(sp.body.payment.id);
      check("standalone lead_id is null", sp.body.payment.lead_id === null, String(sp.body.payment.lead_id));
    }

    // ---- LISTS CONTAIN ALL (no inner-join hiding) ----
    console.log("\n== LISTS ==");
    const listPays = await api("/api/admin/payments");
    const listPayIds = new Set((listPays.body?.payments || []).map((x) => x.id));
    check("standalone + lead-linked + auto payments all listed", createdIds.payments.every((id) => listPayIds.has(id)), `${createdIds.payments.length} expected`);

    // ---- VALIDATION 4xx ----
    const b1 = await api("/api/admin/proposals", { method: "POST", body: { title: "" } });
    check("proposal missing title -> 400", b1.status === 400, `status=${b1.status}`);
    const b2 = await api("/api/admin/invoices", { method: "POST", body: { title: "X", amount: 0 } });
    check("invoice zero amount -> 400", b2.status === 400, `status=${b2.status}`);
    const b3 = await api("/api/admin/payments", { method: "POST", body: { amount: -5 } });
    check("payment negative amount -> 400", b3.status === 400, `status=${b3.status}`);
    const b4 = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "bogus" } });
    check("invalid status value -> 400", b4.status === 400, `status=${b4.status}`);

    // ---- PAGES RENDER ----
    console.log("\n== PAGES ==");
    for (const p of ["/admin/proposals", "/admin/contracts", "/admin/invoices", "/admin/payments"]) {
      await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
      await sleep(1800);
      const txt = await page.evaluate(() => document.body.innerText).catch(() => "");
      check(`page ${p} renders real data`, txt.includes("QA Hard Corp") || txt.includes("QA Lead Co") || txt.includes("QA Hardening") || txt.includes("Hard Invoice"), p);
    }
    // payments page must NOT crash showing a payment without lead_id (company shown)
    await page.goto(BASE + "/admin/payments", { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
    await sleep(1800);
    const payTxt = await page.evaluate(() => document.body.innerText).catch(() => "");
    check("payments page shows standalone company (null lead safe)", payTxt.includes("QA Standalone Co"), "");
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    // ---- CLEANUP ----
    console.log("\n== CLEANUP ==");
    const jobs = [
      ...createdIds.payments.map((id) => sb.from("payments").delete().eq("id", id)),
      ...createdIds.invoices.map((id) => sb.from("invoices").delete().eq("id", id)),
      ...createdIds.contracts.map((id) => sb.from("contracts").delete().eq("id", id)),
      ...createdIds.proposals.map((id) => sb.from("proposals").delete().eq("id", id)),
      ...createdIds.leads.map((id) => sb.from("leads").delete().eq("id", id)),
    ];
    const results = await Promise.allSettled(jobs);
    const ok = results.every((r) => r.status === "fulfilled" && !r.value.error);
    check("cleanup commercial rows", ok, results.filter((r) => r.status === "rejected" || r.value.error).length + " failed");
    await sb.from("proposals").delete().like("title", "%" + uid + "%");
    await sb.from("invoices").delete().like("title", "%" + uid + "%");
    if (nonAdminUserId) {
      const { error: delErr } = await sb.auth.admin.deleteUser(nonAdminUserId);
      check("cleanup non-admin user", !delErr, delErr?.message || "");
    }
    await sb.from("leads").delete().like("email", "%" + uid + "%");
    await browser.close();
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();