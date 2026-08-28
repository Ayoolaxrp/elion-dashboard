#!/usr/bin/env python3
"""
Deep website analysis using Scrapling.
Usage: python3 scrape.py <url>
Output: JSON with detailed website analysis.
"""
import sys
import json
import re

def analyze(url: str) -> dict:
    """Analyze a website using Scrapling for deep insights."""
    result = {
        "url": url,
        "status": "unknown",
        "title": "",
        "meta_description": "",
        "tech_stack": [],
        "social_links": [],
        "has_whatsapp": False,
        "has_booking": False,
        "has_live_chat": False,
        "has_crm": False,
        "has_email_marketing": False,
        "has_analytics": False,
        "has_ecommerce": False,
        "page_speed_indicators": {},
        "headings": [],
        "images_count": 0,
        "links_count": 0,
        "forms_count": 0,
        "cta_texts": [],
        "phone_numbers": [],
        "emails_found": [],
        "error": None,
    }

    try:
        from scrapling.fetchers import Fetcher
        page = Fetcher.get(url, timeout=15)
        result["status"] = "success"
        html = page.html_content if hasattr(page, 'html_content') else str(page)

        # Title
        titles = page.css('title')
        if titles:
            result["title"] = titles[0].text.strip()

        # Meta description
        metas = page.css('meta[name="description"]')
        if metas:
            result["meta_description"] = metas[0].attrib.get('content', '')

        # Tech stack detection
        lower_html = html.lower() if isinstance(html, str) else ''
        tech_checks = {
            'Next.js': ['_next', 'nextjs', '__next'],
            'React': ['react', '__react'],
            'WordPress': ['wordpress', 'wp-content', 'wp-includes'],
            'Shopify': ['shopify', 'cdn.shopify'],
            'Wix': ['wix.com', 'wixstatic'],
            'Webflow': ['webflow', 'wf-'],
            'Bubble': ['bubble.io'],
            'Vue.js': ['vue.js', 'vuejs', 'v-cloak'],
            'Angular': ['ng-', 'angular'],
            'Svelte': ['svelte'],
            'Tailwind CSS': ['tailwindcss', 'tailwind'],
            'Bootstrap': ['bootstrap'],
            'Google Analytics': ['google-analytics', 'gtag', 'gtm.js', 'googletagmanager'],
            'Facebook Pixel': ['facebook.net/en_US/fbevents', 'fbq('],
            'HubSpot': ['hubspot', 'hs-scripts'],
            'Salesforce': ['salesforce', 'force.com'],
            'Intercom': ['intercom'],
            'Drift': ['drift.com'],
            'Crisp': ['crisp.chat'],
            'Tawk.to': ['tawk.to'],
            'Mailchimp': ['mailchimp', 'list-manage'],
            'SendGrid': ['sendgrid'],
            'Stripe': ['stripe.com'],
            'Paystack': ['paystack'],
            'Flutterwave': ['flutterwave'],
        }
        for tech, keywords in tech_checks.items():
            if any(kw in lower_html for kw in keywords):
                result["tech_stack"].append(tech)

        # Social links
        social_patterns = {
            'Instagram': r'instagram\.com/[^"\s]+',
            'Facebook': r'facebook\.com/[^"\s]+',
            'Twitter/X': r'(twitter\.com|x\.com)/[^"\s]+',
            'LinkedIn': r'linkedin\.com/(company|in)/[^"\s]+',
            'TikTok': r'tiktok\.com/@[^"\s]+',
            'YouTube': r'youtube\.com/(c/|channel/|@)[^"\s]+',
        }
        for platform, pattern in social_patterns.items():
            match = re.search(pattern, lower_html)
            if match:
                result["social_links"].append(platform)

        # WhatsApp
        result["has_whatsapp"] = any(kw in lower_html for kw in ['wa.me', 'whatsapp', 'api.whatsapp'])

        # Booking
        result["has_booking"] = any(kw in lower_html for kw in ['booking', 'calendly', 'schedule', 'appointment', 'book a call', 'book a demo'])

        # Live chat
        result["has_live_chat"] = any(kw in lower_html for kw in ['intercom', 'drift', 'crisp', 'tawk', 'livechat', 'zendesk'])

        # CRM
        result["has_crm"] = any(kw in lower_html for kw in ['hubspot', 'salesforce', 'pipedrive', 'zoho', 'freshdesk'])

        # Email marketing
        result["has_email_marketing"] = any(kw in lower_html for kw in ['mailchimp', 'sendgrid', 'newsletter', 'subscribe'])

        # Analytics
        result["has_analytics"] = any(kw in lower_html for kw in ['google-analytics', 'gtag', 'gtm.js', 'fbq(', 'pixel', 'hotjar', 'mixpanel'])

        # E-commerce
        result["has_ecommerce"] = any(kw in lower_html for kw in ['shop', 'cart', 'checkout', 'woocommerce', 'shopify', 'product', 'add to cart'])

        # Headings
        for i in range(1, 4):
            headings = page.css(f'h{i}')
            for h in headings[:3]:
                text = h.text.strip() if h.text else ''
                if text:
                    result["headings"].append(f"h{i}: {text}")

        # Counts
        result["images_count"] = len(page.css('img'))
        result["links_count"] = len(page.css('a'))
        result["forms_count"] = len(page.css('form'))

        # CTA texts
        buttons = page.css('button, a[class*="btn"], a[class*="button"], [class*="cta"]')
        for btn in buttons[:10]:
            text = btn.text.strip() if btn.text else ''
            if text and len(text) < 50:
                result["cta_texts"].append(text)

        # Phone numbers
        phones = re.findall(r'[\+]?[\d\s\-\(\)]{10,15}', html if isinstance(html, str) else '')
        result["phone_numbers"] = list(set(phones[:5]))

        # Emails
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html if isinstance(html, str) else '')
        result["emails_found"] = list(set(emails[:10]))

    except Exception as e:
        result["error"] = str(e)
        result["status"] = "error"

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 scrape.py <url>"}))
        sys.exit(1)
    url = sys.argv[1]
    if not url.startswith("http"):
        url = "https://" + url
    result = analyze(url)
    print(json.dumps(result, indent=2))
