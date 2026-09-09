// Data-driven provider fingerprint registry for the ELION audit.
// Detection logic is table-driven: adding a provider means adding an entry
// here, not editing pipeline code. Each entry lists the technical evidence
// types that can identify the provider, with a per-source reliability weight
// used by the conservative confidence model in the pipeline.

export type ProviderCategory =
  | "live_chat"
  | "booking"
  | "crm"
  | "email_marketing"
  | "ecommerce";

export type SignalSource =
  | "href"          // direct actionable link (mailto/tel/wa.me/provider URL)
  | "script"        // <script src> hostname or inline marker
  | "iframe"        // <iframe src> hostname
  | "form"          // form action / hidden markers (e.g. Mailchimp list-manage)
  | "html"          // high-specificity HTML/DOM marker (ids, classes, attributes)
  | "structured"    // JSON-LD / ContactPoint / sameAs
  | "network"       // runtime network request hostname (deep path)
  | "text";         // weak visible-text evidence (never provider-identifying alone)

export type Reliability = "strong" | "moderate" | "weak";

export interface ProviderFingerprint {
  category: ProviderCategory;
  provider: string;
  description: string;
  /** Hostnames seen in scripts, iframes, or runtime requests. */
  networkHosts: string[];
  /** Hostnames seen in hrefs / form actions. */
  hrefHosts: string[];
  /** Substring markers for inline scripts or HTML (case-insensitive, high specificity). */
  htmlPatterns: string[];
  /** Patterns that must NOT count as evidence (e.g. blog mentions). */
  excludePatterns?: string[];
}

// Reliability of a matched source when identifying a SPECIFIC provider.
// Text alone never identifies a provider; it can only support category-level
// findings ("booking path exists, provider unknown").
export const SOURCE_RELIABILITY: Record<SignalSource, Reliability> = {
  href: "strong",
  script: "strong",
  iframe: "strong",
  form: "moderate",
  html: "moderate",
  structured: "strong",
  network: "strong",
  text: "weak",
};

const F = (
  category: ProviderCategory,
  provider: string,
  description: string,
  signals: Partial<Record<"networkHosts" | "hrefHosts" | "htmlPatterns", string[]>>,
  excludePatterns?: string[]
): ProviderFingerprint => ({
  category,
  provider,
  description,
  networkHosts: signals.networkHosts || [],
  hrefHosts: signals.hrefHosts || [],
  htmlPatterns: signals.htmlPatterns || [],
  excludePatterns,
});

