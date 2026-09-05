import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  callAssistant,
  getProviderConfig,
  sanitizeHistory,
  sanitizeQuestion,
} from "@/lib/support-assistant";

export const runtime = "nodejs";

// Honest fallback: never pretend the assistant answered. Points to the form,
// which genuinely replies within 24 hours.
const FALLBACK_REPLY =
  "I could not load an answer right now. Please use the support form on this page and the team will reply within 24 hours, or reach us on WhatsApp during business hours (Monday to Friday, 9am to 6pm West Africa Time).";

export async function POST(request: NextRequest) {
  try {
    // CSRF: same-origin only, mirroring /api/request.
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Rate limit: 10 questions per minute per IP.
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`support-chat:${ip}`, { windowMs: 60000, maxRequests: 10 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again in a moment." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const question = sanitizeQuestion(body?.message);
    if (!question) {
      return NextResponse.json(
        { success: false, error: "Please type a question." },
        { status: 400 }
      );
    }
    const history = sanitizeHistory(body?.history);

    // No key configured: respond with the honest fallback (not an error),
    // so the widget degrades gracefully until the key is set.
    if (!getProviderConfig()) {
      return NextResponse.json({ success: true, reply: FALLBACK_REPLY, fallback: true });
    }

    const reply = await callAssistant(history, question);
    if (!reply) {
      logChat(question, null, "error");
      return NextResponse.json({ success: true, reply: FALLBACK_REPLY, fallback: true });
    }

    logChat(question, reply, "answered");
    return NextResponse.json({ success: true, reply, fallback: false });
  } catch {
    return NextResponse.json({ success: true, reply: FALLBACK_REPLY, fallback: true });
  }
}

// Best-effort logging. A failed log insert must never break the chat reply.
function logChat(question: string, answer: string | null, outcome: "answered" | "error") {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  admin
    .from("support_chat_logs")
    .insert({
      question: question.slice(0, 1000),
      answer_summary: answer ? answer.slice(0, 500) : null,
      outcome,
      escalated_to_form: false,
    })
    .then(({ error }) => {
      if (error) console.error("support_chat_logs insert failed:", error.message);
    });
}
