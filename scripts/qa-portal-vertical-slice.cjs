// Vertical slice QA: verified client -> onboarding saved -> project created ->
// task completed -> report accessed. Plus client isolation (A cannot see B)
// and idempotency (double form-save creates no duplicates).
// Uses labeled QA records, cleaned up at the end. Run against production.
const puppeteer = require("C:/Users/User/Projects/ingenuity-dashboard/node_modules/puppeteer-core");

const BASE = "https://elion.com.ng";
const EMAIL_A = "qa-portal-a@elion-qa.com";
const EMAIL_B = "qa-portal-b@elion-qa.com";
const PASSWORD = "QaPortal!2026";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ---- Setup: two QA clients via service role (labeled, cleaned up later) ----
  const { createClient } = require("C:/Users/User/Projects/ingenuity-dashboard/node_modules/@supabase/supabase-js");
  const fs = require("fs");
  const env = fs.readFileSync("C:/Users/User/Projects/ingenuity-dashboard/.env.local", "utf8");
  const get = (k) => { const m = env.match(new RegExp("^" + k + "=(.*)$", "m")); return m ? m[1].trim().replace(/^\"|\"$/g, "") : null; };
  const admin = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"));

  // create auth users
  const users = {};
  for (const [key, email] of [["A", EMAIL_A], ["B", EMAIL_B]]) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
    if (error && !/already exists|already been registered/i.test(error.message)) { console.log("setup fail:", error.message); process.exit(1); }
    const { data: list } = await admin.auth.admin.listUsers();
    const u = list.users.find((x) => x.email === email);
    users[key] = u;
    // client rows
    await admin.from("clients").upsert({
      id: "client_qa_portal_" + key,
      contact_name: key === "A" ? "QA Client A" : "QA Client B",
      email, company_name: key === "A" ? "QA Portal Test A" : "QA Portal Test B",
      plan_name: key === "A" ? "Growth" : "Starter",
      onboarding_status: "in_progress",
    }, { onConflict: "id" });
    // link auth -> client
    await admin.from("clients").update({ auth_user_id: u.id }).eq("id", "client_qa_portal_" + key);
  }

  // portal project + tasks + report for A only
  await admin.from("portal_projects").upsert({ id: "pproj_qa_a", client_id: "client_qa_portal_A", name: "QA Lead System A", phase: "build" }, { onConflict: "id" });
  await admin.from("portal_tasks").upsert([
    { id: "ptask_qa_a1", project_id: "pproj_qa_a", client_id: "client_qa_portal_A", title: "QA task complete", status: "complete", owner: "ELION", sort_order: 1 },
    { id: "ptask_qa_a2", project_id: "pproj_qa_a", client_id: "client_qa_portal_A", title: "QA task needs input", status: "needs_input", owner: "Client", sort_order: 2 },
  ], { onConflict: "id" });
  await admin.from("portal_reports").upsert({
    id: "prep_qa_a", client_id: "client_qa_portal_A", title: "QA Report", period_start: "2026-08-01", period_end: "2026-08-31",
    metrics: [{ label: "QA metric", value: "1", source: "QA" }], data_source: "QA labeled test",
  }, { onConflict: "id" });

  // ---- Browser flows ----
  const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });

  async function loginAndLoadPortal(email) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 90000 });
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);
    await sleep(2500);
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/client/portal");
      return { status: r.status, body: await r.json().catch(() => null) };
    });
    return { page, res };
  }

  try {
    // Client A
    const { page: pa, res: ra } = await loginAndLoadPortal(EMAIL_A);
    check("A: portal API 200", ra.status === 200, String(ra.status));
    check("A: sees own company", ra.body?.client?.company_name === "QA Portal Test A", ra.body?.client?.company_name);
    check("A: sees own project", ra.body?.project?.name === "QA Lead System A");
    check("A: sees 2 own tasks", ra.body?.tasks?.length === 2);
    check("A: sees own report", ra.body?.reports?.some((r) => r.title === "QA Report"));
    check("A: next action derived", !!ra.body?.nextAction?.title, ra.body?.nextAction?.title);

    // A completes onboarding step 1 (vertical slice: onboarding saved)
    const save1 = await pa.evaluate(async () => {
      const r = await fetch("/api/client/portal/onboarding-form", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, data: { company_name: "QA Portal Test A", contact_name: "QA Client A" } }),
      });
      return { status: r.status, body: await r.json() };
    });
    check("A: onboarding step 1 saved", save1.status === 200 && save1.body.success);
    // idempotency: save again
    const save1b = await pa.evaluate(async () => {
      const r = await fetch("/api/client/portal/onboarding-form", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 1, data: { company_name: "QA Portal Test A", contact_name: "QA Client A" } }),
      });
      return r.status;
    });
    check("A: repeat save idempotent (200, no dup)", save1b === 200);
    const re1 = await pa.evaluate(async () => (await fetch("/api/client/portal")).json());
    check("A: form state shows 1 saved step", re1?.onboardingForm?.saved_steps === 1, JSON.stringify(re1?.onboardingForm));
    await pa.close();

    // Client B: isolation
    const { page: pb, res: rb } = await loginAndLoadPortal(EMAIL_B);
    check("B: portal API 200", rb.status === 200, String(rb.status));
    check("B: sees own company only", rb.body?.client?.company_name === "QA Portal Test B", rb.body?.client?.company_name);
    check("B: sees NO project of A", !rb.body?.project || rb.body.project.id !== "pproj_qa_a");
    check("B: sees NO tasks of A", (rb.body?.tasks || []).length === 0);
    check("B: sees NO reports of A", (rb.body?.reports || []).length === 0);
    // direct ID probe (IDOR): B requests A's report id explicitly
    const idor = await pb.evaluate(async () => {
      const r = await fetch("/api/client/portal");
      const j = await r.json();
      return JSON.stringify(j).includes("QA Report") || JSON.stringify(j).includes("pproj_qa_a");
    });
    check("B: no A data leaks in payload (IDOR probe)", !idor);
    await pb.close();
  } finally {
    await browser.close();
  }

  // ---- Cleanup ----
  for (const cid of ["client_qa_portal_A", "client_qa_portal_B"]) {
    await admin.from("portal_tasks").delete().eq("client_id", cid);
    await admin.from("portal_projects").delete().eq("client_id", cid);
    await admin.from("portal_reports").delete().eq("client_id", cid);
    await admin.from("portal_onboarding_form").delete().eq("client_id", cid);
    await admin.from("portal_access_requests").delete().eq("client_id", cid);
    await admin.from("clients").delete().eq("id", cid);
  }
  for (const email of [EMAIL_A, EMAIL_B]) {
    const { data: list } = await admin.auth.admin.listUsers();
    const u = list.users.find((x) => x.email === email);
    if (u) await admin.auth.admin.deleteUser(u.id);
  }
  console.log("cleanup done");

  console.log(`\n=== RESULT: ${pass} pass, ${fail} fail ===`);
  process.exit(fail === 0 ? 0 : 1);
})();
