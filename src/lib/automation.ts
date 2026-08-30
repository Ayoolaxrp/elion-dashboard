"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Server-side: fetch all clients with their automations
export async function getClients() {
  const { data: clients, error } = await supabase
    .from("clients")
    .select(`
      *,
      client_automations (
        id,
        status,
        custom_name,
        workflow_templates (name, slug, category)
      ),
      client_integrations (
        integration_type,
        provider,
        status
      )
    `)
    .order("created_at", { ascending: false });

  return { clients, error };
}

// Server-side: fetch single client
export async function getClient(clientId: string) {
  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      *,
      client_automations (
        id,
        status,
        custom_name,
        custom_config,
        last_run_at,
        total_runs,
        success_rate,
        deployed_at,
        workflow_templates (name, slug, category, description, value_proposition)
      ),
      client_integrations (
        integration_type,
        provider,
        status,
        last_verified_at
      ),
      client_metrics (
        metric_type,
        period_start,
        period_end,
        leads_captured,
        leads_qualified,
        leads_responded,
        avg_response_time_seconds,
        followups_sent,
        followups_responded,
        bookings_created,
        bookings_confirmed,
        conversion_rate
      )
    `)
    .eq("id", clientId)
    .single();

  return { client, error };
}

// Server-side: create client from lead
export async function createClientFromLead(leadId: string, planName: string, planPrice: number) {
  // Fetch the lead data
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) return { error: leadError || new Error("Lead not found") };

  // Create client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      lead_id: leadId,
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      company_name: lead.company_name,
      industry: lead.industry,
      website: lead.website,
      company_size: lead.company_size,
      plan_name: planName,
      plan_price: planPrice,
      onboarding_status: "pending"
    })
    .select()
    .single();

  if (clientError) return { error: clientError };

  // Update lead status
  await supabase
    .from("leads")
    .update({ lead_status: "paid" })
    .eq("id", leadId);

  // Create default integrations
  const integrationTypes = ["whatsapp", "email", "crm", "calendar", "booking"];
  const integrations = integrationTypes.map(type => ({
    client_id: client.id,
    integration_type: type,
    status: "not_configured"
  }));

  await supabase.from("client_integrations").insert(integrations);

  // Log activity
  await supabase.from("activity_log").insert({
    lead_id: leadId,
    event_type: "client_created",
    event_data: { client_id: client.id, plan: planName, price: planPrice },
    performed_by: "system"
  });

  return { client, error: null };
}

// Server-side: assign automation template to client
export async function assignAutomation(clientId: string, templateId: string, customName?: string, customConfig?: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("client_automations")
    .insert({
      client_id: clientId,
      template_id: templateId,
      custom_name: customName,
      custom_config: customConfig || {},
      status: "pending"
    })
    .select()
    .single();

  if (!error) {
    await supabase.from("activity_log").insert({
      event_type: "automation_assigned",
      event_data: { client_id: clientId, template_id: templateId },
      performed_by: "admin"
    });
  }

  return { data, error };
}

// Server-side: update automation status
export async function updateAutomationStatus(automationId: string, status: string) {
  const updates: Record<string, unknown> = { status };
  if (status === "live") updates.deployed_at = new Date().toISOString();
  if (status === "paused") updates.paused_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("client_automations")
    .update(updates)
    .eq("id", automationId)
    .select()
    .single();

  return { data, error };
}

// Server-side: get all workflow templates
export async function getTemplates() {
  const { data, error } = await supabase
    .from("workflow_templates")
    .select("*")
    .eq("is_active", true)
    .order("category");

  return { templates: data, error };
}
