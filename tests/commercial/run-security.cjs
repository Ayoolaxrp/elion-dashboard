// exec_sql security regression test.
// Verifies the hardened grants (migration 027) are in place on the LIVE
// Supabase project: anon must be denied arbitrary SQL; service role allowed.
//
// Run: node tests/commercial/run-security.cjs
// Requires .env.local with Supabase keys. Skips with a warning if absent.
// Never executes destructive SQL: only `select 1` is attempted.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.join(__dirname, "..", "..");
const envFile = path.join(ROOT, ".env.local");
if (!fs.existsSync(envFile)) {
  console.log("SKIP  .env.local not present (security test is live-only)");
  process.exit(0);
}
const env = {};
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const t = line.trim();
  if (t && !t.startsWith("#") && t.includes("=")) {
    const i = t.indexOf("=");
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
};

(async () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log("SKIP  Supabase keys missing in .env.local");
    process.exit(0);
  }

  const anon = createClient(env.SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const svc = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Anon must NOT be able to execute arbitrary SQL.
  const anonTry = await anon.rpc("exec_sql", { query: "select 1" });
  check("anon cannot call exec_sql",
    anonTry.error && /permission denied/i.test(anonTry.error.message || ""),
    JSON.stringify(anonTry.error || anonTry.data));

  // 2. Anon must NOT be able to read pg_proc through exec_sql either.
  const anonProc = await anon.rpc("exec_sql", { query: "select count(*) from pg_proc" });
  check("anon cannot read pg_proc via exec_sql",
    anonProc.error && /permission denied/i.test(anonProc.error.message || ""),
    JSON.stringify(anonProc.error || anonProc.data));

  // 3. Service role can still run the RPC (server-side migrations keep working).
  const svcOk = await svc.rpc("exec_sql", { query: "select 1" });
  check("service role can still execute", !svcOk.error && svcOk.data === "OK",
    JSON.stringify(svcOk.error || svcOk.data));

  console.log("\n" + pass + " passed, " + failures.length + " failed");
  if (failures.length) {
    console.log("FAILED: " + failures.join(" | "));
    process.exit(1);
  }
})();
