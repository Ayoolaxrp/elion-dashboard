/**
 * Client Portal Workspace API
 *
 * GET /api/client/portal
 *   Returns the signed-in client's workspace: project, tasks, next action,
 *   onboarding form state, documents, reports, access requests.
 *   Client identity is resolved from the auth session only - the client_id
 *   filter is never accepted from the browser. No cross-client access.
 */

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

  const { data: client } = await sb
    .from("clients")
    .select("id, contact_name, email, company_name, onboarding_status, plan_name")
    .or("auth_user_id.eq." + user.id + ",email.eq." + user.email)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Everything below is scoped to THIS client id only.
  const [projectRes, formRes, docsRes, reportsRes, accessRes] = await Promise.all([
    sb.from("portal_projects").select("*").eq("client_id", client.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    sb.from("portal_onboarding_form").select("*").eq("client_id", client.id).maybeSingle(),
    sb.from("client_documents").select("id, title, category, version, status, created_at").eq("client_id", client.id).order("created_at", { ascending: false }).limit(10),
    sb.from("portal_reports").select("id, title, period_start, period_end, metrics, narrative, data_source, last_updated_at, created_at").eq("client_id", client.id).order("created_at", { ascending: false }).limit(6),
    sb.from("portal_access_requests").select("id, service_name, access_kind, instructions, status, updated_at").eq("client_id", client.id).order("created_at"),
  ]);

  const project = projectRes.data || null;
  const tasks = project
    ? (await sb.from("portal_tasks").select("*").eq("project_id", project.id).order("sort_order")).data || []
    : [];

  // Derived: onboarding progress
  const form = formRes.data || null;
  const savedSteps = form ? [1, 2, 3, 4].filter((n) => form[`step${n}_saved_at`]).length : 0;

  // Derived: next action (honest, rule-based)
  let nextAction: { title: string; detail: string } | null = null;
  if (!form || savedSteps === 0) {
    nextAction = { title: "Complete your onboarding", detail: "Tell us about your business so we can prepare your systems." };
  } else if (savedSteps < 4) {
    nextAction = { title: `Continue onboarding (step ${form!.current_step} of 4)`, detail: "Your progress is saved. Pick up where you left off." };
  } else {
    const needsInput = tasks.find((t) => t.status === "needs_input");
    if (needsInput) {
      nextAction = { title: `Review: ${needsInput.title}`, detail: "This task needs your input before we can continue." };
    } else {
      nextAction = { title: "You are all set for now", detail: "We are building. Watch this space for progress and deliverables." };
    }
  }

  return NextResponse.json({
    client: { company_name: client.company_name, contact_name: client.contact_name, plan_name: client.plan_name, onboarding_status: client.onboarding_status },
    project,
    tasks,
    nextAction,
    onboardingForm: form
      ? { current_step: form.current_step, saved_steps: savedSteps, completed_at: form.completed_at }
      : null,
    documents: docsRes.data || [],
    reports: reportsRes.data || [],
    accessRequests: accessRes.data || [],
  });
}
