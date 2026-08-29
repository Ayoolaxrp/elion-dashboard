import { NextRequest, NextResponse } from "next/server";

interface RequestPayload {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  website?: string;
  selectedAutomation: string;
  preferredContact: "email" | "phone" | "whatsapp";
  message?: string;
  auditId?: string;
  auditFindings?: string;
}

const requests: RequestPayload[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, businessName, email, phone, selectedAutomation, preferredContact } = body;

    if (!name || !businessName || !email || !phone || !selectedAutomation) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload: RequestPayload = {
      name: String(name).slice(0, 100),
      businessName: String(businessName).slice(0, 200),
      email: String(email).slice(0, 200),
      phone: String(phone).slice(0, 30),
      website: body.website ? String(body.website).slice(0, 300) : undefined,
      selectedAutomation: String(selectedAutomation).slice(0, 100),
      preferredContact: preferredContact || "email",
      message: body.message ? String(body.message).slice(0, 1000) : undefined,
      auditId: body.auditId ? String(body.auditId).slice(0, 50) : undefined,
      auditFindings: body.auditFindings ? String(body.auditFindings).slice(0, 2000) : undefined,
    };

    requests.push(payload);

    // In production, forward to n8n webhook, send email, or store in database
    // For now, store in memory and return success
    console.log("Implementation request received:", {
      name: payload.name,
      business: payload.businessName,
      automation: payload.selectedAutomation,
    });

    return NextResponse.json({
      success: true,
      message: "Your implementation request has been received. We will contact you within 24 hours.",
      id: `REQ-${Date.now()}`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    total: requests.length,
    requests: requests.slice(-10),
  });
}
