#!/usr/bin/env python3
"""
Deep website analysis using Scrapling (https://github.com/d4vinci/Scrapling).
Usage: python scrape.py <url>
Output: single-line JSON with detailed website analysis.

Fetch strategy (the Scrapling pipeline used by the ELION audit engine):
  1. `Fetcher.get(url)` — lightweight HTTP fetcher (curl_cffi + stealthy headers);
     Scrapling retries internally on transient failures.
  2. If that fails (TLS reset, DNS flake, 403/429 block, Cloudflare challenge) it
     falls back to `StealthyFetcher.fetch(url)` — a real headless Chrome browser
     that drives through bot protection and renders JS-heavy pages.

No log lines are printed to stdout (Scrapling logs to stderr), so stdout is pure JSON.
"""
import sys
import json
import re


def empty_result(url):
    return {
        "url": url, "url_final": url, "fetcher_used": None, "status_code": None,
        "status": "unknown", "title": "", "meta_description": "",
        "tech_stack": [], "social_links": [], "social_links_detail": [],
        "has_whatsapp": False, "whatsapp_deep_links": [],
        "has_booking": False, "has_live_chat": False,
        "has_crm": False, "has_email_marketing": False, "has_analytics": False,
        "has_ecommerce": False, "page_speed_indicators": {}, "headings": [],
        "images_count": 0, "links_count": 0, "forms_count": 0, "cta_texts": [],
        "phone_numbers": [], "emails_found": [], "json_ld_types": [],
        "markdown_preview": "", "error": None,
    }


def _looks_blocked(html):
    markers = [
        "cf-browser-verification", "cf_chl_opt", "challenge-platform",
        "just a moment", "attention required", "access denied", "captcha",
        "verify you are human", "__cf_chl", "ddos-guard", "incapsula", "perimeterx",
    ]
    low = (html or "").lower()
    return any(m in low for m in markers)


def _fetch_page(url):
    """Return (page, fetcher_name) — Scrapling http-first with stealth fallback."""
    from scrapling.fetchers import Fetcher, StealthyFetcher
    last_error = None
    try:
        page = Fetcher.get(url, timeout=25)
        if page.status and page.status < 400 and not _looks_blocked(page.html_content or ""):
            return page, "http"
        last_error = f"http status {getattr(page, 'status', '?')} or block-page detected"
    except Exception as e:
        last_error = str(e)[:300]
    try:
        page = StealthyFetcher.fetch(url, headless=True)
        return page, "stealth"
    except Exception as e:
        return None, f"stealth failed too: {last_error} / {str(e)[:300]}"


def _el_text(el):
    try:
        return (el.text or "").strip()
    except Exception:
        return ""

