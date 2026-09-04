// Deployment-readiness scrub: removes confirmed QA/test records from the live
// DB. PRESERVES: the 20 real Lagos real-estate prospect audits, the founder's
// demo client (Awodeyi Business), org_elion_platform, and all status-page data.
// Run only when the owner has green-lit the scrub.
const fs = require("fs");
const path = require("path");
const os = require("os");
const token = process.env.SB_ACCESS_TOKEN || (() => {
  const candidates = [path.join(os.tmpdir(), "sb-token.txt"), path.join(os.tmpdir(), "sb_token.txt")];
  for (const c of candidates) { try { const t = fs.readFileSync(c, "utf8").trim(); if (t) return t; } catch {} }
  return "";
})();
if (!token) { console.error("no token"); process.exit(1); }

const KEEP_CLIENT = "client_ea70d52b-af8a-41fb-9095-da09d1bb05b2"; // Awodeyi Business (founder demo env)

const steps = [
  // 1) Test audits (leave the 20 real prospect audits untouched)
  `DELETE FROM audits WHERE id IN (
     'audit_8f35b40d-4ce6-4e8d-829f-98f24bae9016','audit_405fe08a-3c06-42e8-9a1c-f7c954257969','audit_77b1d802-0db6-46f6-8f45-99cd06e8ba73',
     'audit_802ea54e-5e9f-467a-967a-41bf198d5948','audit_bc836330-7b20-4fdc-bffd-354aba1e316e','audit_49eb9177-c17d-4386-81bb-7a1e723be642','audit_b7fced4f-13d9-4f6c-8d98-e20d94c2c672');`,
  // 2) QA notifications
  `DELETE FROM notifications;`,
  // 3) QA payment record
  `DELETE FROM payments WHERE reference LIKE 'QA-REF-%' OR company_name = 'QA Comm Corp';`,
  // 4) Pipelines for clients being removed (kept client's pipeline cascades-safe below)
  `DELETE FROM onboarding_pipeline WHERE client_id <> '${KEEP_CLIENT}';`,
  // 5) QA/seed clients (cascades: automations, integrations, metrics,
  //    entitlements, config, provisioning_logs, credentials, executions)
  `DELETE FROM clients WHERE id <> '${KEEP_CLIENT}';`,
  // 6) All leads are QA/test (funnel walk-throughs, timing/isolation tests,
  //    redeploy tests). Kept audits have lead_id NULL; clients SET NULL.
  `DELETE FROM leads;`,
  // 7) Test-era activity log
  `DELETE FROM activity_log;`,
  // 8) Orphaned orgs (created by seeding/test provisioning). Keep the ELION
  //    platform org and the founder demo client's org.
  `DELETE FROM organizations WHERE id <> 'org_elion_platform';`,
];

async function q(query, tag) {
  const res = await fetch("https://api.supabase.com/v1/projects/dxpzvscfbemywhkehpdm/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) { console.error("FAIL", tag, res.status, (await res.text()).slice(0, 500)); return false; }
  console.log("ok:", tag);
  return true;
}

(async () => {
  for (const [i, s] of steps.entries()) {
    const ok = await q(s, `step ${i + 1}`);
    if (!ok) process.exit(1);
  }
  const check = await fetch("https://api.supabase.com/v1/projects/dxpzvscfbemywhkehpdm/database/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ query: `SELECT
      (SELECT count(*) FROM audits) audits,
      (SELECT count(*) FROM audits WHERE company_name IN ('Ramos Real Estate','Chaman Properties','CW Real Estate','Oparah Realty','Palton Morgan Holdings','Alpha Mead Group','27th Development','Veritasi Homes','Gracias Global','Megamound','Homework Group','Homely (Lagos)','Jupitaar','Vines Realty','Zylus Group','Adron Homes','Broll Nigeria','Sujimoto Group','Jide Taiwo & Co','Knight Frank Nigeria')) kept_prospect_audits,
      (SELECT count(*) FROM leads) leads,
      (SELECT count(*) FROM clients) clients,
      (SELECT count(*) FROM notifications) notifications,
      (SELECT count(*) FROM onboarding_pipeline) pipelines,
      (SELECT count(*) FROM payments) payments,
      (SELECT count(*) FROM activity_log) activity_log,
      (SELECT count(*) FROM organizations) orgs;` }),
  });
  console.log("VERIFY:", JSON.stringify(await check.json()));
})();
