/**
 * Migration Runner API
 * POST /api/admin/migrate
 * Executes SQL against Supabase via exec_sql RPC
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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
        // Use exec_sql RPC if it exists, otherwise try direct query
        const { data, error } = await supabase.rpc("exec_sql", { query: stmt });

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
