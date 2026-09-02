import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

// GET - list all documents with client info
export async function GET() {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all clients with their documents
  const { data: clients, error: clientErr } = await sb
    .from("clients")
    .select("id, contact_name, email, company_name, onboarding_status")
    .order("created_at", { ascending: false });

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });

  // Get all documents
  const { data: documents, error: docErr } = await sb
    .from("client_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });

  // Group documents by client
  const pipelines = (clients || []).map(client => {
    const clientDocs = (documents || []).filter(d => d.client_id === client.id);
    const docTypes = ["proposal", "contract", "invoice", "welcome", "portal", "thankyou"];
    const fullDocs = docTypes.map(type => {
      const doc = clientDocs.find(d => d.doc_type === type);
      return {
        type,
        status: doc?.status || "not_started",
        sent_at: doc?.sent_at || null,
        viewed_at: doc?.viewed_at || null,
        completed_at: doc?.completed_at || null,
        content: doc?.content || null,
      };
    });
    const completedCount = fullDocs.filter(d => ["accepted", "signed", "paid", "completed"].includes(d.status)).length;
    const currentStage = docTypes.find(t => {
      const doc = fullDocs.find(d => d.type === t);
      return doc && !["accepted", "signed", "paid", "completed"].includes(doc.status);
    }) || "thankyou";

    return {
      id: client.id,
      company: client.company_name,
      contact: client.contact_name,
      email: client.email,
      onboarding_status: client.onboarding_status,
      current_stage: currentStage,
      documents: fullDocs,
      completed_count: completedCount,
    };
  });

  return NextResponse.json({ pipelines });
}

// POST - generate and send a document
export async function POST(request: Request) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { client_id, doc_type } = body;

  if (!client_id || !doc_type) {
    return NextResponse.json({ error: "client_id and doc_type required" }, { status: 400 });
  }

  // Get client data
  const { data: client, error: clientErr } = await sb
    .from("clients")
    .select("*")
    .eq("id", client_id)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Get client automations for document content
  const { data: automations } = await sb
    .from("client_automations")
    .select("custom_name, status, workflow_templates(name, category)")
    .eq("client_id", client_id);

  const automationNames = (automations || []).map((a: any) => a.custom_name || (Array.isArray(a.workflow_templates) ? a.workflow_templates[0]?.name : a.workflow_templates?.name) || "Automation");

  // Get entitlements for pricing
  const { data: entitlements } = await sb
    .from("client_entitlements")
    .select("feature_id, features(key, name)")
    .eq("client_id", client_id);

  // Generate document content based on type
  let content: Record<string, unknown> = {};
  const now = new Date().toISOString();

  switch (doc_type) {
    case "proposal":
      content = {
        title: "Automation Implementation Proposal",
        prepared_for: client.company_name,
        contact: client.contact_name,
        date: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
        automations: automationNames,
        total: client.plan_price || 0,
        timeline: "2-4 weeks from kickoff",
      };
      break;
    case "contract":
      content = {
        title: "Service Agreement",
        between: 'ELION ("Provider")',
        and: `${client.contact_name} / ${client.company_name} ("Client")`,
        date: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
        total: client.plan_price || 0,
      };
      break;
    case "invoice":
      content = {
        invoice_number: `ELION-${new Date().getFullYear()}-${client_id.slice(-3).toUpperCase()}`,
        date: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
        bill_to: client.company_name,
        contact: client.contact_name,
        total: client.plan_price || 0,
        due_date: new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
      };
      break;
    case "welcome":
      content = {
        greeting: `Hi ${client.contact_name},`,
        body: `Welcome to ELION. We are officially getting started.\n\nYour automation project is now moving into the implementation phase, and we look forward to building something that genuinely improves how ${client.company_name} operates.\n\nOur process is simple:\n\nDiscover > Configure > Build > Test > Launch`,
        your_automations: automationNames,
      };
      break;
    case "portal":
      content = { note: "Client portal is the dashboard" };
      break;
    case "thankyou":
      content = {
        greeting: `Hi ${client.contact_name},`,
        body: `Your ELION automation has been completed and is ready for use.`,
        delivered: automationNames.map((name: string) => ({ name, status: "Live" })),
      };
      break;
  }

  // Upsert document
  const { data: doc, error: docErr } = await sb
    .from("client_documents")
    .upsert({
      client_id,
      doc_type,
      status: "sent",
      content,
      sent_at: now,
      email_sent: true,
      email_sent_at: now,
      updated_at: now,
    }, { onConflict: "client_id,doc_type" })
    .select()
    .single();

  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 500 });

  // Update pipeline current_stage if this is the next expected doc
  const stageOrder = ["proposal", "contract", "invoice", "welcome", "portal", "thankyou"];
  const currentDocIdx = stageOrder.indexOf(doc_type);
  if (currentDocIdx >= 0) {
    await sb
      .from("onboarding_pipeline")
      .update({ current_stage: doc_type, updated_at: now })
      .eq("client_id", client_id);
  }

  return NextResponse.json({ success: true, document: doc });
}
