/**
 * Admin Deploy API
 *
 * POST /api/admin/deploy
 * Creates real `client_automations` rows for a client from the guided
 * Deploy Systems flow. Each product resolves to a `workflow_templates`
 * row (created on first use for catalog products with no seeded
 * template), then a `client_automations` instance is inserted with the
 * admin-entered configuration.
 *
 * Gates (never bypassed):
 *   - admin only
 *   - client must exist
 *   - status is always "pending" — a row here is NOT "live"
 *   - idempotent: repeated calls never create a duplicate automation
 *     for the same client + template
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  const cookieStore = { get: (name: string) => ({ value: "" as string }), getAll: () => [] as { name: string; value: string }[] };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
}

async function checkAdmin(supabase: ReturnType<typeof getSupabase>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes((user.email || "").toLowerCase())) return null;
  return user;
}

interface DeployProduct {
  template_slug: string;
  custom_name?: string;
  config?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { client_id, products } = body as { client_id?: string; products?: DeployProduct[] };

  if (!client_id) return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: "products array is required" }, { status: 400 });
  }

  // Client must exist
  const { data: client } = await supabase.from("clients").select("id, company_name").eq("id", client_id).single();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const created: { template_slug: string; automation_id: string | null; status: string; existing?: boolean }[] = [];

  for (const product of products) {
    const slug = product.template_slug;
    if (!slug) continue;

    // Resolve template by slug (workflow_templates), creating the catalog
    // row on first use for agent products that have no seeded template.
    let { data: template } = await supabase.from("workflow_templates").select("id, name, slug, category").eq("slug", slug).maybeSingle();

    if (!template) {
      const { data: inserted } = await supabase
        .from("workflow_templates")
        .insert({
          name: product.custom_name || slug,
          slug,
          category: "custom",
          description: `Deployed via ELION Deploy Systems (${slug}).`,
          is_active: true,
          is_published: true,
        })
        .select("id, name, slug, category")
        .single();
      template = inserted || null;
    }

    if (!template) {
      created.push({ template_slug: slug, automation_id: null, status: "error" });
      continue;
    }

    // Idempotency: never create a duplicate for the same client + template
    const { data: existing } = await supabase
      .from("client_automations")
      .select("id, status")
      .eq("client_id", client_id)
      .eq("template_id", template.id)
      .maybeSingle();

    if (existing) {
      created.push({ template_slug: slug, automation_id: existing.id, status: existing.status, existing: true });
      continue;
    }

    const { data: automation, error } = await supabase
      .from("client_automations")
      .insert({
        client_id,
        template_id: template.id,
        custom_name: product.custom_name || template.name,
        custom_config: product.config || {},
        status: "pending", // NEVER "live" — provisioning gates apply later
      })
      .select("id, status")
      .single();

    if (error) {
      created.push({ template_slug: slug, automation_id: null, status: "error" });
      continue;
    }

    created.push({ template_slug: slug, automation_id: automation.id, status: automation.status });
  }

  return NextResponse.json({ client_id, automations: created });
}