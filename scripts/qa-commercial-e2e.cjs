// QA: commercial lifecycle end-to-end on production APIs.
// proposal (create -> sent -> accepted) -> contract (from proposal -> signed)
// -> invoice (create -> paid, auto payment row) -> separate payment record.
// Cleans up all test rows afterward.
// Usage: node scripts/qa-commercial-e2e.cjs
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
const uid = "qa-comm-" + Date.now();
const createdIds = { proposals: [], contracts: [], invoices: [], payments: [] };

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

    // ---- ANONYMOUS ----
    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    for (const ep of ["/api/admin/proposals", "/api/admin/contracts", "/api/admin/invoices", "/api/admin/payments"]) {
      const st = await anonPage.evaluate(async (u) => (await fetch(u)).status, ep);
      check(`anonymous ${ep} -> 401`, st === 401, `status=${st}`);
    }
    await anon.close();

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

    // ---- PROPOSAL ----
    console.log("\n== PROPOSAL ==");
    const prop = await api("/api/admin/proposals", { method: "POST", body: {
      title: "QA Commercial " + uid,
      company_name: "QA Comm Corp",
      client_name: "QA Client",
      client_email: uid + "@example.com",
      total_setup: 250000,
      total_monthly: 50000,
      valid_until: "2026-12-31",
    }});
    const propId = prop.body?.proposal?.id;
    check("create proposal", prop.status === 200 && !!propId, `status=${prop.status}`);
    createdIds.proposals.push(propId);

    const sent = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "sent" } });
    check("proposal mark sent", sent.status === 200 && sent.body?.proposal?.status === "sent" && !!sent.body?.proposal?.sent_at, `status=${sent.status}`);
    const accepted = await api("/api/admin/proposals", { method: "PATCH", body: { id: propId, status: "accepted" } });
    check("proposal accept", accepted.status === 200 && accepted.body?.proposal?.status === "accepted" && !!accepted.body?.proposal?.accepted_at, `status=${accepted.status}`);

    // ---- CONTRACT FROM PROPOSAL ----
    console.log("\n== CONTRACT ==");
    const cont = await api("/api/admin/contracts", { method: "POST", body: { proposal_id: propId } });
    const contId = cont.body?.contract?.id;
    check("contract from proposal", cont.status === 200 && !!contId, `status=${cont.status} ${cont.body?.error || ""}`);
    check("contract inherits company", cont.body?.contract?.company_name === "QA Comm Corp", cont.body?.contract?.company_name);
    check("contract inherits amount", cont.body?.contract?.total_amount === 250000, String(cont.body?.contract?.total_amount));
    createdIds.contracts.push(contId);

    const signed = await api("/api/admin/contracts", { method: "PATCH", body: { id: contId, status: "signed", signatory: "QA Signatory" } });
    check("contract sign", signed.status === 200 && signed.body?.contract?.status === "signed" && signed.body?.contract?.signatory === "QA Signatory", `status=${signed.status}`);

    // ---- INVOICE ----
    console.log("\n== INVOICE ==");
    const inv = await api("/api/admin/invoices", { method: "POST", body: {
      title: "Setup Invoice " + uid,
      company_name: "QA Comm Corp",
      client_name: "QA Client",
      amount: 250000,
      due_at: "2026-10-01",
    }});
    const invId = inv.body?.invoice?.id;
    check("create invoice", inv.status === 200 && !!invId && !!inv.body?.invoice?.invoice_number, `status=${inv.status} ${inv.body?.error || ""}`);
    createdIds.invoices.push(invId);

    const paid = await api("/api/admin/invoices", { method: "PATCH", body: { id: invId, status: "paid", reference: "QA-REF-" + uid } });
    check("invoice mark paid", paid.status === 200 && paid.body?.invoice?.status === "paid" && !!paid.body?.invoice?.paid_at, `status=${paid.status}`);
    check("no paymentWarning on paid invoice", !paid.body?.paymentWarning, paid.body?.paymentWarning || "");

    // ---- PAYMENT ROW VERIFICATION ----
    console.log("\n== PAYMENT ==");
    const { data: payRow } = await sb.from("payments").select("id, invoice_id, amount, status, reference, paid_at").eq("invoice_id", invId).single();
    check("payment row auto-created", !!payRow, payRow ? payRow.id : "missing");
    check("payment amount matches invoice", payRow?.amount === 250000, String(payRow?.amount));
    check("payment status success", payRow?.status === "success", payRow?.status);
    check("payment reference saved", payRow?.reference === "QA-REF-" + uid, payRow?.reference);
    if (payRow) createdIds.payments.push(payRow.id);

    // ---- STANDALONE PAYMENT ----
    const pay2 = await api("/api/admin/payments", { method: "POST", body: {
      company_name: "QA Comm Corp",
      client_name: "QA Client",
      amount: 50000,
      method: "bank_transfer",
      reference: "QA-MGMT-" + uid,
      status: "success",
    }});
    check("record standalone payment", pay2.status === 200 && !!pay2.body?.payment?.id, `status=${pay2.status}`);
    if (pay2.body?.payment?.id) createdIds.payments.push(pay2.body.payment.id);

    // ---- LISTS INCLUDE EVERYTHING ----
    console.log("\n== LISTS ==");
    const listProps = await api("/api/admin/proposals");
    check("proposal in list", (listProps.body?.proposals || []).some((x) => x.id === propId));
    const listConts = await api("/api/admin/contracts");
    check("contract in list", (listConts.body?.contracts || []).some((x) => x.id === contId));
    const listInvs = await api("/api/admin/invoices");
    check("invoice in list", (listInvs.body?.invoices || []).some((x) => x.id === invId));
    const listPays = await api("/api/admin/payments");
    check("payments in list", (listPays.body?.payments || []).filter((x) => createdIds.payments.includes(x.id)).length === createdIds.payments.length);

    // ---- INVALID INPUTS ----
    const badProp = await api("/api/admin/proposals", { method: "POST", body: { title: "" } });
    check("proposal without title -> 400", badProp.status === 400, `status=${badProp.status}`);
    const badInv = await api("/api/admin/invoices", { method: "POST", body: { title: "X", amount: 0 } });
    check("invoice with zero amount -> 400", badInv.status === 400, `status=${badInv.status}`);
    const badPay = await api("/api/admin/payments", { method: "POST", body: { amount: -5 } });
    check("payment with negative amount -> 400", badPay.status === 400, `status=${badPay.status}`);

    // ---- PAGES RENDER (authenticated) ----
    console.log("\n== PAGES ==");
    for (const p of ["/admin/proposals", "/admin/contracts", "/admin/invoices", "/admin/payments", "/admin/proposals/" + propId]) {
      await page.goto(BASE + p, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
      await sleep(1800);
      const txt = await page.evaluate(() => document.body.innerText).catch(() => "");
      const hasContent = txt.includes("QA Comm Corp") || txt.includes("QA Commercial") || txt.includes("QA Client") || txt.includes("Setup Invoice");
      check(`page ${p} renders real data`, hasContent, p);
    }
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    // ---- CLEANUP ----
    console.log("\n== CLEANUP ==");
    const ids = [
      ...createdIds.payments.map((id) => sb.from("payments").delete().eq("id", id)),
      ...createdIds.invoices.map((id) => sb.from("invoices").delete().eq("id", id)),
      ...createdIds.contracts.map((id) => sb.from("contracts").delete().eq("id", id)),
      ...createdIds.proposals.map((id) => sb.from("proposals").delete().eq("id", id)),
    ];
    const results = await Promise.allSettled(ids);
    const ok = results.every((r) => r.status === "fulfilled" && !r.value.error);
    check("cleanup test rows", ok, results.filter((r) => r.status === "rejected" || r.value.error).length + " failed");
    // Belt and braces: remove anything left with the uid marker
    await sb.from("proposals").delete().like("title", "%" + uid + "%");
    await sb.from("invoices").delete().like("title", "%" + uid + "%");
    await sb.from("contracts").delete().like("title", "%" + uid + "%");
    await browser.close();
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();