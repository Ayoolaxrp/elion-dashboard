import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type Client = ReturnType<typeof createServerClient>;

async function getSupabase(): Promise<Client> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

async function requireAdmin() {
  const sb = await getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes((user.email || "").toLowerCase()) ? user : null;
}

export const dynamic = "force-dynamic";

const PHASES = ["investigating", "identified", "monitoring", "resolved"] as const;
type Phase = (typeof PHASES)[number];

interface UpdateRow { id: string; incident_id: string; status: Phase; message: string | null; created_at: string }
interface IncidentRow {
  id: string;
  title: string;
  status: string;
  message: string | null;
  components_affected: string[] | null;
  created_at: string;
  resolved_at: string | null;
  incident_updates?: UpdateRow[] | null;
}
interface IncidentOut extends Omit<IncidentRow, "incident_updates"> { updates: UpdateRow[] }

const isPhase = (v: unknown): v is Phase => PHASES.includes(v as Phase);

// GET - admin incident log with full update timelines
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getSupabase();
  const { data, error } = await sb
    .from("incidents")
    .select("*, incident_updates(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const incidents: IncidentOut[] = ((data || []) as IncidentRow[]).map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    message: i.message,
    components_affected: i.components_affected,
    created_at: i.created_at,
    resolved_at: i.resolved_at,
    updates: (i.incident_updates || []).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
  }));

  return NextResponse.json({ incidents });
}

// POST - create an incident with its initial (Investigating) update
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getSupabase();
  const body: { title?: unknown; message?: unknown; status?: unknown; components_affected?: unknown } = await request.json();

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  const phase: Phase = isPhase(body.status) ? body.status : "investigating";
  const message = typeof body.message === "string" && body.message.trim() ? body.message.trim() : null;
  const components_affected = Array.isArray(body.components_affected)
    ? body.components_affected.filter((c): c is string => typeof c === "string")
    : [];

  const { data: incident, error: incError } = await sb
    .from("incidents")
    .insert({
      title: body.title.trim(),
      status: phase,
      message,
      components_affected,
    })
    .select()
    .single();

  if (incError) {
    return NextResponse.json({ error: incError.message }, { status: 500 });
  }

  // Keep the public timeline consistent: every incident starts with an
  // Investigating entry so the log shows a timestamped sequence.
  await sb.from("incident_updates").insert({
    incident_id: incident.id,
    status: phase,
    message,
  });

  return NextResponse.json({ incident }, { status: 201 });
}

// PUT - post a phase update to an existing incident (Investigating → Identified
// → Monitoring → Resolved). Resolving sets resolved_at; the incident's status
// mirrors its latest update.
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getSupabase();
  const body: { id?: unknown; status?: unknown; message?: unknown } = await request.json();

  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (!isPhase(body.status)) {
    return NextResponse.json({ error: "status must be one of " + PHASES.join(", ") }, { status: 400 });
  }
  const message = typeof body.message === "string" && body.message.trim() ? body.message.trim() : null;

  const { data: existing, error: existsError } = await sb
    .from("incidents")
    .select("id")
    .eq("id", body.id)
    .maybeSingle();
  if (existsError) return NextResponse.json({ error: existsError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "incident not found" }, { status: 404 });

  const { data: update, error: upError } = await sb
    .from("incident_updates")
    .insert({ incident_id: body.id, status: body.status, message })
    .select()
    .single();
  if (upError) return NextResponse.json({ error: upError.message }, { status: 500 });

  const resolved_at = body.status === "resolved" ? new Date().toISOString() : null;
  const { error: incError } = await sb
    .from("incidents")
    .update({ status: body.status, resolved_at, updated_at: new Date().toISOString() })
    .eq("id", body.id);
  if (incError) return NextResponse.json({ error: incError.message }, { status: 500 });

  return NextResponse.json({ update, incident_status: body.status });
}
