// Deterministic fixtures for the ELION audit pipeline regression tests.
// Each fixture: { name, html, expect } — expectations are evaluated by
// tests/audit/run-fixtures.mjs against the compiled pipeline modules.

const BASE = "https://fixture.example";

function page(body, extra = "") {
  return `<!doctype html><html><head><title>Fixture Business</title><meta name="description" content="Fixture site for tests"><meta name="viewport" content="width=device-width, initial-scale=1">${extra}</head><body>${body}</body></html>`;
}

export const FIXTURES = [
  // ── Contact ──
  {
    name: "contact: mailto + tel + wa.me",
    html: page(`
      <a href="mailto:hello@fixture.example">Email us</a>
      <a href="tel:+2348012345678">Call</a>
      <a href="https://wa.me/2348012345678">Chat on WhatsApp</a>`),
    expect: (c) =>
      c.email.status === "found" && c.email.value === "hello@fixture.example" &&
      c.phone.status === "found" &&
      c.whatsapp.status === "found" && c.whatsapp.confidence === "high" &&
      c.whatsapp.evidence.some((e) => e.match.includes("wa.me/2348012345678")),
  },
  {
    name: "contact: api.whatsapp.com/send deep link",
    html: page(`<a href="https://api.whatsapp.com/send?phone=2348012345678&text=Hi">WhatsApp</a>`),
    expect: (c) => c.whatsapp.status === "found" && c.whatsapp.evidence.some((e) => e.match.includes("api.whatsapp.com")),
  },
  {
    name: "contact: visible email without mailto",
    html: page(`<p>Reach us at sales@fixture.example any time.</p>`),
    expect: (c) => c.email.status === "found" && c.email.value === "sales@fixture.example",
  },
  {
    name: "contact: JSON-LD-only ContactPoint",
    html: page(`<p>No visible contact here.</p>`, `<script type="application/ld+json">{"@type":"LocalBusiness","telephone":"+234-801-234-5678","email":"ld@fixture.example","sameAs":["https://instagram.com/fixturebiz"]}</script>`),
    expect: (c) =>
      c.email.status === "found" && c.email.value === "ld@fixture.example" &&
      c.phone.status === "found" &&
      c.social.status === "found" && c.social.evidence.some((e) => e.source === "href" || e.match.includes("instagram.com")),
  },

  // ── Social ──
  {
    name: "social: footer profile links",
    html: page(`
      <footer>
        <a href="https://instagram.com/fixturebiz">Instagram</a>
        <a href="https://facebook.com/fixturebiz">Facebook</a>
        <a href="https://x.com/fixturebiz">X</a>
        <a href="https://linkedin.com/company/fixturebiz">LinkedIn</a>
      </footer>`),
    expect: (c) =>
      c.social.status === "found" &&
      ["Instagram", "Facebook", "Twitter/X", "LinkedIn"].every((p) => c.social.evidence.some((e) => e.provider === p)),
  },
  {
    name: "social: share/intent links must NOT count",
    html: page(`
      <a href="https://twitter.com/intent/tweet?text=hello">Share on X</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=https://fixture.example">Share on Facebook</a>`),
    expect: (c) => c.social.status === "not_found",
  },
  {
    name: "social: LinkedIn login page is not a company profile",
    html: page(`<a href="https://www.linkedin.com/login">Sign in with LinkedIn</a>`),
    expect: (c) => c.social.status === "not_found",
  },

  // ── Booking ──
  {
    name: "booking: Calendly href identifies provider",
    html: page(`<a href="https://calendly.com/fixturebiz/30min">Book a call</a>`),
    expect: (c) =>
      c.booking.status === "found" && c.booking.provider === "Calendly" && c.booking.confidence === "high",
  },
  {
    name: "booking: provider iframe",
    html: page(`<iframe src="https://calendly.com/fixturebiz/30min?embed=1"></iframe>`),
    expect: (c) => c.booking.status === "found" && c.booking.provider === "Calendly",
  },
  {
    name: "booking: generic Book-now CTA, provider unknown",
    html: page(`<a href="${BASE}/book">Book an appointment</a><form action="/api/book" method="post"><input name="name"><input name="phone"><button>Book now</button></form>`),
    expect: (c) => c.booking.status === "found" && c.booking.provider === null,
  },
  {
    name: "booking: blog mention of Calendly is NOT provider evidence",
    html: page(`<article><p>We wrote about how Calendly changed scheduling for teams everywhere.</p></article>`),
    expect: (c) => c.booking.status === "not_found" || (c.booking.status === "found" && c.booking.provider === null),
  },

  // ── Chat ──
  {
    name: "chat: Tawk.to script identifies provider",
    html: page(`<script src="https://embed.tawk.to/abc123/default.js"></script>`),
    expect: (c) => c.live_chat.status === "found" && c.live_chat.provider === "Tawk.to",
  },
  {
    name: "chat: provider iframe (Crisp)",
    html: page(`<iframe src="https://clients.crisp.chat/session.html"></iframe>`),
    expect: (c) => c.live_chat.status === "found" && c.live_chat.provider === "Crisp",
  },
  {
    name: "chat: runtime-network-only evidence (mocked deep result)",
    html: page(`<p>Welcome to our site.</p>`),
    networkHosts: ["widget.tawk.to"],
    expect: (c) => c.live_chat.status === "found" && c.live_chat.provider === "Tawk.to",
  },
  {
    name: "chat: the word chat alone is NOT a strong finding",
    html: page(`<p>Chat with our community on the forum. We chat every Friday.</p>`),
    expect: (c) => c.live_chat.status !== "found" || c.live_chat.confidence === "low",
  },

  // ── CRM / marketing ──
  {
    name: "crm: HubSpot script + form host evidence",
    html: page(`<script src="https://js.hs-scripts.com/123456.js"></script><form action="https://forms.hsforms.com/submissions/v3/publicsubmit"><input name="email"><button>Go</button></form>`),
    expect: (c) => c.crm.status === "found" && c.crm.provider === "HubSpot" && c.crm.confidence === "high",
  },
  {
    name: "crm: contact form alone is NOT a CRM",
    html: page(`<form action="/contact" method="post"><input name="name"><input name="email"><input name="message"><button>Send message</button></form>`),
    expect: (c) => c.crm.status === "not_found",
  },
  {
    name: "email_marketing: Mailchimp form action",
    html: page(`<form action="https://fixture.us1.list-manage.com/subscribe/post?u=abc" method="post"><input name="EMAIL" placeholder="you@example.com"><button>Subscribe</button></form>`),
    expect: (c) => c.email_marketing.status === "found" && c.email_marketing.provider === "Mailchimp",
  },
  {
    name: "email_marketing: newsletter signup form without provider",
    html: page(`<form action="/subscribe" method="post"><input name="email"><button>Join our newsletter</button></form>`),
    expect: (c) =>
      c.email_marketing.status === "found" &&
      (c.email_marketing.provider === null || c.email_marketing.confidence !== "high"),
  },
  {
    name: "email_marketing: Klaviyo script",
    html: page(`<script src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=X"></script>`),
    expect: (c) => c.email_marketing.status === "found" && c.email_marketing.provider === "Klaviyo",
  },

  // ── False-positive protection ──
  {
    name: "fp: WhatsApp marketing article without any WhatsApp link",
    html: page(`<article><p>Use WhatsApp to market your business better. Many businesses use WhatsApp Business tools.</p></article>`),
    expect: (c) => c.whatsapp.status !== "found" || c.whatsapp.confidence === "low",
  },
  {
    name: "fp: provider name inside ordinary article content",
    html: page(`<article><p>HubSpot and Salesforce are popular CRM platforms. Intercom makes a great live chat tool.</p></article>`),
    expect: (c) =>
      (c.crm.status !== "found" || c.crm.confidence !== "high") &&
      (c.live_chat.status !== "found" || c.live_chat.confidence !== "high"),
  },
  {
    name: "fp: ecommerce words shop/cart in blog copy do not create a provider",
    html: page(`<article><p>How to shop smarter: leave the cart full of ideas and check out our tips.</p></article>`),
    expect: (c) => c.ecommerce.provider === null,
  },

  // ── Verification states ──
  {
    name: "state: clean page with zero signals => not_found everywhere",
    html: page(`<p>A very plain page about our philosophy.</p>`),
    expect: (c) =>
      c.whatsapp.status === "not_found" && c.booking.status === "not_found" &&
      c.crm.status === "not_found" && c.live_chat.status === "not_found",
  },
];
