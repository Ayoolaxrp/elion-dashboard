// Verifies (production): client agent config submitted via onboarding is
// merged into the matching client_automations.custom_config, and a blank
// business name no longer overwrites the client's company_name.
const fs = require("fs");
function loadEnv(path) {
  const env = {};
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = { ...loadEnv(".env.local"), ...process.env };
const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: sbKey, Authorization: "Bearer " + sbKey, "Content-Type": "application/json" };
const HP = { ...H, Prefer: "return=representation" };
const TS = Date.now();
const COMPANY = "Onboard Merge QA " + TS;

let passed = 0, failed = 0;
function check(label, cond) {
  console.log((cond ? "  PASS: " : "  FAIL: ") + label);
  if (cond) passed++; else failed++;
}

(async () => {
  let clientId = null, autoId = null, tplId = null;
  try {
    // template row (auto-created templates get cleaned by agent QA; seed if absent)
    const t = await fetch(sbUrl + "/rest/v1/workflow_templates?select=id&slug=eq.ai_receptionist", { headers: H });
    let tpls = await t.json();
    if (!Array.isArray(tpls) || tpls.length === 0) {
      // Mirror the deploy route's insert shape (live schema has no status column)
      const ins = await fetch(sbUrl + "/rest/v1/workflow_templates", {
        method: "POST", headers: HP,
        body: JSON.stringify({
          slug: "ai_receptionist", name: "AI Receptionist", category: "custom",
          description: "QA seed", is_active: true, is_published: true,
        }),
      });
      tpls = await ins.json();
    }
    tplId = (Array.isArray(tpls) ? tpls[0] : tpls).id;
    check("template ready", !!tplId);

    // client
    const c = await fetch(sbUrl + "/rest/v1/clients", {
      method: "POST", headers: HP,
      body: JSON.stringify({
        company_name: COMPANY, contact_name: "Merge QA", email: "merge" + TS + "@test.elion.local",
        phone: "+2348000000000", industry: "Healthcare", website: "https://merge.example.com",
        plan_name: "Lead Response + AI Receptionist", onboarding_status: "pending",
      }),
    });
    const cliArr = await c.json();
    const cli = Array.isArray(cliArr) ? cliArr[0] : cliArr;
    clientId = cli?.id;
    check("client seeded (" + (c.status || "?") + ")", !!clientId);

    // automation row with an admin-set flat config (what the deploy wizard writes)
    const a = await fetch(sbUrl + "/rest/v1/client_automations", {
      method: "POST", headers: HP,
      body: JSON.stringify({
        client_id: clientId, template_id: tplId,
        status: "pending", custom_name: "AI Receptionist",
        custom_config: {
          business_name: COMPANY, description: "Admin-set description",
          whatsapp_number: "+2348011112222", personality: "Professional",
        },
      }),
    });
    const auArr = await a.json();
    const au = Array.isArray(auArr) ? auArr[0] : auArr;
    autoId = au?.id;
    check("automation seeded", !!autoId);

    // submit onboarding: blank business name (should NOT clobber) + agent config
    const post = await fetch(BASE + "/api/onboarding/" + clientId, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: "", industry: "Healthcare",
        agent_receptionist: {
          business_description: "A Lagos healthcare clinic offering outpatient consultations.",
          pricing_guidance: "Consultations from NGN 15,000.",
          faqs: "Q: Do you do home visits? A: Yes, within Lagos.",
          personality: "friendly",
          do_not_answer: "Never discuss other patients.",
          no_invent: true,
          human_name: "Dr. Jane", human_phone: "+2348022223333", human_email: "jane@clinic.ng",
          escalation_triggers: "Complaints, emergencies",
        },
      }),
    });
    const body = await post.json();
    check("onboarding POST ok (" + post.status + ")", post.status === 200 && body.success === true);

    // verify merge + no clobber
    const ar = await fetch(sbUrl + "/rest/v1/client_automations?select=id,custom_config&id=eq." + autoId, { headers: H });
    const autos = await ar.json();
    const cfg = autos?.[0]?.custom_config || {};
    check("receptionist block merged", !!cfg.receptionist);
    check("business_description persisted", (cfg.receptionist?.business_description || "").includes("clinic") === true);
    check("personality persisted", cfg.receptionist?.personality === "friendly");
    check("human phone persisted", cfg.receptionist?.human_phone === "+2348022223333");
    check("admin flat config preserved", cfg.business_name === COMPANY && cfg.whatsapp_number === "+2348011112222");
    check("admin description preserved", cfg.description === "Admin-set description");

    const cr = await fetch(sbUrl + "/rest/v1/clients?select=id,company_name,onboarding_status&id=eq." + clientId, { headers: H });
    const clis = await cr.json();
    check("company_name NOT overwritten by blank business name", clis?.[0]?.company_name === COMPANY);
    check("onboarding_status in_review", clis?.[0]?.onboarding_status === "in_review");
  } catch (err) {
    console.log("PROBE CRASHED:", err.message);
    failed++;
  } finally {
    if (autoId) await fetch(sbUrl + "/rest/v1/client_automations?id=eq." + autoId, { method: "DELETE", headers: H });
    if (clientId) await fetch(sbUrl + "/rest/v1/clients?id=eq." + clientId, { method: "DELETE", headers: H });
    if (tplId) await fetch(sbUrl + "/rest/v1/workflow_templates?id=eq." + tplId, { method: "DELETE", headers: H });
    console.log("  cleanup done");
  }
  console.log("\n=== RESULT: " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " (" + passed + " passed) ===");
  process.exit(failed === 0 ? 0 : 1);
})();
