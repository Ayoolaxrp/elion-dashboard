// Next Best Action + consent tests : deterministic, no network, no DB.
// Run: node tests/commercial/run-nba.cjs
// Extracts the pure computeNextBestAction from the route file and compiles
// it standalone (the route imports next/server, which we do not need).

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "compiled-nba");

const routeSrc = fs.readFileSync(
  path.join(ROOT, "src/app/api/admin/lead-intelligence/route.ts"), "utf8"
);
const fnStart = routeSrc.indexOf("export function computeNextBestAction");
const fnEnd = routeSrc.indexOf("// ── Route handler ──");
if (fnStart < 0 || fnEnd < 0) {
  console.error("computeNextBestAction block not found in route.ts");
  process.exit(1);
}

const RETURN_TYPE = "{ action: string; reason: string; allowedChannels: string[]; blockedChannels: string[] }";
const fnBlock = routeSrc
  .slice(fnStart, fnEnd)
  .replace("export function computeNextBestAction", "function computeNextBestAction")
  .replace("): NextBestAction {", "): " + RETURN_TYPE + " {");
// Drop any stray exported interface that slipped into the slice.
const shim = "type NextBestAction = " + RETURN_TYPE + ";\nconst DAYS = 86_400_000;\n" + fnBlock
  + "\nmodule.exports = { computeNextBestAction };\n";

fs.mkdirSync(OUT, { recursive: true });
const shimPath = path.join(OUT, "nba.ts");
fs.writeFileSync(shimPath, shim);

const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
execFileSync(process.execPath, [tscBin, shimPath,
  "--outDir", OUT, "--module", "commonjs", "--target", "es2020", "--skipLibCheck",
], { cwd: ROOT, stdio: "pipe" });

const { computeNextBestAction } = require(path.join(OUT, "nba.js"));

let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
};

const DAY = 86_400_000;
const now = Date.now();
const base = {
  lead_status: "audited",
  contact_permission: "public_business_contact",
  updated_at: new Date(now).toISOString(),
  industry: "Recruitment",
  hasOpportunities: true,
  hasVerifiedEvidence: true,
};

// ---- Consent rules ----
{
  const r = computeNextBestAction({ ...base, contact_permission: "opted_out" }, now);
  check("opted_out blocks all outreach", r.allowedChannels.length === 0 && r.blockedChannels.includes("email") && r.blockedChannels.includes("whatsapp"), JSON.stringify(r));
  const r2 = computeNextBestAction({ ...base, contact_permission: "do_not_contact" }, now);
  check("do_not_contact blocks all outreach", r2.allowedChannels.length === 0, JSON.stringify(r2.allowedChannels));
}
{
  const r = computeNextBestAction({ ...base, contact_permission: "unknown" }, now);
  check("unknown permission blocks WhatsApp specifically", r.blockedChannels.includes("whatsapp") && !r.allowedChannels.includes("whatsapp"), JSON.stringify(r));
}
{
  const r = computeNextBestAction({ ...base, contact_permission: "public_business_contact" }, now);
  check("public business contact allows email, blocks WhatsApp marketing", r.allowedChannels.includes("email") && r.blockedChannels.includes("whatsapp"), JSON.stringify(r));
}
{
  const r = computeNextBestAction({ ...base, contact_permission: "opted_in_whatsapp" }, now);
  check("explicit WhatsApp opt-in unlocks WhatsApp", r.allowedChannels.includes("whatsapp"), JSON.stringify(r));
}

// ---- Status-based actions ----
{
  const r = computeNextBestAction({ ...base, hasVerifiedEvidence: false }, now);
  check("no verified evidence => request Deep Audit, do not pitch", /Deep Audit/i.test(r.action), r.action);
}
{
  const r = computeNextBestAction({ ...base, hasOpportunities: false }, now);
  check("no strong opportunity => discovery call, explicitly do not pitch", /do not pitch/i.test(r.action), r.action);
}
{
  const r = computeNextBestAction({ ...base, proposalSentAt: new Date(now - 5 * DAY).toISOString() }, now);
  check("proposal older than 3 days => follow up on proposal", /Follow up on the proposal/.test(r.action) && /5 day/.test(r.action), r.action);
}
{
  const r = computeNextBestAction({ ...base, proposalSentAt: new Date(now - 1 * DAY).toISOString() }, now);
  check("proposal younger than 3 days => normal status action", !/Follow up on the proposal/.test(r.action), r.action);
}
{
  const r = computeNextBestAction({ ...base, lead_status: "payment_pending" }, now);
  check("payment_pending warns against provisioning before cash", /do not provision infrastructure/i.test(r.action), r.action);
}
{
  const r = computeNextBestAction({ ...base, lead_status: "paid" }, now);
  check("paid => start onboarding immediately", /onboarding/i.test(r.action), r.action);
}
{
  const r = computeNextBestAction({ ...base, lead_status: "lost" }, now);
  check("lost => archive with honest loss logging", /Archive/.test(r.action), r.action);
}

// ---- Opt-out overrides a hot commercial state ----
{
  const r = computeNextBestAction({ ...base, contact_permission: "opted_out", lead_status: "paid" }, now);
  check("opt-out overrides even paid-status outreach", r.allowedChannels.length === 0 && /opted out/.test(r.action), r.action);
}

console.log("\n" + pass + " passed, " + failures.length + " failed");
if (failures.length) {
  console.log("FAILED: " + failures.join(" | "));
  process.exit(1);
}
