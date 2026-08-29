import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase not configured");
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Rate limiting: 10 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`submit:${ip}`, { windowMs: 60000, maxRequests: 10 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      website,
      businessType,
      primaryProblem,
      enquiryChannels,
      teamSize,
      source,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }
    if (name.length > 100) {
      return NextResponse.json({ success: false, error: "Name too long" }, { status: 400 });
    }
    if (email.length > 200) {
      return NextResponse.json({ success: false, error: "Email too long" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Duplicate protection: same email within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .gt("created_at", oneHourAgo)
      .limit(1);

    if (recentLeads && recentLeads.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Your request has already been received. We will contact you soon.",
        id: recentLeads[0].id,
      });
    }

    // Create lead record
    const leadId = generateId("lead");
    const { error: insertError } = await supabase.from("leads").insert({
      id: leadId,
      contact_name: String(name).trim().slice(0, 100),
      email: String(email).toLowerCase().trim().slice(0, 200),
      phone: phone ? String(phone).slice(0, 30) : null,
      company_name: businessType ? String(businessType).slice(0, 200) : "Not specified",
      website: website ? String(website).slice(0, 300) : null,
      industry: businessType ? String(businessType).slice(0, 100) : null,
      company_size: teamSize ? String(teamSize).slice(0, 50) : null,
      primary_problem: primaryProblem ? String(primaryProblem).slice(0, 200) : null,
      enquiry_channels: enquiryChannels ? String(enquiryChannels).slice(0, 200) : null,
      audit_status: "pending",
      lead_status: "new",
      source: source || "funnel",
    });

    if (insertError) {
      console.error("Lead insert error:", insertError.message);
      return NextResponse.json(
        { success: false, error: "Failed to process request. Please try again." },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from("activity_log").insert({
      lead_id: leadId,
      event_type: "lead_created",
      event_data: { source: source || "funnel", email },
    });

    // Attempt n8n webhook (non-blocking)
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId,
            name,
            email,
            phone,
            website,
            businessType,
            primaryProblem,
            enquiryChannels,
            teamSize,
            source,
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        });
        await supabase
          .from("leads")
          .update({ n8n_status: "sent" })
          .eq("id", leadId);
      } catch {
        await supabase
          .from("leads")
          .update({ n8n_status: "failed" })
          .eq("id", leadId);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Your audit request has been received. We will review your information and contact you within 24 hours.",
      id: leadId,
    });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}

// GET - Admin endpoint for listing leads
export async function GET(request: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const supabase = getSupabaseAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("lead_status", status);
  }

  const { data: leads, error } = await query;

  if (error) {
    console.error("Leads query error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }

  return NextResponse.json({ total: leads?.length || 0, leads: leads || [] });
}
