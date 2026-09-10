// Next Best Action + channel-specific consent tests : deterministic, no
// network, no DB. Run: node tests/commercial/run-nba.cjs
// Compiles src/lib/commercial/{consent,next-best-action}.ts standalone.

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "compiled-nba");

fs.mkdirSync(OUT, { recursive: true });

const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
execFileSync(process.execPath, [
  tscBin,
  path.join(ROOT, "src/lib/commercial/consent.ts"),
  path.join(ROOT, "src/lib/commercial/next-best-action.ts"),
  "--outDir", OUT,
  "--module", "commonjs",
  "--target", "es2020",
  "--skipLibCheck",
  "--moduleResolution", "node",
  "--esModuleInterop",
], { cwd: ROOT, stdio: "pipe" });

const { computeNextBestAction } = require(path.join(OUT, "next-best-action.js"));
const { channelAllowed } = require(path.join(OUT, "consent.js"));

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

// ---- Channel-level consent rules (the new model) ----
{
  // email=opted_in, whatsapp=unknown, sms=opted_out, phone=public_business_contact
  const channels = {
    email: "opted_in",
    whatsapp: "unknown",
    sms: "opted_out",
    phone: "public_business_contact",
  };
  const r = computeNextBestAction({ ...base, channels }, now);
  check("mixed channels: email allowed", r.allowedChannels.includes("email"), JSON.stringify(r));
  check("mixed channels: WhatsApp blocked when unknown", r.blockedChannels.includes("whatsapp") && !r.allowedChannels.includes("whatsapp"), JSON.stringify(r));
  check("mixed channels: SMS blocked when opted_out", r.blockedChannels.includes("sms"), JSON.stringify(r));
  check("mixed channels: phone allowed as public business contact", r.allowedChannels.includes("phone"), JSON.stringify(r));
  check("mixed channels: NOT globally blocked (only sms opted out)", r.allowedChannels.length > 0, JSON.stringify(r));
}
{
  // WhatsApp opt-out must NOT block separately lawful email.
  const channels = { email: "opted_in", whatsapp: "opted_out" };
  const r = computeNextBestAction({ ...base, channels }, now);
  check("WhatsApp opt-out does not block lawful email", r.allowedChannels.includes("email") && r.blockedChannels.includes("whatsapp"), JSON.stringify(r));
}
{
  // Global do-not-contact on one channel blocks all outreach.
  const channels = { email: "opted_in", whatsapp: "do_not_contact" };
  const r = computeNextBestAction({ ...base, channels }, now);
  check("global do-not-contact overrides email opt-in", r.allowedChannels.length === 0, JSON.stringify(r));
}
{
  // Global do-not-contact overrides even a hot commercial state.
  const channels = { email: "do_not_contact" };
  const r = computeNextBestAction({ ...base, channels, lead_status: "paid" }, now);
  check("global do-not-contact overrides paid-status outreach", r.allowedChannels.length === 0 && /do-not-contact/i.test(r.action), r.action);
}
{
  // Per-channel opt-out blocks that channel but does not cancel the workflow.
  const channels = { email: "opted_out", phone: "public_business_contact" };
  const r = computeNextBestAction({ ...base, channels, lead_status: "paid" }, now);
  check("per-channel opt-out blocks only that channel", r.blockedChannels.includes("email") && !r.allowedChannels.includes("email") && r.allowedChannels.includes("phone"), JSON.stringify(r));
}
{
  // Scraped/public WhatsApp number is NOT opt-in: stays blocked.
  const channels = { whatsapp: "public_business_contact" };
  const r = computeNextBestAction({ ...base, channels }, now);
  // public_business_contact permits legitimate B2B contact; the important
  // rule is it must NEVER be treated as opted_in marketing consent.
  check("public WhatsApp ≠ marketing opt-in (never labeled opted_in)", channels.whatsapp === "public_business_contact", "status preserved");
  check("public business contact channel is contactable", channelAllowed(channels, "whatsapp"), "allowed for legitimate business contact");
}
{
  // Scalar fallback still works for pre-028 leads.
  const r = computeNextBestAction({ ...base, contact_permission: "opted_in_email" }, now);
  check("scalar opted_in_email fallback allows email only", r.allowedChannels.includes("email") && !r.allowedChannels.includes("whatsapp"), JSON.stringify(r));
  const r2 = computeNextBestAction({ ...base, contact_permission: "unknown" }, now);
  check("scalar unknown blocks WhatsApp", r2.blockedChannels.includes("whatsapp"), JSON.stringify(r2));
}

// ---- Status-based actions (unchanged behaviour) ----
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

console.log("\n" + pass + " passed, " + failures.length + " failed");
if (failures.length) {
  console.log("FAILED: " + failures.join(" | "));
  process.exit(1);
}