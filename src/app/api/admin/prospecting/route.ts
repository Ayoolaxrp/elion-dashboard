import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/server";
import {
  deduplicateProspects,
  normalizeForStorage,
  parseProspectCsv,
  preflightProspect,
  type DiscoveryCandidate,
} from "@/lib/prospect/discovery";
import { validateProspectCandidate } from "@/lib/prospect/qualification";

const MAX_IMPORT = 100;
const ALLOWED_STATES = [
  "DISCOVERED",
  "VALIDATED",
  "AUDITED",
  "INVESTIGATE",
  "QUALIFIED",
  "REVIEWED",
  "APPROVED_FOR_OUTREACH",
  "REJECTED",
] as const;

type QualificationState = (typeof ALLOWED_STATES)[number];

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !(await isAdminEmail(user.email))) return null;
  return user;
}

function getDataClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function candidateFromBody(value: unknown): DiscoveryCandidate | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    business: String(row.business || row.business_name || row.company || "").trim(),
    website: String(row.website || row.url || row.domain || "").trim(),
    industry: String(row.industry || "").trim() || undefined,
    location: String(row.location || row.city || "").trim() || undefined,
    source: String(row.source || "manual_api").trim(),
    sourceUrl: String(row.sourceUrl || row.source_url || row.public_url || "manual://operator-import").trim(),
    retrievedAt: String(row.retrievedAt || row.retrieved_at || new Date().toISOString()),
    sourceRecordId: String(row.sourceRecordId || row.source_record_id || "").trim() || undefined,
  };
}

/**
 * Provider-neutral prospecting boundary. The current provider is an operator
 * CSV/manual import; a paid discovery provider can submit this same contract
 * later without changing preflight, deduplication or review states.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const state = params.get("state");
  const sb = getDataClient();
  let query = sb.from("prospect_candidates").select("*").order("created_at", { ascending: false }).limit(500);
  if (state && ALLOWED_STATES.includes(state as QualificationState)) query = query.eq("qualification_state", state);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Prospecting migration is not applied", detail: error.message }, { status: 503 });
  return NextResponse.json({ candidates: data || [], states: ALLOWED_STATES });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as {
    csv?: string;
    candidates?: unknown[];
    location?: string;
    industry?: string;
  } | null;
  if (!body) return NextResponse.json({ error: "JSON body required" }, { status: 400 });

  const imported = typeof body.csv === "string"
    ? parseProspectCsv(body.csv, { location: body.location, industry: body.industry })
    : Array.isArray(body.candidates) ? body.candidates.map(candidateFromBody).filter(Boolean) as DiscoveryCandidate[] : [];
  if (imported.length === 0) return NextResponse.json({ error: "Provide a non-empty CSV or candidates array" }, { status: 400 });
  if (imported.length > MAX_IMPORT) return NextResponse.json({ error: `Import is limited to ${MAX_IMPORT} candidates` }, { status: 413 });

  const candidates = deduplicateProspects(imported.map(normalizeForStorage));
  const sb = getDataClient();
  const domains = candidates.map((candidate) => validateProspectCandidate(candidate).domain).filter(Boolean) as string[];
  const { data: existing } = domains.length
    ? await sb.from("prospect_candidates").select("domain").in("domain", domains)
    : { data: [] as Array<{ domain: string }> };
  const existingDomains = new Set((existing || []).map((row) => row.domain));

  const results: Array<Record<string, unknown>> = [];
  for (const candidate of candidates) {
    const validation = validateProspectCandidate(candidate);
    if (!validation.valid || !candidate.website || (validation.domain && existingDomains.has(validation.domain))) {
      results.push({ business: candidate.business, website: candidate.website, status: validation.valid && existingDomains.has(validation.domain || "") ? "DUPLICATE" : "INVALID_INPUT", reasons: validation.reasons });
      continue;
    }

    const preflight = await preflightProspect(candidate);
    const row = {
      business_name: candidate.business,
      website: candidate.website,
      normalized_website: preflight.normalizedWebsite,
      domain: preflight.domain,
      industry: candidate.industry || null,
      location: candidate.location || null,
      source: candidate.source || "manual_api",
      source_url: candidate.sourceUrl || null,
      source_record_id: candidate.sourceRecordId || null,
      retrieved_at: candidate.retrievedAt || null,
      preflight_status: preflight.status,
      preflight_detail: preflight.detail,
      preflight,
      qualification_state: preflight.valid ? "VALIDATED" : "REJECTED",
      reviewed_by: null,
      reviewed_at: null,
    };
    const { data, error } = await sb.from("prospect_candidates").insert(row).select("id, business_name, domain, preflight_status, qualification_state").single();
    if (error) {
      results.push({ business: candidate.business, website: candidate.website, status: "PERSISTENCE_ERROR", detail: error.message });
    } else {
      if (validation.domain) existingDomains.add(validation.domain);
      results.push({ ...data, status: "IMPORTED" });
    }
  }

  return NextResponse.json({ provider: "manual_csv_or_api", imported: results.filter((row) => row.status === "IMPORTED").length, results }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; qualification_state?: string; rejection_reason?: string } | null;
  if (!body?.id || !ALLOWED_STATES.includes(body.qualification_state as QualificationState)) {
    return NextResponse.json({ error: "id and valid qualification_state are required" }, { status: 400 });
  }
  const nextState = body.qualification_state as QualificationState;
  const sb = getDataClient();
  const { data: current, error: readError } = await sb
    .from("prospect_candidates")
    .select("id, preflight_status, qualification_state, audit_id")
    .eq("id", body.id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  if (nextState === "APPROVED_FOR_OUTREACH" && current.qualification_state !== "REVIEWED") {
    return NextResponse.json({ error: "Candidate must be human-reviewed before outreach approval" }, { status: 409 });
  }
  if (["AUDITED", "INVESTIGATE", "QUALIFIED", "REVIEWED", "APPROVED_FOR_OUTREACH"].includes(nextState) && current.preflight_status !== "PASSED") {
    return NextResponse.json({ error: "Only a passed website preflight can enter audit or sales review" }, { status: 409 });
  }
  const update = {
    qualification_state: nextState,
    reviewed_by: admin.email,
    reviewed_at: new Date().toISOString(),
    rejection_reason: nextState === "REJECTED" ? (body.rejection_reason || "Rejected during review") : null,
  };
  const { data, error } = await sb.from("prospect_candidates").update(update).eq("id", body.id).select("id, qualification_state, reviewed_by, reviewed_at, rejection_reason").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ candidate: data });
}
