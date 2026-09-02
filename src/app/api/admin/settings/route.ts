import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const email = Buffer.from(authHeader, "base64").toString();
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());
  return adminEmails.includes(email);
}

const DEFAULT_CONFIG = {
  company_name: "ELION",
  support_email: "awodeyiayoola@gmail.com",
  support_phone: "09126281855",
  whatsapp_number: "",
  n8n_webhook_url: process.env.N8N_WEBHOOK_URL || "",
  resend_api_key: "",
  default_timezone: "Africa/Lagos",
};

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("system_config").select("config").eq("id", "main").single();
  return NextResponse.json({ config: data?.config || DEFAULT_CONFIG });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { error } = await supabase
    .from("system_config")
    .upsert({ id: "main", config: body, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}