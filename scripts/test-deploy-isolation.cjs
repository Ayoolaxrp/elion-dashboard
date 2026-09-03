// Client A vs Client B isolation test through the Deploy flow logic.
// Both clients deploy the SAME template (lead_response) with DIFFERENT
// configs. Verifies:
//   1. Each client gets its own client_automations row (no cross-client rows)
//   2. Each row's custom_config contains ONLY that client's data
//   3. Re-running the deploy does not duplicate (idempotency per client)
//   4. Template instances are independent (changing A does not affect B)
// Cleanup removes all test data.
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

function loadEnv(path) {
  const env = {};
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = { ...loadEnv(".env.local"), ...process.env };
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/** Mirrors /api/admin/deploy resolve-or-create template logic */
async function resolveOrCreateTemplate(slug, customName) {
  const { data: t } = await supabase.from("workflow_templates").select("id, name, slug, category").eq("slug", slug).maybeSingle();
  if (t) return { ...t, created: false };
  const { data: ins, error } = await supabase
    .from("workflow_templates")
    .insert({ name: customName || slug, slug, category: "custom", description: `Deployed via ELION Deploy Systems (${slug}).`, is_active: true, is_published: true })
    .select("id, name, slug, category").single();
  if (error) throw new Error("template insert: " + error.message);
  return { ...ins, created: true };
}

/** Mirrors /api/admin/deploy insert logic (idempotent per client+template) */
async function deployForClient(clientId, template, config, customName) {
  const { data: existing } = await supabase
    .from("client_automations").select("id, status").eq("client_id", clientId).eq("template_id", template.id).maybeSingle();
  if (existing) return { row: existing, existing: true };
  const { data: row, error } = await supabase
    .from("client_automations")
    .insert({ client_id: clientId, template_id: template.id, custom_name: customName, custom_config: config, status: "pending" })
    .select("id, client_id, template_id, custom_name, custom_config, status").single();
  if (error) throw new Error("automation insert: " + error.message);
  return { row, existing: false };
}

const failures = [];
function assert(cond, label) {
  console.log((cond ? "PASS" : "FAIL") + ": " + label);
  if (!cond) failures.push(label);
}

(async () => {
  const ts = Date.now();
  const clientA = { company_name: `Isolation Test Client A ${ts}` };
  const clientB = { company_name: `Isolation Test Client B ${ts}` };

  // 1. Create two real clients
  const base = (name) => ({
    company_name: name, contact_name: "Test Contact", email: `iso-${ts}@test.elion.local`,
    phone: "", industry: "", status: "active", onboarding_status: "pending",
  });
  const { data: ca, error: ea } = await supabase.from("clients").insert(base(clientA.company_name)).select("id, company_name").single();
  const { data: cb, error: eb } = await supabase.from("clients").insert(base(clientB.company_name)).select("id, company_name").single();
  if (ea || eb || !ca || !cb) { console.log("FAILED to create clients", ea?.message, eb?.message); return; }
  console.log("Created:", ca.company_name, "|", cb.company_name);

  const cleanup = [];
  cleanup.push({ table: "clients", id: ca.id }, { table: "clients", id: cb.id });

  // 2. Same template, DIFFERENT configs
  const template = await resolveOrCreateTemplate("lead_response", "WhatsApp Lead Response");
  console.log("Template:", template.name, template.id, template.created ? "(created)" : "(existing)");
  if (template.created) cleanup.push({ table: "workflow_templates", id: template.id });

  const configA = {
    business_name: "ABC Realty Lagos",
    whatsapp_number: "+2348011111111",
    response_template: "Hello! Welcome to ABC Realty Lagos. A specialist will reach out shortly.",
    business_hours: "Mon-Sat 8:00-18:00",
  };
  const configB = {
    business_name: "XYZ Motors Abuja",
    whatsapp_number: "+2348099999999",
    response_template: "Thank you for contacting XYZ Motors Abuja. We reply within 5 minutes.",
    business_hours: "Mon-Fri 9:00-17:00",
  };

  const rA = await deployForClient(ca.id, template, configA, "WhatsApp Lead Response");
  const rB = await deployForClient(cb.id, template, configB, "WhatsApp Lead Response");
  cleanup.push({ table: "client_automations", id: rA.row.id }, { table: "client_automations", id: rB.row.id });
  console.log("Deployed: A ->", rA.row.id, "| B ->", rB.row.id);

  // 3. Isolation assertions
  assert(rA.row.client_id === ca.id && rB.row.client_id === cb.id, "each automation row belongs to its own client");
  assert(rA.row.id !== rB.row.id, "Client A and Client B have distinct automation records");
  assert(rA.row.template_id === rB.row.template_id, "both instances reference the same shared template");

  // Config isolation: A's config must not contain B's data and vice versa
  const cfgA = rA.row.custom_config || {};
  const cfgB = rB.row.custom_config || {};
  assert(cfgA.business_name === "ABC Realty Lagos" && cfgB.business_name === "XYZ Motors Abuja", "each config holds its own business name");
  assert(cfgA.whatsapp_number === "+2348011111111" && cfgB.whatsapp_number === "+2348099999999", "each config holds its own WhatsApp number");
  assert(cfgA.response_template.includes("ABC Realty") && !cfgA.response_template.includes("XYZ Motors"), "Client A's response template has no Client B data");
  assert(cfgB.response_template.includes("XYZ Motors") && !cfgB.response_template.includes("ABC Realty"), "Client B's response template has no Client A data");
  assert(JSON.stringify(cfgA) !== JSON.stringify(cfgB), "A and B configs are not identical");

  // 4. Idempotency: re-deploy both — must NOT create new rows
  const rA2 = await deployForClient(ca.id, template, configA, "WhatsApp Lead Response");
  const rB2 = await deployForClient(cb.id, template, configB, "WhatsApp Lead Response");
  assert(rA2.existing && rA2.row.id === rA.row.id, "re-deploy Client A: no duplicate row");
  assert(rB2.existing && rB2.row.id === rB.row.id, "re-deploy Client B: no duplicate row");

  // 5. Count rows in the DB per client — proves no stray cross-client rows
  const { data: aRows } = await supabase.from("client_automations").select("id, client_id").eq("client_id", ca.id);
  const { data: bRows } = await supabase.from("client_automations").select("id, client_id").eq("client_id", cb.id);
  assert(aRows?.length === 1 && aRows.every((r) => r.client_id === ca.id), "Client A has exactly 1 row, all owned by A");
  assert(bRows?.length === 1 && bRows.every((r) => r.client_id === cb.id), "Client B has exactly 1 row, all owned by B");

  // 6. Independence: update A's config — B must be unchanged
  const newConfigA = { ...cfgA, response_template: "CHANGED: ABC Realty new greeting." };
  await supabase.from("client_automations").update({ custom_config: newConfigA }).eq("id", rA.row.id);
  const { data: bAfter } = await supabase.from("client_automations").select("custom_config").eq("id", rB.row.id).single();
  const bCfgAfter = bAfter?.custom_config || {};
  assert(bCfgAfter.response_template.includes("XYZ Motors") && !bCfgAfter.response_template.includes("CHANGED"), "changing Client A does not touch Client B's config");

  // 7. Different template set for B would still be isolated (spot check with a second product on B only)
  const t2 = await resolveOrCreateTemplate("follow_up", "Follow-Up System");
  if (t2.created) cleanup.push({ table: "workflow_templates", id: t2.id });
  const rB2nd = await deployForClient(cb.id, t2, { sequence_steps: ["1d", "3d"], channels: ["whatsapp"] }, "Follow-Up System");
  cleanup.push({ table: "client_automations", id: rB2nd.row.id });
  const { data: aAfter2 } = await supabase.from("client_automations").select("template_id").eq("client_id", ca.id);
  assert(aAfter2?.every((r) => r.template_id === template.id), "adding a product to Client B does not add anything to Client A");

  console.log("\n=== RESULT:", failures.length === 0 ? "ALL PASS — isolation confirmed" : failures.length + " FAILURES ===");

  // 8. Cleanup (reverse order: automations before templates before clients)
  for (const r of [...cleanup].reverse()) {
    await supabase.from(r.table).delete().eq("id", r.id);
  }
  console.log("Cleanup complete — removed", cleanup.length, "test rows.");
})();
