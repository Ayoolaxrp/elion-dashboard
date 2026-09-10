/**
 * Migration Runner API
 * POST /api/admin/migrate
 * Executes SQL against Supabase via exec_sql RPC
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !(await isAdminEmail(user.email))) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sql } = await request.json();

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "SQL is required" }, { status: 400 });
    }

    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    const results: { statement: string; status: string; error?: string }[] = [];

    for (const stmt of statements) {
      try {
        // exec_sql is restricted to the service role by migration 027;
        // this route additionally requires a real admin session.
        const { error } = await supabase.rpc("exec_sql", { query: stmt });

        if (error) {
          // If exec_sql doesn't exist, try running through the REST API
          // by inserting a dummy record to check table existence
          results.push({
            statement: stmt.substring(0, 80) + "...",
            status: "error",
            error: error.message,
          });
        } else {
          results.push({
            statement: stmt.substring(0, 80) + "...",
            status: "ok",
          });
        }
      } catch (err) {
        results.push({
          statement: stmt.substring(0, 80) + "...",
          status: "error",
          error: String(err),
        });
      }
    }

    const hasErrors = results.some((r) => r.status === "error");

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors
        ? `${results.filter((r) => r.status === "error").length} statements failed`
        : `${results.length} statements executed successfully`,
      results,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
