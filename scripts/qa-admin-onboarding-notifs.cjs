// QA: onboarding individual send + notifications read lifecycle + dashboard +
// pricing page spacing (production). Sends one real welcome email to the admin
// address (Resend-verified recipient), logs + marks-read a notification, then
// cleans up every QA row it created.
// Usage: node scripts/qa-admin-onboarding-notifs.cjs
const path = require("path");
const fs = require("fs");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

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

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });

  let qaClientId = null;
  let qaPipelineId = null;
  let qaNotifId = null;
  const qaCompany = "QA Onboarding Co " + Date.now();

  try {
    // ===== PUBLIC: pricing page (spacing / premium / mobile) =====
    console.log("\n== /landing/pricing ==");
    const anon = await browser.createBrowserContext();
    const page = await anon.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(BASE + "/landing/pricing", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1800);
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("pricing 375px: no horizontal overflow", overflow <= 0, `overflow=${overflow}px`);
    const pText = await page.evaluate(() => document.body.innerText);
    check("pricing: headline present", /Pricing/.test(pText));
    check("pricing: one-time + support sections present", /One-time implementation/.test(pText) && /Optional ongoing support/.test(pText));
    check("pricing: payment info present (Opay)", /Opay|Bank transfer/i.test(pText), "");
    check("pricing: add-ons present", /Booking Integration/.test(pText) && /CRM Setup/.test(pText));
    check("pricing: FAQ present", /Frequently asked questions/.test(pText));
    // desktop overflow
    await page.setViewport({ width: 1440, height: 1000 });
    await sleep(800);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("pricing 1440px: no horizontal overflow", overflow <= 0, `overflow=${overflow}px`);
    // vertical rhythm sanity: main sections separated (each > 300px apart in scroll)
    const ys = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section")).map((s) => Math.round(s.getBoundingClientRect().top + window.scrollY))
    );
    const gaps = ys.slice(1).map((y, i) => y - ys[i]);
    check("pricing: sections have real vertical gaps", gaps.length >= 5 && gaps.every((g) => g > 200), `min gap=${Math.min(...gaps)}px over ${gaps.length} sections`);
    await anon.close();

    // ===== ANON gates =====
    console.log("\n== ANON gates ==");
    const anon2 = await browser.createBrowserContext();
    const gPage = await anon2.newPage();
    await gPage.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    const gates = await gPage.evaluate(async () => {
      const out = {};
      let r = await fetch("/api/admin/onboarding/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: "x" }) });
      out.onboardSend = r.status;
      r = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all: true }) });
      out.notifPatch = r.status;
      return out;
    });
    check("anon onboarding/send -> 401", gates.onboardSend === 401, `status=${gates.onboardSend}`);
    check("anon notifications PATCH -> 401", gates.notifPatch === 401, `status=${gates.notifPatch}`);
    await anon2.close();

    // ===== ADMIN login =====
    console.log("\n== ADMIN onboarding send + notification lifecycle ==");
    const adminCtx = await browser.createBrowserContext();
    const ap = await adminCtx.newPage();
    await ap.setViewport({ width: 1440, height: 1000 });
    await ap.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 60000 });
    await ap.waitForSelector('input[type="email"]', { timeout: 15000 });
    await ap.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await ap.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await ap.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await sleep(4000);
    check("admin login lands on /admin", ap.url().includes("/admin"), ap.url());

    const api = async (url, opts = {}) =>
      ap.evaluate(async ({ u, o }) => {
        const r = await fetch("https://elion.com.ng" + u, { method: o.method || "GET", headers: { "Content-Type": "application/json", ...(o.headers || {}) }, body: o.body ? JSON.stringify(o.body) : undefined });
        let j = null;
        try { j = await r.json(); } catch {}
        return { status: r.status, body: j };
      }, { u: url, o: opts });

    // Dashboard renders real feed (no fake "ABC Properties")
    await ap.goto(BASE + "/admin", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(2500);
    const dashText = await ap.evaluate(() => document.body.innerText);
    check("dashboard shows Latest notifications feed", dashText.includes("Latest notifications") || dashText.includes("All caught up"), "");
    check("dashboard shows stat tiles", /Active clients|Contract value|Total leads|Unread alerts/.test(dashText), "");
    check("no fake ABC Properties activity", !dashText.includes("ABC Properties"), "");
    check("no fake WhatsApp/n8n alerts", !dashText.includes("WhatsApp credentials not configured"), "");

    // Create QA client (email = admin so Resend delivers)
    const created = await api("/api/admin/clients", {
      method: "POST",
      body: { company_name: qaCompany, contact_name: "QA Contact", email: ADMIN_EMAIL, phone: "+2348000000000", industry: "QA", plan_name: "growth" },
    });
    qaClientId = created.body?.client?.id;
    check("QA client created", created.status === 200 && !!qaClientId, `status=${created.status} ${created.body?.error || ""}`);

    if (qaClientId) {
      // Send onboarding individually
      const sendRes = await api("/api/admin/onboarding/send", { method: "POST", body: { client_id: qaClientId, kind: "welcome" } });
      qaPipelineId = sendRes.body?.pipeline_id || null;
      check("onboarding/send succeeds (welcome)", sendRes.status === 200 && sendRes.body?.sent === true, `status=${sendRes.status} sent=${sendRes.body?.sent} ${sendRes.body?.error || ""}`);
      check("pipeline created/returned", !!qaPipelineId, qaPipelineId || "none");

      // DB state: pipeline flag + notification logged unread
      if (qaPipelineId) {
        const { data: pipe } = await sb.from("onboarding_pipeline").select("welcome_email_sent, current_stage").eq("id", qaPipelineId).maybeSingle();
        check("pipeline welcome_email_sent=true", pipe?.welcome_email_sent === true, JSON.stringify(pipe));
      }
      const { data: notifs } = await sb.from("notifications").select("id, type, is_read, client_id").eq("client_id", qaClientId).order("created_at", { ascending: false }).limit(5);
      const mine = (notifs || []).find((n) => n.type === "onboarding_email_sent");
      qaNotifId = mine?.id || null;
      check("notification logged (onboarding_email_sent, unread)", !!mine && mine.is_read === false, mine ? "found" : "none");

      // API list shows it unread
      const list = await api("/api/admin/notifications");
      const listedUnread = (list.body?.notifications || []).filter((n) => n.id === qaNotifId && !n.is_read).length;
      check("unread count includes the new notification", list.body?.unread >= 1 && listedUnread === 1, `unread=${list.body?.unread}`);

      // Mark it read via PATCH
      const patch = await api("/api/admin/notifications", { method: "PATCH", body: { id: qaNotifId } });
      const after = await api("/api/admin/notifications");
      const isReadNow = (after.body?.notifications || []).find((n) => n.id === qaNotifId)?.is_read === true;
      const stillUnread = (after.body?.notifications || []).filter((n) => !n.is_read).length;
      check("PATCH mark-read works", patch.status === 200 && isReadNow, `unread now=${after.body?.unread}`);
      check("read item no longer counted unread", !(after.body?.notifications || []).some((n) => n.id === qaNotifId && !n.is_read), "");

      // Invalid requests
      const badClient = await api("/api/admin/onboarding/send", { method: "POST", body: { client_id: "client_nope" } });
      check("unknown client -> 404", badClient.status === 404, `status=${badClient.status}`);
      const noId = await api("/api/admin/onboarding/send", { method: "POST", body: {} });
      check("missing client_id -> 400", noId.status === 400, `status=${noId.status}`);

      // Notifications page (Unread tab default): the read item is gone from unread
      await ap.goto(BASE + "/admin/notifications", { waitUntil: "networkidle2", timeout: 60000 });
      await sleep(2200);
      const notifText = await ap.evaluate(() => document.body.innerText);
      check("read item absent from Unread tab (take-away works)", !notifText.includes(qaCompany), "");
    }
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    // ===== CLEANUP =====
    console.log("\n== CLEANUP ==");
    if (qaNotifId) {
      const { error } = await sb.from("notifications").delete().eq("id", qaNotifId);
      console.log(error ? "cleanup notification FAIL: " + error.message : "cleaned notification");
    }
    if (qaPipelineId) {
      const { error } = await sb.from("onboarding_pipeline").delete().eq("id", qaPipelineId);
      console.log(error ? "cleanup pipeline FAIL: " + error.message : "cleaned pipeline");
    }
    if (qaClientId) {
      const { error } = await sb.from("clients").delete().eq("id", qaClientId);
      console.log(error ? "cleanup client FAIL: " + error.message : "cleaned client");
    }
    // Safety: any leftover notifs for the QA company
    const { data: leftovers } = await sb.from("notifications").select("id").like("title", "%" + qaCompany.split(" ")[2] + "%");
    if (leftovers && leftovers.length) {
      const { error } = await sb.from("notifications").delete().in("id", leftovers.map((n) => n.id));
      console.log(error ? "cleanup leftovers FAIL: " + error.message : "cleaned " + leftovers.length + " leftover notification(s)");
    }
    await browser.close();
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();
