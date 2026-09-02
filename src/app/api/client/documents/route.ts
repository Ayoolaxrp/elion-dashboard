import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find client record
  const { data: client } = await sb
    .from("clients")
    .select("id, contact_name, email, company_name")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Get all documents for this client
  const { data: documents, error } = await sb
    .from("client_documents")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ensure all 6 doc types exist (create not_started placeholders if missing)
  const docTypes = ["proposal", "contract", "invoice", "welcome", "portal", "thankyou"];
  const fullDocuments = docTypes.map(type => {
    const doc = documents?.find(d => d.doc_type === type);
    return {
      type,
      status: doc?.status || "not_started",
      sent_at: doc?.sent_at || null,
      viewed_at: doc?.viewed_at || null,
      completed_at: doc?.completed_at || null,
      content: doc?.content || null,
    };
  });

  return NextResponse.json({
    client: {
      id: client.id,
      name: client.contact_name,
      company: client.company_name,
    },
    documents: fullDocuments,
  });
}

// PATCH - mark a document as viewed
export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { doc_type } = body;
  if (!doc_type) return NextResponse.json({ error: "doc_type required" }, { status: 400 });

  // Find client record
  const { data: client } = await sb
    .from("clients")
    .select("id")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Mark as viewed
  const { error } = await sb
    .from("client_documents")
    .update({
      status: "viewed",
      viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("client_id", client.id)
    .eq("doc_type", doc_type)
    .in("status", ["sent", "draft"]); // Only update if not already viewed

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create admin notification
  const docLabels: Record<string, string> = {
    proposal: "Proposal", contract: "Contract", invoice: "Invoice",
    welcome: "Welcome Doc", portal: "Client Portal", thankyou: "Thank You",
  };
  await sb.from("notifications").insert({
    type: "document_viewed",
    client_id: client.id,
    document_type: doc_type,
    title: `${docLabels[doc_type] || doc_type} viewed`,
    message: `Client viewed their ${docLabels[doc_type] || doc_type} document.`,
  });

  return NextResponse.json({ success: true });
}