export const PROVIDER_REGISTRY: ProviderFingerprint[] = [
  // ─── Live chat ───
  F("live_chat", "Intercom", "Intercom messenger",
    { networkHosts: ["intercom.io", "intercomcdn.com", "widget.intercom.io"], htmlPatterns: ["intercom-settings", "window.intercomSettings", "__intercom"] }),
  F("live_chat", "Drift", "Drift chat",
    { networkHosts: ["drift.com", "driftt.com"], htmlPatterns: ["window.drift", "driftt.widget", "drift.load"] }),
  F("live_chat", "Crisp", "Crisp chat",
    { networkHosts: ["crisp.chat"], htmlPatterns: ["window.$crisp", "crisp-client"] }),
  F("live_chat", "Tawk.to", "Tawk.to chat",
    { networkHosts: ["tawk.to"], htmlPatterns: ["window.tawkApi", "tawk_messengerid", "_tawk"] }),
  F("live_chat", "LiveChat", "LiveChat widget",
    { networkHosts: ["livechatinc.com", "livechat.com", "lc.chat"], htmlPatterns: ["window.__lc", "livechat_license"] }),
  F("live_chat", "Zendesk", "Zendesk / Zopim chat",
    { networkHosts: ["zendesk.com", "zopim.com", "ekr.zdassets.com"], htmlPatterns: ["window.zESettings", "zopim", "zdassets"] }),
  F("live_chat", "Tidio", "Tidio chat",
    { networkHosts: ["tidio.co"], htmlPatterns: ["window.tidioChatApi", "code.tidio.co"] }),
  F("live_chat", "HubSpot Chat", "HubSpot conversations widget",
    { networkHosts: ["hs-scripts.com", "use1.cloud.hubspot.com"], htmlPatterns: ["hubspot-messages", "hs-conversations"] }),
  F("live_chat", "Gorgias", "Gorgias chat",
    { networkHosts: ["gorgias.io", "gorgias.chat"] }),
  F("live_chat", "Chatra", "Chatra chat",
    { networkHosts: ["chatra.io"] }),
  F("live_chat", "Smartsupp", "Smartsupp chat",
    { networkHosts: ["smartsupp.com", "smartsuppchat.com"] }),

  // ─── Booking / scheduling ───
  F("booking", "Calendly", "Calendly scheduling",
    { networkHosts: ["calendly.com", "assets.calendly.com"], hrefHosts: ["calendly.com"], htmlPatterns: ["calendly-widget", "window.calendly"] }),
  F("booking", "Cal.com", "Cal.com scheduling",
    { networkHosts: ["cal.com", "app.cal.com"], hrefHosts: ["cal.com"], htmlPatterns: ["window.Cal", "cal-embed"] }),
  F("booking", "Acuity Scheduling", "Acuity scheduling",
    { networkHosts: ["acuityscheduling.com", "acuityhq.com"], hrefHosts: ["acuityscheduling.com"], htmlPatterns: ["acuity-embed", "acuityscheduling"] }),
  F("booking", "Square Appointments", "Square Appointments",
    { networkHosts: ["squareup.com/appointments", "square.site"], hrefHosts: ["squareup.com"], htmlPatterns: ["squareappointments", "squareup.com/appointments"] }),
  F("booking", "SimplyBook.me", "SimplyBook.me scheduling",
    { networkHosts: ["simplybook.me", "simplybook.it"], hrefHosts: ["simplybook.me"] }),
  F("booking", "Setmore", "Setmore scheduling",
    { networkHosts: ["setmore.com", "app.setmore.com"], hrefHosts: ["setmore.com"] }),
  F("booking", "Booksy", "Booksy scheduling",
    { networkHosts: ["booksy.com"], hrefHosts: ["booksy.com"] }),
  F("booking", "Vagaro", "Vagaro scheduling",
    { networkHosts: ["vagaro.com"], hrefHosts: ["vagaro.com"] }),
  F("booking", "Mindbody", "Mindbody scheduling",
    { networkHosts: ["mindbodyonline.com", "mindbody.io"], hrefHosts: ["mindbodyonline.com"] }),
  F("booking", "Fresha", "Fresha scheduling",
    { networkHosts: ["fresha.com", "fresha.io"], hrefHosts: ["fresha.com"] }),
  F("booking", "Squarespace Scheduling", "Squarespace scheduling (Acuity embedded)",
    { htmlPatterns: ["squarespace-scheduling", "sqs-block-scheduling"] }),
  F("booking", "CalendBook/Jotform Slots", "Jotform slots (generic provider evidence only when hosts match)",
    { networkHosts: ["jotform.com/app/schedule"] }),
  F("booking", "YouCanBook.me", "YouCanBook.me scheduling",
    { networkHosts: ["youcanbook.me", "youcanbook.com"], hrefHosts: ["youcanbook.me"] }),
  F("booking", "Zcal", "Zcal scheduling",
    { networkHosts: ["zcal.co"], hrefHosts: ["zcal.co"] }),
  F("booking", "Google Calendar Appointment Scheduling", "Google Calendar appointment page",
    { hrefHosts: ["calendar.google.com/calendar/u/0/appointments"], htmlPatterns: ["calendar.google.com/calendar/u/0/appointments"] }),

  // ─── CRM / lead capture ───
  F("crm", "HubSpot", "HubSpot CRM / marketing",
    { networkHosts: ["hs-scripts.com", "hsforms.com", "hubspot.com", "js.hs-scripts.com", "js.hsforms.net", "track.hubspot.com"], htmlPatterns: ["hbspt.forms", "hubspot-js", "_hsq.push"] }),
  F("crm", "Salesforce", "Salesforce / Pardot",
    { networkHosts: ["salesforce.com", "pardot.com", "cloudforce.com", "visualforce.com"], htmlPatterns: ["pardot-form", "salesforce"] }, ["salesforce.com/services", "blog"]),
  F("crm", "ActiveCampaign", "ActiveCampaign CRM/marketing",
    { networkHosts: ["activecampaign.com", "activehosted.com"], hrefHosts: ["activehosted.com"], htmlPatterns: ["act-activecampaign", "ac-form"] }),
  F("crm", "Pipedrive", "Pipedrive CRM",
    { networkHosts: ["pipedrive.com", "pipedriveassets.com"], htmlPatterns: ["pipedrive-form"] }),
  F("crm", "Zoho CRM", "Zoho CRM",
    { networkHosts: ["zoho.com", "zohopublic.com", "crm.zoho.com"], htmlPatterns: ["zoho-webforms", "zsforms"] }),
  F("crm", "HighLevel", "GoHighLevel CRM",
    { networkHosts: ["leadconnectorhq.com", "highlevelmarketing.com", "msgsndr.com"], htmlPatterns: ["leadconnector", "highlevel"] }),
  F("crm", "Marketo", "Marketo marketing automation",
    { networkHosts: ["marketo.com", "mktoweb.com", "marketo.net"], htmlPatterns: ["munchkin", "mktoForm"] }),
  F("crm", "Freshsales", "Freshsales CRM",
    { networkHosts: ["freshworks.com", "freshsales.io"], htmlPatterns: ["freshsales"] }),
  F("crm", "Insightly", "Insightly CRM",
    { networkHosts: ["insightly.com"] }),

  // ─── Email marketing / newsletter ───
  F("email_marketing", "Mailchimp", "Mailchimp lists/forms",
    { networkHosts: ["mailchimp.com", "list-manage.com", "chimpstatic.com"], hrefHosts: ["list-manage.com", "mailchimp.com"], htmlPatterns: ["mc_embed_signup", "mc4wp-form", "list-manage.com/subscribe"] }),
  F("email_marketing", "Klaviyo", "Klaviyo email marketing",
    { networkHosts: ["klaviyo.com", "klaviyoservices.com"], htmlPatterns: ["klaviyo-form", "window.klaviyo"] }),
  F("email_marketing", "Brevo / Sendinblue", "Brevo (formerly Sendinblue)",
    { networkHosts: ["brevo.com", "sendinblue.com", "sibforms.com"], htmlPatterns: ["sib-form", "sendinblue"] }),
  F("email_marketing", "SendGrid", "SendGrid marketing/forms",
    { networkHosts: ["sendgrid.com", "sendgrid.net"], htmlPatterns: ["sendgrid-subscribe"] }),
  F("email_marketing", "ConvertKit / Kit", "ConvertKit (Kit) forms",
    { networkHosts: ["convertkit.com", "convertkitcdn.com", "kit.com"], htmlPatterns: ["ck-form", "convertkit-form"] }),
  F("email_marketing", "MailerLite", "MailerLite forms",
    { networkHosts: ["mailerlite.com", "ml-embedded"], htmlPatterns: ["ml-form-embedded", "mailerlite"] }),
  F("email_marketing", "Constant Contact", "Constant Contact forms",
    { networkHosts: ["constantcontact.com", "ccsend.com", "r20.constantcontact.com"], htmlPatterns: ["ctct-form"] }),
  F("email_marketing", "GetResponse", "GetResponse forms",
    { networkHosts: ["getresponse.com"], htmlPatterns: ["gr-form", "getresponse"] }),

  // ─── E-commerce ───
  F("ecommerce", "Shopify", "Shopify storefront",
    { networkHosts: ["cdn.shopify.com", "shopify.com"], htmlPatterns: ["shopify-section", "window.Shopify"] }),
  F("ecommerce", "WooCommerce", "WooCommerce on WordPress",
    { htmlPatterns: ["woocommerce", "wc_add_to_cart"] }),
];

// Categories where visible text can establish that a conversion path exists
// (category-level finding, provider stays "unknown"). Text NEVER identifies
// a provider.
export const TEXT_CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  booking: [
    /\bbook\s+(now|online|an?\s+(call|demo|viewing|consultation|appointment|table|tour|visit))/i,
    /\bmake\s+an?\s+appointment\b/i,
    /\bschedule\s+(an?\s+)?(call|demo|viewing|consultation|appointment|visit)/i,
    /\brequest\s+(an?\s+)?(consultation|viewing|callback|quote)/i,
    /\breserve\s+(an?\s+)?(table|slot|seat|appointment)/i,
    /\bbook\s+online\b/i,
  ],
};

// Newsletter/signup form detection (form classification lives in extract.ts,
// this supports the email_marketing category-level "signup path exists" finding).
export const NEWSLETTER_TEXT = /\b(newsletter|subscribe|join\s+our\s+(mailing\s+list|email\s+list)|get\s+(our\s+)?updates)\b/i;
