#!/usr/bin/env node
/**
 * Deep research pass for the 20-prospect pipeline using Scrapling (scripts/scrape.py).
 *
 * Reads sales/prospect-pipeline.csv, runs the hardened Scrapling deep fetch against
 * each prospect website (HTTP fetcher with stealth-browser fallback), and stores:
 *   - sales/research/<prospect_id>.json   raw per-site deep analysis
 *   - sales/research/summary.json         merged result
 *   - sales/research/findings.md          human-readable evidence digest
 *
 * Resume-safe: sites that already have an output file are skipped.
 * Usage: node scripts/deep-research-prospects.cjs [--all]
 *   --all  re-run every site (ignore existing outputs)
 */
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const PY = process.env.PYTHON || "python";
const ROOT = path.join(__dirname, "..");
const CSV = path.join(ROOT, "sales", "prospect-pipeline.csv");
const OUT_DIR = path.join(ROOT, "sales", "research");
const REFORCE = process.argv.includes("--all");
const MAX_ARG = process.argv.indexOf("--max");
const MAX_NEW = MAX_ARG > -1 ? parseInt(process.argv[MAX_ARG + 1], 10) : Infinity;

fs.mkdirSync(OUT_DIR, { recursive: true });

function parseCsv(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const head = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cells = l.split(",").map((c) => c.trim());
    const row = {};
    head.forEach((h, i) => { row[h] = cells[i] !== undefined ? cells[i] : ""; });
    return row;
  });
}

function runScrape(url, timeoutMs) {
  return new Promise((resolve) => {
    execFile(PY, [path.join(ROOT, "scripts", "scrape.py"), url], {
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: true,
      encoding: "utf8",
    }, (err, stdout) => {
      if (err || !stdout) { resolve({ error: err ? String(err.message || err).slice(0, 200) : "no output" }); return; }
      try { resolve(JSON.parse(stdout)); }
      catch { resolve({ error: "unparseable stdout: " + stdout.slice(0, 120) }); }
    });
  });
}

// Last-resort fetch when Scrapling cannot connect (flaky TLS on this machine).
// Labelled fetcher_used:"node-fallback" so evidence provenance stays honest.
async function nodeFallback(url) {
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36" } });
    if (!res.ok) return { error: "node fallback status " + res.status };
    const html = await res.text();
    const low = html.toLowerCase();
    const emails = [...new Set((html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
      .filter((e) => !/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(e) && !/sentry|wixpress/.test(e)))].slice(0, 10);
    const phones = [];
    for (const t of html.matchAll(/href=["']tel:([^"'>]+)["']/gi)) {
      const digits = t[1].replace(/\D/g, "");
      if (digits.length >= 7 && !phones.includes(digits)) phones.push(digits);
    }
    for (const m of html.matchAll(/\+?\d[\d\s().-]{8,17}/g)) {
      const digits = m[0].replace(/\D/g, "");
      if (digits.length >= 10 && digits.length <= 14 && !phones.includes(digits) && !(phones.length >= 6)) phones.push(digits);
    }
    const social = [];
    const pats = [["Instagram", /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.\-/]+/g], ["Facebook", /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.\-/]+/g], ["Twitter/X", /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_.\-/]+/g], ["LinkedIn", /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_.\-/]+/g], ["TikTok", /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.\-]+/g], ["YouTube", /https?:\/\/(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)[a-zA-Z0-9_.\-/]+/g]];
    for (const [name, re] of pats) {
      const m = low.match(re);
      if (m) social.push({ platform: name, url: m[0].replace(/\/$/, "") });
    }
    const wa = [...new Set((low.match(/https?:\/\/(?:api\.)?wa\.me\/[0-9]+|https?:\/\/(?:api\.)?whatsapp\.com\/send\?phone=[0-9]+/g) || []))];
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || "";
    return { status: "success", fetcher_used: "node-fallback", status_code: res.status, title: title.trim().slice(0, 200), emails_found: emails, phone_numbers: phones.slice(0, 8), social_links: social, whatsapp_deep_links: wa, has_whatsapp: wa.length > 0, has_booking: /calendly|book now|book a call|schedule|appointment/.test(low), tech_stack: [], meta_description: "", markdown_preview: "", error: null };
  } catch (e) {
    return { error: "node fallback: " + String(e.message || e).slice(0, 120) };
  }
}

