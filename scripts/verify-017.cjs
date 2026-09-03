// Post-deploy verification: booking truthful states, audit intelligence fields, onboarding public GET.
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

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};

async function go() {
  // 1. Booking availability — truthful not-connected state
  const av = await fetch(`${BASE}/api/bookings/availability?days=5`).then((r) => r.json());
  check("availability returns connected=false", av.connected === false && av.reason === "calendar_not_connected", JSON.stringify({ connected: av.connected, reason: av.reason }));
  check("availability returns no slots when not connected", Array.isArray(av.slots) && av.slots.length === 0);

  // 2. Booking POST — must NOT create a row when calendar isn't connected
  const future = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const before = await sb.from("bookings").select("id", { count: "exact", head: true });
  const post = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_name: "QA Tester", customer_email: "qa@test.elion.local", timezone: "Africa/Lagos", start: future }),
  });
  const after = await sb.from("bookings").select("id", { count: "exact", head: true });
  check("booking POST blocked when calendar not connected", post.status === 409, "status " + post.status);
  const body = await post.json();
  check("blocked with code calendar_not_connected", body.code === "calendar_not_connected", body.code);
  check("no booking row persisted on failure", (before.count || 0) === (after.count || 0), `before=${before.count} after=${after.count}`);

  // 3. Audit — evidence levels, product mapping, business verification, estimate labelling
  const audit = await fetch(`${BASE}/api/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name: "ELION", industry: "Technology", website: "elion.com.ng", name: "QA", email: "qa@elion.com.ng" }),
  });
  check("audit returns 200", audit.status === 200, "status " + audit.status);
  const ar = await audit.json();
  check("audit has leaks", Array.isArray(ar.leaks) && ar.leaks.length > 0);
  const withLevel = (ar.leaks || []).filter((l) => ["verified", "supported", "estimated", "unknown"].includes(l.evidenceLevel));
  check("every leak has evidenceLevel", withLevel.length === (ar.leaks || []).length, `${withLevel.length}/${(ar.leaks || []).length}`);
  const withProduct = (ar.leaks || []).filter((l) => l.recommendedProduct && l.recommendedProduct.slug);
  check("product-mapped findings exist", withProduct.length > 0, withProduct.map((l) => l.recommendedProduct.slug).join(","));
  const withNote = (ar.leaks || []).filter((l) => l.estimateNote);
  check("money findings carry illustrative-estimate note", withNote.length > 0 || (ar.leaks || []).every((l) => !l.estimatedSavings.includes("NGN")));
  check("business verification present", ar.businessVerification && Array.isArray(ar.businessVerification.facts), JSON.stringify(ar.businessVerification?.facts || []).slice(0, 160));
  check("business verification has checked date", Boolean(ar.businessVerification?.checkedAt));

  // 4. Onboarding public GET — no longer 401 for a client
  const { data: client } = await sb.from("clients").select("id").order("created_at", { ascending: false }).limit(1).single();
  if (client) {
    const og = await fetch(`${BASE}/api/onboarding/${client.id}`);
    check("onboarding GET public (200)", og.status === 200, "status " + og.status);
    const ob = await og.json();
    check("onboarding GET includes automations array", Array.isArray(ob.automations));
  } else {
    check("onboarding GET public (no clients to test)", false, "no client in db");
  }

  // 5. Page routes respond
  for (const p of ["/landing/book", "/admin/bookings"]) {
    const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
    check(`page ${p} reachable`, [200, 307].includes(r.status), "status " + r.status);
  }

  console.log(`\n=== RESULT: ${fail === 0 ? "ALL PASS" : fail + " FAILED"} (${pass} passed, ${fail} failed) ===`);
  process.exit(fail === 0 ? 0 : 1);
}

go().catch((e) => { console.error("FATAL:", e); process.exit(1); });
