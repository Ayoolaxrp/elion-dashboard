// Support assistant: grounded knowledge + provider call.
// Server-side only. The knowledge below mirrors the canonical sources the
// site uses (src/lib/pricing.ts), so the assistant cannot drift from real
// site copy or invent pricing.

export interface SupportChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Keep in sync with src/lib/pricing.ts (the single source of truth for prices).
const KNOWLEDGE = `
ELION builds operational automation systems for businesses. Positioning: "We find where your business is leaking revenue, then automate it." The free audit is the wedge: run an audit first, then ELION recommends the system that fixes the leaks it finds.

PRICING (one-time implementation fees, you own everything built; no hidden renewal):
- Starter: NGN 100,000. One automation workflow. For businesses fixing their first operational leak. Includes: 1 automation workflow, lead capture & response, WhatsApp or email, basic dashboard, deployment & testing, documentation, 14 days post-launch support.
- Growth (most popular): NGN 350,000. Complete lead-to-booking system. Everything in Starter plus: lead qualification, WhatsApp + email, automated follow-up, booking workflow, CRM integration, calendar integration, client dashboard, workflow monitoring, 30 days post-launch support.
- Scale: NGN 750,000. Multiple interconnected automation systems. Everything in Growth plus: multiple automation systems, custom workflows, advanced API integrations, CRM + WhatsApp + email + calendar, revenue recovery, operations automation, advanced monitoring, custom configuration, training, documentation & handover, 60 days post-launch support, priority support.

OPTIONAL ONGOING SUPPORT (separate from implementation, never automatic):
- NGN 50,000/month: monitoring, bug fixes, reports, minor workflow adjustments.
- NGN 150,000/month: advanced iterations, strategy calls, A/B testing, WhatsApp support, priority handling.
Every implementation includes: Discover, Configure, Build, Test, Deploy, Handover.

THE FREE AUDIT:
- Analyzes the public digital presence of a business: website quality, contact and lead-capture paths, public social links, and how social traffic flows toward contact/booking.
- Produces a Digital Operations score with category scores, findings with severity levels (critical, high, medium, opportunity), and recommended systems.
- Evidence labels are honest: Verified (directly observed), Detected (inferred), Unavailable (not enough public info). It does not guess or fabricate.
- Results in minutes. Free. No credit card.

PAYMENT:
- Manual payment is currently available; online card processing is being finalized.
- Payment is via bank transfer to Opay account 9126281855. The account name is confirmed during the order conversation; the assistant never states it from memory.
- After payment, the customer submits their payment reference/confirmation and onboarding begins. The assistant cannot accept or verify payments.

AUTOMATION SYSTEMS ELION BUILDS:
1. Lead Response: every enquiry gets an immediate, on-brand response.
2. Follow-Up: consistent follow-up happens automatically, on schedule.
3. Booking: conversations convert into confirmed bookings without back-and-forth (Google Calendar + Google Meet integration).
4. Revenue Recovery: dormant leads and abandoned enquiries are systematically re-engaged.
5. Operations: internal repetitive workflows run themselves.
6. Custom Systems: designed around a specific process on the same ELION architecture.

PLANS MAP TO SYSTEMS: Starter includes Lead Response. Growth adds Follow-Up and Booking. Scale adds Revenue Recovery, Operations and custom systems.

BUSINESS HOURS AND CONTACT:
- Monday to Friday, 9am to 6pm (West Africa Time).
- The support page has WhatsApp, email and phone contact cards and a support request form (reply within 24 hours).
- The assistant cannot transfer the visitor to a human in real time; for anything unresolved it should direct them to the support form (which ELION answers within 24 hours) or WhatsApp during business hours.

WHAT ELION IS NOT:
- No fake testimonials or client claims. ELION has not published client case studies yet.
- The assistant never invents statistics, client names, ROI promises or delivery dates.
`.trim();

export const ASSISTANT_SYSTEM_PROMPT = [
  "You are the ELION support assistant on elion.com.ng. You help visitors understand ELION's audit, systems, pricing and process.",
  "",
  "Rules:",
  "1. Ground EVERY factual claim in the knowledge below. If something is not in the knowledge, say you do not know and suggest the support form.",
  "2. Never invent prices, timelines, statistics, client names, testimonials or guarantees. The only prices that exist are the ones listed.",
  "3. Never ask for or accept passwords, payment details, card numbers or bank credentials in chat. Point payments to the official process described in the knowledge.",
  "4. Be concise: 2-5 short sentences for most answers. Match the visitor's tone and language. Use plain words, no jargon.",
  "5. When a question needs a human (custom scope, account issues, complaints, anything unresolved), say so honestly and direct them to the support form (replies within 24 hours) or WhatsApp during business hours (Mon-Fri, 9am-6pm West Africa Time).",
  "6. You are an assistant, not a closer. Do not pressure anyone. One clear next step per message (run the audit, view pricing, or use the form).",
  "7. If asked something clearly outside ELION (coding help, homework, other companies), politely decline and refocus on ELION.",
  "",
  "Knowledge:",
  KNOWLEDGE,
].join("\n");

// Provider: OpenRouter by default, but any OpenAI-compatible chat endpoint
// works by setting the env vars. Falls back gracefully when unset.
export function getProviderConfig(): { url: string; key: string; model: string } | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  return {
    url: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    key,
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  };
}

const MAX_HISTORY = 8; // last 4 exchanges
const MAX_MESSAGE_CHARS = 1000;

export function sanitizeHistory(history: unknown): SupportChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m): m is SupportChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

export function sanitizeQuestion(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const q = raw.trim().slice(0, MAX_MESSAGE_CHARS);
  return q.length > 0 ? q : null;
}

// Calls the provider. Returns null on any failure so the route can fall back
// honestly instead of surfacing a raw error to the visitor.
export async function callAssistant(
  history: SupportChatMessage[],
  question: string
): Promise<string | null> {
  const cfg = getProviderConfig();
  if (!cfg) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${cfg.url}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.key}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: 300,
        temperature: 0.3,
        messages: [
          { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
          ...history,
          { role: "user", content: question },
        ],
      }),
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim().length > 0
      ? content.trim().slice(0, 1200)
      : null;
  } catch {
    return null;
  }
}