async function main() {
  const prospects = parseCsv(CSV);
  console.log("prospects:", prospects.length);
  const summary = [];
  let ok = 0, failed = 0, skipped = 0;

  let processed = 0;
  for (const p of prospects) {
    if (processed >= MAX_NEW) break;
    const id = p.prospect_id;
    const outFile = path.join(OUT_DIR, id + ".json");
    if (!REFORCE && fs.existsSync(outFile)) { skipped++; summary.push({ prospect_id: id, skipped: true }); continue; }
    processed++;
    const url = p.website;
    process.stdout.write(id + " " + p.business_name + " ... ");
    let data = null;
    for (let attempt = 1; attempt <= 2 && !data; attempt++) {
      data = await runScrape(url, 150000);
      if (data.error || data.status === "error") {
        if (attempt === 1) process.stdout.write("(retry) ");
        data = null;
      }
    }
    if (!data) {
      process.stdout.write("(node-fallback) ");
      data = await nodeFallback(url);
    }
    if (!data || data.error) { failed++; console.log("FAILED"); summary.push({ prospect_id: id, business_name: p.business_name, website: url, failed: true, error: data && data.error }); continue; }
    ok++;
    const slim = {
      prospect_id: id,
      business_name: p.business_name,
      website: url,
      url_final: data.url_final || url,
      fetcher_used: data.fetcher_used || null,
      status_code: data.status_code ?? null,
      status: data.status,
      title: data.title || "",
      meta_description: (data.meta_description || "").slice(0, 300),
      tech_stack: data.tech_stack || [],
      social_links: Array.isArray(data.social_links) ? data.social_links : (data.social_links_detail || []).map((s) => s.platform),
      social_links_detail: data.social_links_detail || (Array.isArray(data.social_links) && data.social_links[0] && typeof data.social_links[0] === "object" ? data.social_links : []),
      whatsapp_deep_links: data.whatsapp_deep_links || [],
      has_whatsapp: !!data.has_whatsapp,
      has_booking: !!data.has_booking,
      has_live_chat: !!data.has_live_chat,
      phone_numbers: data.phone_numbers || [],
      emails_found: data.emails_found || [],
      json_ld_types: data.json_ld_types || [],
      headings: (data.headings || []).slice(0, 6),
      cta_texts: (data.cta_texts || []).slice(0, 6),
      markdown_preview: (data.markdown_preview || "").slice(0, 2500),
      error: data.error || null,
      researched_at: new Date().toISOString(),
    };
    fs.writeFileSync(outFile, JSON.stringify(slim, null, 2));
    console.log("OK (" + (data.fetcher_used || "?") + ")");
    summary.push(slim);
  }

  rebuildDigest();
  console.log("\nDone: ok=" + ok + " failed=" + failed + " skipped=" + skipped);
  if (failed > 0) console.log("Failed ids: " + summary.filter((s) => s.failed).map((s) => s.prospect_id).join(", "));
}

function rebuildDigest() {
  // summary.json is rebuilt from per-site files so partial runs never lose prior data.
  const files = fs.readdirSync(OUT_DIR).filter((f) => /^P\d+\.json$/.test(f));
  const rows = files.map((f) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf8")))
    .sort((a, b) => a.prospect_id.localeCompare(b.prospect_id));
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(rows, null, 2));

  const md = ["# Prospect deep-research digest (Scrapling)", "",
    "Fetched by the Scrapling deep-analysis pipeline (`scripts/scrape.py` -> `scripts/deep-research-prospects.cjs`).",
    "Evidence is directly observed from each prospect's public site. `fetcher_used`: http/stealth = Scrapling; node-fallback = plain fetch (flaky-TLS fallback).", ""];
  for (const r of rows) {
    const chans = [];
    if (r.emails_found && r.emails_found.length) chans.push("email: " + r.emails_found.join(", "));
    if (r.phone_numbers && r.phone_numbers.length) chans.push("phone: +" + r.phone_numbers.filter((p) => !p.startsWith("0")).join(" / +"));
    if (r.whatsapp_deep_links && r.whatsapp_deep_links.length) chans.push("WhatsApp: " + r.whatsapp_deep_links.join(", "));
    const social = (r.social_links || []).join(", ");
    md.push("## " + r.prospect_id + " — " + r.business_name, "",
      "- Site: " + r.website + (r.url_final && r.url_final !== r.website ? " (final: " + r.url_final + ")" : ""),
      "- Fetcher: " + (r.fetcher_used || "?") + " | title: " + (r.title || "").slice(0, 120),
      "- Socials: " + (social || "none detected"),
      "- Channels: " + (chans.length ? chans.join(" | ") : "none surfaced on homepage HTML"),
      "- Booking surface: " + (r.has_booking ? "yes" : "no") + " | tech: " + ((r.tech_stack || []).join(", ") || "?"),
      "");
  }
  fs.writeFileSync(path.join(OUT_DIR, "findings.md"), md.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
