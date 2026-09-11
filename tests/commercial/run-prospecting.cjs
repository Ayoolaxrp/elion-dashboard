/* eslint-disable @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const root = path.join(__dirname, "..", "..");
const prospecting = require("./compiled-prospecting/prospect/discovery.js");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
function loadTsModule(relative) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const loadedModule = { exports: {} };
  Function("require", "module", "exports", transpiled)(require, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const products = loadTsModule("src/lib/products.ts");
let passed = 0;
function check(name, fn) {
  try { fn(); passed += 1; console.log(`PASS  ${name}`); }
  catch (error) { console.error(`FAIL  ${name} :: ${error.message}`); process.exitCode = 1; }
}

check("parses operator CSV with defaults and attribution", () => {
  const rows = prospecting.parseProspectCsv('company,website\n"A, Ltd",a.example', { industry: "Real Estate", location: "Lagos" });
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].business, "A, Ltd");
  assert.strictEqual(rows[0].industry, "Real Estate");
  assert.strictEqual(rows[0].location, "Lagos");
  assert.strictEqual(rows[0].source, "manual_csv");
  assert.strictEqual(rows[0].sourceUrl, "manual import");
  assert.ok(rows[0].retrievedAt);
});
check("deduplicates candidates by normalized domain", () => {
  const rows = [
    { business: "A", website: "https://a.example/one", source: "manual", sourceUrl: "manual", retrievedAt: "2026-09-11" },
    { business: "A duplicate", website: "http://A.EXAMPLE/two", source: "manual", sourceUrl: "manual", retrievedAt: "2026-09-11" },
  ];
  assert.strictEqual(prospecting.deduplicateProspects(rows).length, 1);
});
check("classifies preflight failures separately", () => {
  assert.strictEqual(prospecting.classifyPreflightFailure({ error: "ENOTFOUND" }), "DNS_FAILURE");
  assert.strictEqual(prospecting.classifyPreflightFailure({ status: 403 }), "ANTI_BOT");
  assert.strictEqual(prospecting.classifyPreflightFailure({ contentType: "application/pdf" }), "NON_HTML");
  assert.strictEqual(prospecting.classifyPreflightFailure({ error: "timed out" }), "TIMEOUT");
});
check("only passed preflight enters audit queue", () => {
  assert.strictEqual(prospecting.auditQueueEligible({ valid: true, status: "PASSED" }), true);
  assert.strictEqual(prospecting.auditQueueEligible({ valid: false, status: "DNS_FAILURE" }), false);
});
check("all catalog products have complete commercial metadata", () => {
  for (const product of products.PRODUCT_CATALOG) {
    const metadata = products.getProductCommercialMetadata(product.id);
    assert.ok(metadata, `${product.id} missing metadata`);
    assert.ok(metadata.customer_problem && metadata.ideal_customer);
    assert.ok(Array.isArray(metadata.implementation_scope) && metadata.implementation_scope.length > 0);
    assert.ok(Number.isFinite(metadata.setup_price_ngn) && Number.isFinite(metadata.monthly_care_price_ngn));
    assert.ok(metadata.activation_status === product.status);
    assert.ok(metadata.provisioning_checklist.length > 0);
    assert.ok(metadata.entitlement_rule);
  }
});
check("reference lead flow authenticates tenant and event idempotency", () => {
  const route = read("src/app/api/automation/leads/route.ts");
  const migration = read("supabase/migrations/035_prospecting_queue.sql");
  assert.match(route, /N8N_WEBHOOK_SECRET/);
  assert.match(route, /\.eq\("id", body\.client_id\)/);
  assert.match(route, /\.eq\("client_id", body\.client_id\)/);
  assert.match(route, /\.eq\("inbound_event_id", eventId\)/);
  assert.match(route, /event_id is required for idempotent ingestion/);
  assert.match(route, /unique event conflict/i);
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS idx_leads_client_event/);
});
check("prospecting API is admin-only and provider-neutral", () => {
  const route = read("src/app/api/admin/prospecting/route.ts");
  assert.match(route, /isAdminEmail/);
  assert.match(route, /parseProspectCsv/);
  assert.match(route, /preflightProspect/);
  assert.match(route, /manual_csv_or_api/);
  assert.match(route, /human-reviewed before outreach approval/);
  assert.match(route, /passed website preflight/);
  assert.doesNotMatch(route, /google|serpapi/i);
});

console.log(`\n${passed} passed`);
