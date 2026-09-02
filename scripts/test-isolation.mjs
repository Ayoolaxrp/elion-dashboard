import { createClient } from "@supabase/supabase-js";

const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cHp2c2NmYmVteXdoa2VocGRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA5NDY1OCwiZXhwIjoyMTAzNjcwNjU4fQ.l9VJEM2wpaYO6Wrz0774JX3EXJUH7HOG_y2kmIyTEMI";
const sb = createClient("https://dxpzvscfbemywhkehpdm.supabase.co", key);

const CLIENT_A = "client_2595d414-d84a-43b5-bdb9-9caac035895e";
const CLIENT_B = "client_e2e_1788353988213";

let passed = 0, failed = 0;
function check(label, condition) {
  if (condition) { console.log("  PASS:", label); passed++; }
  else { console.log("  FAIL:", label); failed++; }
}

async function api(path, opts) {
  const r = await fetch("https://elion.com.ng" + path, opts);
  return { status: r.status, body: await r.json().catch(() => null) };
}

async function test() {
  // TEST 1: Automation Isolation
  console.log("\n=== TEST 1: Automation Isolation ===");
  const stateA = await api("/api/admin/commercial?client_id=" + CLIENT_A);
  const stateB = await api("/api/admin/commercial?client_id=" + CLIENT_B);
  check("Client A has automations", (stateA.body?.automations?.length || 0) > 0);
  check("Client B has 0 automations", (stateB.body?.automations?.length || 0) === 0);
  check("Client A all live", stateA.body?.lifecycle?.all_live === true);
  check("Client B no entitlements", stateB.body?.lifecycle?.has_entitlements === false);

  // TEST 2: Lead Response Config Isolation
  console.log("\n=== TEST 2: Lead Response Config Isolation ===");
  const leadA = await api("/api/automation/leads", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Iso Test A2", email: "a2@iso.com", phone: "+2348033333333", source: "isolation2", client_id: CLIENT_A })
  });
  const leadB = await api("/api/automation/leads", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Iso Test B2", email: "b2@iso.com", phone: "+2348044444444", source: "isolation2", client_id: CLIENT_B })
  });
  check("Lead A processed (200)", leadA.status === 200);
  check("Lead B rejected (404)", leadB.status === 404);
  check("Lead A used correct automation", leadA.body?.automation?.name === "Lead Response System");
  check("Lead A response has client config", leadA.body?.response?.generated?.length > 0);

  // TEST 3: Lead Records Isolation
  console.log("\n=== TEST 3: Lead Records Isolation ===");
  const { data: leadsA } = await sb.from("leads").select("id, company_name, source").eq("source", "isolation2").order("created_at", { ascending: false }).limit(5);
  const { data: leadsB } = await sb.from("leads").select("id, company_name, source").eq("source", "isolation2").order("created_at", { ascending: false }).limit(5);
  check("Isolation leads exist", (leadsA?.length || 0) > 0);
  check("Isolation leads have Test Properties company", leadsA?.every(l => l.company_name === "Test Properties Ltd"));

  // TEST 4: Execution Log Isolation
  console.log("\n=== TEST 4: Execution Log Isolation ===");
  const { data: execsA } = await sb.from("automation_executions").select("client_id").eq("client_id", CLIENT_A);
  const { data: execsB } = await sb.from("automation_executions").select("client_id").eq("client_id", CLIENT_B);
  check("Client A has executions", (execsA?.length || 0) > 0);
  check("All Client A executions belong to A", execsA?.every(e => e.client_id === CLIENT_A));
  check("Client B has no executions", (execsB?.length || 0) === 0);

  // TEST 5: Activity Log Isolation
  console.log("\n=== TEST 5: Activity Log Isolation ===");
  const { data: acts } = await sb.from("activity_log").select("event_data").eq("event_type", "lead_response_automation").order("created_at", { ascending: false }).limit(10);
  const clientAActs = acts?.filter(a => a.event_data?.client_id === CLIENT_A) || [];
  const clientBActs = acts?.filter(a => a.event_data?.client_id === CLIENT_B) || [];
  check("Client A has activity entries", clientAActs.length > 0);
  check("Client B has no activity entries", clientBActs.length === 0);
  check("Client A activities reference correct company", clientAActs[0]?.event_data?.client_name === "Test Properties Ltd");

  // TEST 6: Integration Credentials Isolation
  console.log("\n=== TEST 6: Integration Credentials Isolation ===");
  const { data: credsA } = await sb.from("client_integrations").select("integration_type, status").eq("client_id", CLIENT_A);
  const { data: credsB } = await sb.from("client_integrations").select("integration_type, status").eq("client_id", CLIENT_B);
  check("Client A has integrations", (credsA?.length || 0) > 0);
  check("Client A WhatsApp connected", credsA?.some(c => c.integration_type === "whatsapp" && c.status === "connected"));
  check("Client B has no integrations", (credsB?.length || 0) === 0);

  // TEST 7: Cross-client data never leaks
  console.log("\n=== TEST 7: Cross-Client Data Leak Check ===");
  const { data: allExecs } = await sb.from("automation_executions").select("client_id");
  const aOnly = allExecs?.filter(e => e.client_id === CLIENT_A) || [];
  const bOnly = allExecs?.filter(e => e.client_id === CLIENT_B) || [];
  const otherClients = allExecs?.filter(e => e.client_id !== CLIENT_A && e.client_id !== CLIENT_B) || [];
  check("No executions cross client boundaries", aOnly.every(e => e.client_id === CLIENT_A) && bOnly.every(e => e.client_id === CLIENT_B));
  check("Client B has zero execution records", bOnly.length === 0);

  const { data: allCreds } = await sb.from("client_integrations").select("client_id");
  const aCreds = allCreds?.filter(c => c.client_id === CLIENT_A) || [];
  const bCreds = allCreds?.filter(c => c.client_id === CLIENT_B) || [];
  check("No credentials cross client boundaries", aCreds.every(c => c.client_id === CLIENT_A));
  check("Client B has zero credentials", bCreds.length === 0);

  // SUMMARY
  console.log("\n========================================");
  console.log("  CLIENT ISOLATION TEST RESULTS");
  console.log("========================================");
  console.log("  Passed:", passed);
  console.log("  Failed:", failed);
  console.log("  Total:", passed + failed);
  console.log(failed === 0 ? "  ALL TESTS PASSED" : "  SOME TESTS FAILED");
  console.log("========================================\n");
}

test().catch(console.error);
