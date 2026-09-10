// Deep Audit API — Phase 2 of the commercial engine.
//
// Separation of truth types (enforced everywhere):
//   observed : public evidence from the audit pipeline (NOT accepted here)
//   reported : what the business says about itself (their claim)
//   modeled  : arithmetic derived FROM reported inputs, with assumptions
//
// This endpoint accepts only REPORTED answers and stores MODELED
// derivations it can compute deterministically. It never upgrades a
// reported answer into an observed fact, and never fabricates numbers
// the business did not provide.
//
// Admin-only (service role + admin email gate, same as other admin APIs).

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const getDataClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((user.email || "").toLowerCase())) return null;
  return user;
}

// ── Reported-answer schema (progressive; each field materially changes diagnosis) ──

interface ReportedInput {
  // Offer & economics
  primary_offer?: string;
  avg_transaction_ngn?: number | null;      // single value or midpoint entered by salesperson
  // Volume
  monthly_enquiries?: number | null;
  monthly_customers?: number | null;
  // Channels
  acquisition_channels?: string[];
  sales_channel?: string;
  // Process
  avg_response_time?: string;
  lead_owner?: string;
  followup_process?: string;
  unconverted_leads_monthly?: number | null;
  // Past customers
  has_repeat_customers?: boolean | null;
  // Priorities (free text, short)
  biggest_growth_problem?: string;
  biggest_operational_headache?: string;
  desired_outcome?: string;
}

const NUMERIC_BOUNDS: Record<string, [number, number]> = {
  avg_transaction_ngn: [0, 1_000_000_000],
  monthly_enquiries: [0, 1_000_000],
  monthly_customers: [0, 1_000_000],
  unconverted_leads_monthly: [0, 1_000_000],
};

function clampNumber(v: unknown, key: string): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const [min, max] = NUMERIC_BOUNDS[key] || [0, Number.MAX_SAFE_INTEGER];
  return Math.min(max, Math.max(min, Math.round(n)));
}

function sanitizeReported(raw: unknown): ReportedInput {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const out: ReportedInput = {};
  if (typeof r.primary_offer === "string") out.primary_offer = r.primary_offer.slice(0, 300);
  out.avg_transaction_ngn = clampNumber(r.avg_transaction_ngn, "avg_transaction_ngn");
  out.monthly_enquiries = clampNumber(r.monthly_enquiries, "monthly_enquiries");
  out.monthly_customers = clampNumber(r.monthly_customers, "monthly_customers");
  if (Array.isArray(r.acquisition_channels)) {
    out.acquisition_channels = r.acquisition_channels.filter((c): c is string => typeof c === "string").map((c) => c.slice(0, 80)).slice(0, 10);
  }
  if (typeof r.sales_channel === "string") out.sales_channel = r.sales_channel.slice(0, 120);
  if (typeof r.avg_response_time === "string") out.avg_response_time = r.avg_response_time.slice(0, 80);
  if (typeof r.lead_owner === "string") out.lead_owner = r.lead_owner.slice(0, 120);
  if (typeof r.followup_process === "string") out.followup_process = r.followup_process.slice(0, 500);
  out.unconverted_leads_monthly = clampNumber(r.unconverted_leads_monthly, "unconverted_leads_monthly");
  if (typeof r.has_repeat_customers === "boolean") out.has_repeat_customers = r.has_repeat_customers;
  if (typeof r.biggest_growth_problem === "string") out.biggest_growth_problem = r.biggest_growth_problem.slice(0, 500);
  if (typeof r.biggest_operational_headache === "string") out.biggest_operational_headache = r.biggest_operational_headache.slice(0, 500);
  if (typeof r.desired_outcome === "string") out.desired_outcome = r.desired_outcome.slice(0, 500);
  return out;
}

// ── Deterministic modeled derivations (no LLM, no invention) ──

interface ModeledItem {
  key: string;
  value: number | string | null;
  assumptions: string[];
  label: string;
}

