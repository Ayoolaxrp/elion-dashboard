/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
let passed = 0;
function check(name, fn) {
  try { fn(); passed += 1; console.log(`PASS  ${name}`); }
  catch (error) { console.error(`FAIL  ${name} :: ${error.message}`); process.exitCode = 1; }
}

const session = read("src/lib/auth/client.ts");
const portal = read("src/app/api/client/portal/route.ts");
const overview = read("src/app/api/client/overview/route.ts");
const docs = read("src/app/api/client/documents/route.ts");
const entitlements = read("src/app/api/client/entitlements/route.ts");
const unlock = read("src/lib/payments/unlock.ts");
const migration = read("supabase/migrations/024_client_portal.sql");

check("client session uses authenticated browser session", () => {
  assert.match(session, /auth\.auth\.getUser\(\)/);
  assert.match(session, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});
check("client session requires active client organization membership", () => {
  assert.match(session, /organization_memberships/);
  assert.match(session, /eq\("status", "active"\)/);
  assert.match(session, /eq\("org_type", "client"\)/);
  assert.match(session, /\["owner", "staff", "client"\]/);
});
check("client session rejects ambiguous multi-tenant access", () => {
  assert.match(session, /clientIds\.length !== 1/);
});
check("portal never accepts a browser client id", () => {
  assert.doesNotMatch(portal, /searchParams|get\("client_id"|body\.client_id/);
  assert.match(portal, /eq\("client_id", client\.id\)/);
});
check("portal child records are tenant scoped", () => {
  for (const table of ["portal_projects", "portal_onboarding_form", "client_documents", "portal_reports", "portal_access_requests"]) {
    assert.match(portal, new RegExp(`from\\("${table}"\\)[\\s\\S]*?eq\\("client_id", client\\.id\\)`));
  }
  assert.match(portal, /portal_tasks/);
  assert.match(portal, /eq\("project_id", project\.id\)\.eq\("client_id", client\.id\)/);
});
check("overview delegates identity to the shared membership resolver", () => {
  assert.match(overview, /getClientSession/);
  assert.match(overview, /session\.clientId/);
  assert.match(session, /organization_memberships/);
  assert.match(session, /eq\("status", "active"\)/);
  assert.match(session, /eq\("org_type", "client"\)/);
});
check("documents and entitlements do not accept a client id", () => {
  assert.doesNotMatch(docs, /searchParams|get\("client_id"|body\.client_id/);
  assert.doesNotMatch(entitlements, /searchParams|get\("client_id"|body\.client_id/);
});
check("portal tables carry tenant keys and unique resumable form", () => {
  assert.match(migration, /client_id TEXT NOT NULL REFERENCES clients/);
  assert.match(migration, /UNIQUE \(client_id\)/);
  assert.match(migration, /portal_tasks/);
});
check("payment unlock is server-side and monotonic", () => {
  assert.match(unlock, /status: "paid"/);
  assert.match(unlock, /\.in\("status", \["draft", "sent", "overdue"\]\)/);
  assert.match(unlock, /\.in\("lead_status", PRE_PAID_LEAD_STAGES\)/);
});
check("verified payment activates one client organization without granting access", () => {
  assert.match(unlock, /\.from\("organizations"\)\.upsert/);
  assert.match(unlock, /onConflict: "client_id"/);
  assert.match(unlock, /does not create an auth user or/);
});
check("client surface does not expose internal margins", () => {
  for (const source of [portal, overview, docs, entitlements]) assert.doesNotMatch(source, /margin|direct_cost|internal_sales|lead_intelligence/);
});

console.log(`\n${passed} passed`);
