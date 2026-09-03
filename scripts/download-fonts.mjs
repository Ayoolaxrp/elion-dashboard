import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "fonts");
mkdirSync(outDir, { recursive: true });

const cssPath = process.argv[2] || join(process.env.HOME || "", "tmp", "gf.css");
const css = readFileSync(cssPath, "utf8");
const blocks = css.split("}").filter((b) => b.includes("@font-face"));

const seen = new Set();
for (const b of blocks) {
  const fam = (b.match(/font-family: '([^']+)'/) || [])[1];
  const w = (b.match(/font-weight: (\d+)/) || [])[1];
  const url = (b.match(/url\((https:[^)]+)\)/) || [])[1];
  const ur = (b.match(/unicode-range: ([^;]+)/) || [])[1] || "";
  if (!ur.includes("U+0000-00FF") || !url) continue; // latin subset only
  const key = fam + " " + w;
  if (seen.has(key)) continue;
  seen.add(key);
  let name;
  if (fam === "Inter") name = { 400: "Inter-Regular", 500: "Inter-Medium", 600: "Inter-SemiBold", 700: "Inter-Bold" }[w];
  if (fam === "Space Grotesk") name = { 400: "SpaceGrotesk-Regular", 700: "SpaceGrotesk-Bold" }[w];
  if (!name) continue;
  const res = await fetch(url);
  if (!res.ok) {
    console.log("FAIL", key, res.status);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(outDir, name + ".woff2"), buf);
  console.log("OK", name, buf.length + " bytes");
}
