/**
 * Admin Automation Management API
 *
 * GET /api/admin/automations - List all client automations
 * POST /api/admin/automations - Create a new automation for a client
 * PATCH /api/admin/automations - Update automation status (provision, activate, pause, etc.)
 *
 * Uses actual tables: workflow_templates, client_automations, client_integrations, provisioning_logs
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Activation gate: can this automation go LIVE?
 */
function canActivate(
  config: Record<string, unknown>,
  integrationStatus: Record<string, string>
): { eligible: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (!config.business_name) blockers.push("Missing business name");
  if (!config.response_template) blockers.push("Missing response template");
  if (!config.industry) blockers.push("Missing industry");
  if (integrationStatus.whatsapp !== "connected") blockers.push("WhatsApp not connected");

  return { eligible: blockers.length === 0, blockers };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("client_id");

    let query = supabase
      .from("client_automations")
      .select(`
        *,
        clients!inner(id, contact_name, company_name, email, status),
        workflow_templates!inner(name, category, description)
      `)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (clientId) query = query.eq("client_id", clientId);

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch automations:", error);
      return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
    }

    return NextResponse.json({ automations: data || [] });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_id, template_id, custom_config } = body;

    if (!client_id || !template_id) {
      return NextResponse.json({ error: "client_id and template_id are required" }, { status: 400 });
    }

    // Check template exists (using workflow_templates)
    const { data: template } = await supabase
      .from("workflow_templates")
      .select("*")
      .eq("id", template_id)
      .single();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Check client doesn't already have this template
    const { data: existing } = await supabase
      .from("client_automations")
      .select("id")
      .eq("client_id", client_id)
      .eq("template_id", template_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Client already has this automation" }, { status: 409 });
    }

    // Create the automation instance
    const { data: automation, error } = await supabase
      .from("client_automations")
      .insert({
        client_id,
        template_id,
        custom_config: custom_config || {},
        custom_name: template.name,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create automation:", error);
      return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
    }

    return NextResponse.json({ automation });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { automation_id, action, custom_config } = body;

    if (!automation_id || !action) {
      return NextResponse.json({ error: "automation_id and action are required" }, { status: 400 });
    }

    // Get current automation
    const { data: automation } = await supabase
      .from("client_automations")
      .select("*, clients!inner(id, contact_name, company_name), workflow_templates!inner(name)")
      .eq("id", automation_id)
      .single();

    if (!automation) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "configure": {
        if (!custom_config) {
          return NextResponse.json({ error: "custom_config required" }, { status: 400 });
        }
        updateData.custom_config = custom_config;
        updateData.status = "configuring";
        break;
      }

      case "provision": {
        if (automation.status !== "configuring" && automation.status !== "pending") {
          return NextResponse.json({ error: `Cannot provision from ${automation.status}` }, { status: 400 });
        }

        // Check integrations
        const { data: creds } = await supabase
          .from("client_integrations")
          .select("integration_type, status")
          .eq("client_id", automation.client_id);

        const integrationStatus: Record<string, string> = {};
        creds?.forEach((c) => { integrationStatus[c.integration_type] = c.status; });

        const activation = canActivate(
          automation.custom_config as Record<string, unknown>,
          integrationStatus
        );

        if (!activation.eligible) {
          return NextResponse.json({ error: "Cannot provision", blockers: activation.blockers }, { status: 400 });
        }

        updateData.status = "pending_activation";
        updateData.deployed_at = new Date().toISOString();

        // Log provisioning
        await supabase.from("provisioning_logs").insert({
          client_id: automation.client_id,
          automation_id: automation.id,
          template_id: automation.template_id,
          action: "provision",
          status: "running",
          steps: [{ step: "provision_started", time: new Date().toISOString() }],
        });
        break;
      }

      case "activate": {
        if (automation.status !== "pending_activation" && automation.status !== "testing") {
          return NextResponse.json({ error: `Cannot activate from ${automation.status}` }, { status: 400 });
        }

        updateData.status = "live";

        await supabase.from("provisioning_logs").insert({
          client_id: automation.client_id,
          automation_id: automation.id,
          template_id: automation.template_id,
          action: "activate",
          status: "passed",
          steps: [{ step: "activated", time: new Date().toISOString() }],
        });

        await supabase.from("notifications").insert({
          type: "onboarding_complete",
          client_id: automation.client_id,
          title: "Automation activated",
          message: `${(automation.workflow_templates as Record<string, unknown>)?.name || "Automation"} is now live for ${(automation.clients as Record<string, unknown>)?.company_name || "client"}.`,
          metadata: { automation_id: automation.id },
        });
        break;
      }

      case "pause": {
        if (automation.status !== "live") {
          return NextResponse.json({ error: "Can only pause live automations" }, { status: 400 });
        }
        updateData.status = "paused";
        updateData.paused_at = new Date().toISOString();
        break;
      }

      case "resume": {
        if (automation.status !== "paused") {
          return NextResponse.json({ error: "Can only resume paused automations" }, { status: 400 });
        }
        updateData.status = "live";
        updateData.paused_at = null;
        break;
      }

      case "test": {
        if (automation.status !== "pending_activation" && automation.status !== "configuring") {
          return NextResponse.json({ error: `Cannot test from ${automation.status}` }, { status: 400 });
        }
        updateData.status = "testing";

        await supabase.from("provisioning_logs").insert({
          client_id: automation.client_id,
          automation_id: automation.id,
          template_id: automation.template_id,
          action: "test",
          status: "running",
        });
        break;
      }

      case "retry": {
        if (!["failed"].includes(automation.status)) {
          return NextResponse.json({ error: "Can only retry failed automations" }, { status: 400 });
        }
        updateData.status = "pending";
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("client_automations")
      .update(updateData)
      .eq("id", automation_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update automation:", error);
      return NextResponse.json({ error: "Failed to update automation" }, { status: 500 });
    }

    return NextResponse.json({ automation: updated });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
