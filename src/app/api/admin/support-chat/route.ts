/**
 * Admin Support Chat Log API
 *
 * GET /api/admin/support-chat?outcome=all|answered|error&limit=n
 * Returns logged visitor questions from support_chat_logs (migration 023).
 * Admin-only: same requireAdmin gate as /api/admin/automations.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Auth check: read the browser's real session cookies so getUser() sees the login.
async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((user.email || "").toLowerCase())) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const outcome = searchParams.get("outcome") || "all";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 200, 1), 500);

  let query = supabase
    .from("support_chat_logs")
    .select("id, question, answer_summary, outcome, escalated_to_form, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (outcome === "answered" || outcome === "error") {
    query = query.eq("outcome", outcome);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const last24h = rows.filter(
    (r) => Date.now() - Date.parse(r.created_at) < 24 * 60 * 60 * 1000
  ).length;

  return NextResponse.json({
    logs: rows,
    total: rows.length,
    last24h,
  });
}
