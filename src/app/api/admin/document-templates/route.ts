import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const DOC_TYPES = ["proposal", "contract", "invoice", "welcome", "portal", "thankyou"] as const;

async function getAdmin() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes((user.email || "").toLowerCase())) return null;
  return sb;
}

// GET - list all document templates
export async function GET() {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("document_templates")
    .select("*")
    .order("doc_type");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

// PUT - upsert a document template (save customization)
export async function PUT(req: Request) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.doc_type !== "string" || !(DOC_TYPES as readonly string[]).includes(body.doc_type)) {
    return NextResponse.json({ error: "Valid doc_type is required" }, { status: 400 });
  }
  if (!body.content || typeof body.content !== "object") {
    return NextResponse.json({ error: "content object is required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("document_templates")
    .upsert(
      {
        doc_type: body.doc_type,
        content: body.content,
        version: body.version || "1.0.0",
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "doc_type" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}