function deriveModeled(rep: ReportedInput): ModeledItem[] {
  const modeled: ModeledItem[] = [];
  const { avg_transaction_ngn, monthly_enquiries, monthly_customers, unconverted_leads_monthly } = rep;

  // Reported enquiry -> customer conversion, ONLY when both inputs exist.
  if (monthly_enquiries !== null && monthly_enquiries !== undefined && monthly_enquiries > 0 &&
      monthly_customers !== null && monthly_customers !== undefined) {
    const conv = monthly_customers / monthly_enquiries;
    modeled.push({
      key: "reported_conversion_rate",
      label: "Enquiry-to-customer conversion (from reported figures)",
      value: `${(conv * 100).toFixed(1)}%`,
      assumptions: [
        "Uses ONLY the enquiry and customer counts reported by the business.",
        "Assumes both counts refer to the same monthly period.",
      ],
    });
  }

  // Unconverted-enquiry value at risk, framed as reported-input arithmetic.
  if (unconverted_leads_monthly !== null && unconverted_leads_monthly !== undefined &&
      unconverted_leads_monthly > 0 && avg_transaction_ngn !== null && avg_transaction_ngn !== undefined) {
    modeled.push({
      key: "unconverted_value_range",
      label: "Value of monthly unconverted enquiries IF a share were recovered (range, not a forecast)",
      value: `NGN ${(unconverted_leads_monthly * avg_transaction_ngn * 0.05).toLocaleString()} - NGN ${(unconverted_leads_monthly * avg_transaction_ngn * 0.2).toLocaleString()} / month at 5-20% recovery`,
      assumptions: [
        "Multiplies the business's OWN reported unconverted-enquiry count and average transaction value.",
        "5-20% recovery is a SCENARIO RANGE, not a measured or promised outcome.",
        "Actual recovery depends on offer, follow-up quality, and market conditions.",
      ],
    });
  }

  // Response-time vs enquiry-channel risk: qualitative only.
  if (rep.avg_response_time && rep.acquisition_channels && rep.acquisition_channels.length > 0) {
    const slow = /day|week|days|weeks|hour/i.test(rep.avg_response_time) && !/minute/i.test(rep.avg_response_time);
    modeled.push({
      key: "response_time_context",
      label: "Reported response time on reported channels",
      value: rep.avg_response_time + (slow ? " (slower than typical same-session enquiry expectations on chat-led channels)" : ""),
      assumptions: [
        "Business-reported response time; not independently measured by ELION.",
      ],
    });
  }

  return modeled;
}

// ── Handlers ──

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    leadId?: string;
    auditId?: string;
    website?: string;
    industry?: string;
    reported?: unknown;
  } | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const reported = sanitizeReported(body.reported);
  const modeled = deriveModeled(reported);

  const sb = getDataClient();

  // Queryable projections of reported (migration 033). Categories are
  // conservative and deterministic; the JSONB snapshots stay the truth.
  const responseCategory =
    typeof reported.avg_response_time === "string" && reported.avg_response_time.trim()
      ? reported.avg_response_time.trim().toLowerCase()
      : null;
  const followupCategory =
    typeof reported.followup_process === "string" && reported.followup_process.trim()
      ? reported.followup_process.trim().toLowerCase()
      : null;
  const repeatSignal =
    reported.has_repeat_customers === true
      ? "repeat_customers"
      : reported.has_repeat_customers === false
        ? "no_repeat_customers"
        : null;

  const row = {
    lead_id: body.leadId || null,
    audit_id: body.auditId || null,
    website: (body.website || "").slice(0, 300) || null,
    industry: (body.industry || "").slice(0, 80) || null,
    status: "completed" as const,
    reported,
    modeled,
    monthly_enquiries: reported.monthly_enquiries ?? null,
    monthly_customers: reported.monthly_customers ?? null,
    avg_transaction_ngn: reported.avg_transaction_ngn ?? null,
    unconverted_leads_monthly: reported.unconverted_leads_monthly ?? null,
    response_time_category: responseCategory,
    acquisition_channels: reported.acquisition_channels || [],
    sales_channel: reported.sales_channel ?? null,
    lead_owner: reported.lead_owner ?? null,
    followup_category: followupCategory,
    repeat_purchase_signal: repeatSignal,
    desired_outcome: reported.desired_outcome ?? null,
  };
  const { data, error } = await sb.from("deep_audits").insert(row).select("id, created_at").single();
  if (error) {
    // Migration 025 not applied yet: report honestly rather than 500-looping.
    if (/deep_audits|relation/.test(error.message || "")) {
      return NextResponse.json(
        { error: "Deep Audit storage is not deployed yet (migration 025 pending). Answers were NOT saved." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, createdAt: data.created_at, reported, modeled });
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leadId = new URL(req.url).searchParams.get("leadId");
  const sb = getDataClient();
  let query = sb.from("deep_audits").select("*").order("created_at", { ascending: false }).limit(20);
  if (leadId) query = query.eq("lead_id", leadId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deepAudits: data || [] });
}
