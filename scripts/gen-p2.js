const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "src", "app", "admin", "onboarding");
fs.mkdirSync(dir, { recursive: true });
const b64 = fs.readFileSync(path.join(__dirname, "onboard-page.b64"), "utf8");
const content = Buffer.from(b64.trim(), "base64").toString("utf8");
fs.writeFileSync(path.join(dir, "page.tsx"), content);
console.log("Written " + content.split("
").length + " lines");
