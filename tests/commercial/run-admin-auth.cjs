// Admin authorization regression test.
// This source-level check complements deployed session smoke tests.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const routes = [
  "src/app/api/admin/migrate/route.ts",
  "src/app/api/admin/setup/route.ts",
  "src/app/api/admin/settings/route.ts",
  "src/app/api/admin/deployments/route.ts",
  "src/app/api/admin/proposals/route.ts",
  "src/app/api/payments/kora/initialize/route.ts",
  "src/app/api/payments/kora/verify/route.ts",
];

let pass = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
}

for (const relative of routes) {
  const file = fs.readFileSync(path.join(root, relative), "utf8");
  check(`${relative}: reads authenticated session`, file.includes("authClient.auth.getUser()"));
  check(`${relative}: rejects unauthenticated user`, /if \(!user(?:\s*\|\|\s*!?\()?/.test(file) || file.includes("if (!user ||"));
  check(
    `${relative}: checks admin authorization`,
    file.includes("isAdminEmail(user.email)") || file.includes('adminEmails.includes((user.email || "").toLowerCase())')
  );
  check(`${relative}: returns Unauthorized`, file.includes("Unauthorized"));
}

const helper = fs.readFileSync(path.join(root, "src/lib/auth/server.ts"), "utf8");
check("admin helper includes dynamic admin directory", helper.includes('from("admin_directory")'));
check("admin helper includes bootstrap env admins", helper.includes("process.env.ADMIN_EMAILS"));

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("FAILED: " + failures.join(" | "));
  process.exit(1);
}
