import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/server";
import { validateContentOutput } from "@/lib/ai/structured-output";

const getAdmin = async () => {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !(await isAdminEmail(user.email))) return null;
  return user;
};

const getDataClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await getDataClient()
    .from("content_items")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Content Studio migration is not applied", detail: error.message }, { status: 503 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const validation = validateContentOutput(body);
  if (!validation.valid) return NextResponse.json({ error: "Invalid structured content", details: validation.errors }, { status: 400 });

  const { data, error } = await getDataClient()
    .from("content_items")
    .insert({ ...body, status: body.status === "approved" || body.status === "published" ? "review" : body.status })
    .select()
    .single();
  if (error) return NextResponse.json({ error: "Content Studio migration is not applied", detail: error.message }, { status: 503 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: string; rejection_reason?: string } | null;
  if (!body?.id || !["idea", "draft", "review", "approved", "scheduled", "published", "rejected"].includes(body.status || "")) {
    return NextResponse.json({ error: "id and valid status are required" }, { status: 400 });
  }
  if (["approved", "scheduled", "published"].includes(body.status || "") && body.status !== "approved") {
    return NextResponse.json({ error: "Content must be approved before scheduling or publishing" }, { status: 409 });
  }
  const update: Record<string, unknown> = { status: body.status, updated_at: new Date().toISOString() };
  if (body.status === "approved") { update.approved_by = admin.email; update.approved_at = new Date().toISOString(); }
  if (body.status === "rejected") update.rejection_reason = body.rejection_reason || "Rejected by admin";
  const { data, error } = await getDataClient().from("content_items").update(update).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