def analyze(url):
    result = empty_result(url)
    try:
        page, fetcher = _fetch_page(url)
        if page is None:
            result["status"] = "error"
            result["error"] = fetcher
            return result
        result["fetcher_used"] = fetcher
        result["url_final"] = getattr(page, "url", url) or url
        result["status_code"] = getattr(page, "status", None)
        result["status"] = "success" if (page.status or 0) < 400 else "error"

        html = page.html_content or ""
        if _looks_blocked(html):
            result["status"] = "error"
            result["error"] = "block page returned even via stealth"
            return result

        for t in page.css("title"):
            if _el_text(t):
                result["title"] = _el_text(t)
                break
        for m in page.css('meta[name="description"], meta[property="og:description"]'):
            desc = (m.attrib or {}).get("content", "")
            if desc:
                result["meta_description"] = desc.strip()
                break

        lower_html = html.lower()

        tech_checks = {
            "Next.js": ["_next", "nextjs", "__next"], "React": ["react", "__react"],
            "WordPress": ["wordpress", "wp-content", "wp-includes"],
            "Shopify": ["shopify", "cdn.shopify"], "Wix": ["wix.com", "wixstatic"],
            "Webflow": ["webflow", "wf-"], "Bubble": ["bubble.io"],
            "Vue.js": ["vue.js", "vuejs", "v-cloak"], "Angular": ["ng-", "angular"],
            "Svelte": ["svelte"], "Tailwind CSS": ["tailwindcss", "tailwind"],
            "Bootstrap": ["bootstrap"],
            "Google Analytics": ["google-analytics", "gtag", "gtm.js", "googletagmanager"],
            "Facebook Pixel": ["facebook.net/en_US/fbevents", "fbq("],
            "HubSpot": ["hubspot", "hs-scripts"], "Salesforce": ["salesforce", "force.com"],
            "Intercom": ["intercom"], "Drift": ["drift.com"], "Crisp": ["crisp.chat"],
            "Tawk.to": ["tawk.to"], "Mailchimp": ["mailchimp", "list-manage"],
            "SendGrid": ["sendgrid"], "Stripe": ["stripe.com"], "Paystack": ["paystack"],
            "Flutterwave": ["flutterwave"], "Calendly": ["calendly"],
        }
        for tech, keywords in tech_checks.items():
            if any(kw in lower_html for kw in keywords):
                result["tech_stack"].append(tech)

        social_patterns = {
            "Instagram": r"https?://(?:www\.)?instagram\.com/[a-zA-Z0-9_.\-/]+",
            "Facebook": r"https?://(?:www\.)?facebook\.com/[a-zA-Z0-9_.\-/]+",
            "Twitter/X": r"https?://(?:www\.)?(?:twitter|x)\.com/[a-zA-Z0-9_.\-/]+",
            "LinkedIn": r"https?://(?:www\.)?linkedin\.com/(?:company|in)/[a-zA-Z0-9_.\-/]+",
            "TikTok": r"https?://(?:www\.)?tiktok\.com/@[a-zA-Z0-9_.\-]+",
            "YouTube": r"https?://(?:www\.)?youtube\.com/(?:c/|channel/|@)[a-zA-Z0-9_.\-/]+",
        }
        found_platforms, seen_links = [], set()
        for platform, pattern in social_patterns.items():
            for m in re.finditer(pattern, lower_html):
                link = m.group(0).rstrip("/")
                if link not in seen_links:
                    seen_links.add(link)
                    found_platforms.append({"platform": platform, "url": link})
                break
        result["social_links"] = [s["platform"] for s in found_platforms]
        result["social_links_detail"] = found_platforms

        wa_links = set(re.findall(
            r"https?://(?:api\.)?wa\.me/[0-9]+|https?://(?:api\.)?whatsapp\.com/send\?phone=[0-9]+",
            lower_html,
        ))
        result["whatsapp_deep_links"] = sorted(wa_links)
        result["has_whatsapp"] = bool(wa_links) or any(
            kw in lower_html for kw in ["wa.me", "api.whatsapp", "whatsapp.com/send"])

        result["has_booking"] = any(kw in lower_html for kw in
            ["calendly", "booking", "schedule", "appointment", "book a call",
             "book a demo", "book now", "book viewing"])
        result["has_live_chat"] = any(kw in lower_html for kw in
            ["intercom", "drift", "crisp", "tawk", "livechat", "zendesk"])
        result["has_crm"] = any(kw in lower_html for kw in
            ["hubspot", "salesforce", "pipedrive", "zoho", "freshdesk"])
        result["has_email_marketing"] = any(kw in lower_html for kw in
            ["mailchimp", "sendgrid", "newsletter", "subscribe"])
        result["has_analytics"] = any(kw in lower_html for kw in
            ["google-analytics", "gtag", "gtm.js", "fbq(", "pixel", "hotjar", "mixpanel"])
        result["has_ecommerce"] = any(kw in lower_html for kw in
            ["shop", "cart", "checkout", "woocommerce", "shopify", "add to cart"])

        for i in range(1, 4):
            for h in page.css(f"h{i}")[:3]:
                text = _el_text(h)
                if text:
                    result["headings"].append(f"h{i}: {text}")

        result["images_count"] = len(page.css("img"))
        result["links_count"] = len(page.css("a"))
        result["forms_count"] = len(page.css("form"))

        for btn in page.css('button, a[class*="btn"], a[class*="button"], [class*="cta"]')[:10]:
            text = _el_text(btn)
            if text and len(text) < 60:
                result["cta_texts"].append(text)

        # Phone numbers — tel: links first (high precision), then structured text matches.
        cleaned = []
        for t in re.findall(r'href=["\']tel:([^"\'>]+)["\']', lower_html):
            digits = re.sub(r"\D", "", t)
            if 7 <= len(digits) <= 14 and digits not in cleaned:
                cleaned.append(digits)
        # Text candidates must look like phone numbers, not bare timestamp digit-runs:
        # require a separator/formatting, a leading +, or a leading 0 with <=11 digits.
        # Text-scan additions are restricted to Nigeria-market phone shapes
        # (Lagos prospect pipeline): 234-country code or 0-prefixed mobile.
        for m in re.finditer(r"\+?\d[\d\s().-]{8,17}", html):
            cand = m.group(0).strip()
            digits = re.sub(r"\D", "", cand)
            if digits in cleaned:
                continue
            country = digits.startswith("234") and len(digits) in (12, 13, 14)
            local = digits.startswith("0") and len(digits) == 11
            looks_binary = not set(digits) - set("01")
            if (country or local) and not looks_binary:
                cleaned.append(digits)
        result["phone_numbers"] = cleaned[:8]

        emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", html)
        result["emails_found"] = sorted(set(
            e for e in emails
            if not e.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"))
            and "sentry" not in e.lower() and "wixpress" not in e.lower()))[:12]

        for script in page.css('script[type="application/ld+json"]'):
            raw = script.text or ""
            for m in re.finditer(r'"@type"\s*:\s*"([A-Za-z]+)"', raw):
                if m.group(1) not in result["json_ld_types"]:
                    result["json_ld_types"].append(m.group(1))

        # Rendered markdown preview (grounds outreach in the site's own words).
        md = ""
        for getter in (lambda: page.markdown(), lambda: page.get_all_text(),
                       lambda: page.css("body")[0].get_all_text()):
            try:
                raw = getter()
                md = raw.decode("utf-8", "ignore") if isinstance(raw, bytes) else str(raw or "")
            except Exception:
                md = ""
            if md and md.strip():
                break
        result["markdown_preview"] = re.sub(r"\n{3,}", "\n\n", md).strip()[:4000]

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)[:300]
    return result

if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # Windows cp1252 cannot print naira/etc.
    except Exception:
        pass
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python scrape.py <url>"}))
        sys.exit(1)
    url = sys.argv[1]
    if not url.startswith("http"):
        url = "https://" + url
    result = analyze(url)
    print(json.dumps(result, ensure_ascii=False))
