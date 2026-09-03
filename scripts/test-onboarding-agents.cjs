// Onboarding agent-config end-to-end test against production:
// 1. seed a client + ai_receptionist + ai_sales_agent automations
// 2. GET /api/onboarding/:id -> automations present (drives dynamic steps)
// 3. POST agent config through the real API
// 4. verify onboarding_form_data.agent_receptionist / agent_sales persisted
// 5. cleanup everything
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const env = {};
  const p = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const env = loadEnv();
const { createClient } = require("@supabase/supabase-js");
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const BASE = "https://elion.com.ng";
const ts = Date.now().toString(36);
const COMPANY = "Onboarding Agent QA " + ts;

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const cleanup = [];

async function resolveOrCreateTemplate(slug, name) {
  const { data: t } = await sb.from("workflow_templates").select("id").eq("slug", slug).maybeSingle();
  if (t) return t;
  const { data, error } = await sb.from("workflow_templates")
    .insert({ slug, name, category: "custom", description: "Auto-created for onboarding agent test", version: "1.0" })
    .select("id").single();
  if (error || !data) throw new Error("template create failed for " + slug + ": " + (error && error.message));
  cleanup.push({ table: "workflow_templates", id: data.id });
  return data;
}

async function go() {
  // Seed client
  const { data: client, error: ce } = await sb.from("clients")
    .insert({ company_name: COMPANY, contact_name: "QA Contact", email: `agent-${ts}@qa.elion.local` })
    .select("id").single();
  if (ce || !client) throw new Error("client seed failed: " + (ce && ce.message));
  cleanup.push({ table: "clients", id: client.id });
  console.log("Seeded:", COMPANY, client.id);

  // Seed automations
  const rec = await resolveOrCreateTemplate("ai_receptionist", "AI Receptionist");
  const sal = await resolveOrCreateTemplate("ai_sales_agent", "AI Sales Agent");
  const { error: a1 } = await sb.from("client_automations")
    .insert({ client_id: client.id, template_id: rec.id, custom_name: "AI Receptionist", status: "pending" });
  const { error: a2 } = await sb.from("client_automations")
    .insert({ client_id: client.id, template_id: sal.id, custom_name: "AI Sales Agent", status: "pending" });
  if (a1 || a2) throw new Error("automation seed failed");

  // GET shows automations (public)
  const getRes = await fetch(`${BASE}/api/onboarding/${client.id}`);
  check("GET onboarding 200", getRes.status === 200);
  const getBody = await getRes.json();
  const slugs = (getBody.automations || []).map((a) => a.workflow_templates?.slug);
  check("automations returned", slugs.includes("ai_receptionist") && slugs.includes("ai_sales_agent"), slugs.join(","));

  // POST full onboarding incl. agent configs
  const payload = {
    business_name: COMPANY, industry: "real_estate", website: "https://qa.example.com", timezone: "Africa/Lagos",
    primary_contact_name: "QA Contact", primary_contact_email: `agent-${ts}@qa.elion.local`, primary_contact_phone: "+2348000000000", primary_contact_role: "Owner",
    whatsapp_number: "+2348012345678", email_smtp: "gmail", calendar_provider: "google_calendar", crm_tool: "",
    working_hours_start: "09:00", working_hours_end: "17:00", working_days: ["mon", "tue", "wed", "thu", "fri"],
    response_speed: "instant", follow_up_1_hours: 4, follow_up_2_hours: 24, follow_up_3_hours: 72,
    greeting_message: "Thanks for contacting " + COMPANY,
    agent_receptionist: {
      business_description: "QA Realty helps people buy and sell homes in Lagos.",
      services: "Sales listings\nRentals\nProperty management",
      pricing_guidance: "Rentals from 1.5m/yr.",
      faqs: "Q: Areas? A: Lekki.",
      policies: "Viewings require ID.",
      location: "12 Admiralty Way, Lekki",
      opening_hours: "Mon-Sat 9-6",
      holiday_hours: "",
      contact_info: "",
      personality: "friendly",
      capabilities: ["Answer common questions", "Qualify leads", "Book appointments", "Transfer to a human"],
      do_not_answer: "Legal advice, staff matters",
      no_invent: true,
      escalation_triggers: "Complaints, high-value leads",
      human_name: "Tunde", human_phone: "+2348123456789", human_email: "team@qa.example.com",
    },
    agent_sales: {
      services: "2-bed apartments - young professionals",
      ideal_customer: "First-time buyers with 50m+ budget",
      qualifying_questions: "What are you looking for? When do you need it?",
      disqualifying_criteria: "Rent under 500k/yr",
      approved_pricing: "Agency fee 8%",
      max_discount: "5%",
      objections: "Too expensive -> explain payment plans",
      allowed_actions: ["Qualify leads", "Recommend a service", "Book a meeting", "Escalate to a human"],
      prohibited_claims: "Never guarantee rental income",
      follow_up_schedule: "1 day, 3 days, 7 days",
      escalation_name: "Ada", escalation_phone: "+2348111222333", escalation_email: "sales@qa.example.com",
    },
    additional_notes: "QA test run",
  };
  const postRes = await fetch(`${BASE}/api/onboarding/${client.id}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const postBody = await postRes.json();
  check("POST onboarding success", postRes.ok && postBody.success === true, JSON.stringify(postBody).slice(0, 120));

  // Verify persistence
  const { data: stored } = await sb.from("clients").select("onboarding_form_data, onboarding_status").eq("id", client.id).single();
  check("status set to in_review", stored && stored.onboarding_status === "in_review", stored && stored.onboarding_status);
  const fd = stored?.onboarding_form_data || {};
  check("agent_receptionist persisted", Boolean(fd.agent_receptionist), JSON.stringify(fd.agent_receptionist || {}).slice(0, 100));
  check("receptionist description persisted", fd.agent_receptionist?.business_description === payload.agent_receptionist.business_description);
  check("receptionist capabilities persisted", JSON.stringify(fd.agent_receptionist?.capabilities) === JSON.stringify(payload.agent_receptionist.capabilities), JSON.stringify(fd.agent_receptionist?.capabilities));
  check("receptionist guardrail persisted", fd.agent_receptionist?.no_invent === true && Boolean(fd.agent_receptionist?.human_phone));
  check("agent_sales persisted", Boolean(fd.agent_sales), JSON.stringify(fd.agent_sales || {}).slice(0, 100));
  check("sales actions persisted", JSON.stringify(fd.agent_sales?.allowed_actions) === JSON.stringify(payload.agent_sales.allowed_actions));
  check("sales objections persisted", fd.agent_sales?.objections === payload.agent_sales.objections);
  check("existing form fields still stored", fd.business_name === COMPANY && fd.greeting_message.includes(COMPANY));

  // Cleanup
  const { data: autos } = await sb.from("client_automations").select("id").eq("client_id", client.id);
  for (const a of autos || []) await sb.from("client_automations").delete().eq("id", a.id);
  await sb.from("clients").delete().eq("id", client.id);
  for (const c of cleanup) { try { await sb.from(c.table).delete().eq("id", c.id); } catch {} }
  console.log("cleanup: removed client, automations, and any created templates");

  console.log(`\n=== RESULT: ${fail === 0 ? "ALL PASS" : fail + " FAILED"} (${pass} passed, ${fail} failed) ===`);
  process.exit(fail === 0 ? 0 : 1);
}

go().catch((e) => { console.error("FATAL:", e); process.exit(1); });
