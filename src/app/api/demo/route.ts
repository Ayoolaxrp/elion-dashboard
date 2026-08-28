// Demo automation backend, simulates email sending, WhatsApp messages, and CRM updates
// This runs on the server and stores state in-memory for demo purposes
import { NextRequest, NextResponse } from "next/server";

// In-memory store for demo messages
const demoStore = {
  emails: [] as Array<{ id: string; to: string; subject: string; body: string; status: string; timestamp: string; from: string }>,
  whatsapp: [] as Array<{ id: string; to: string; message: string; status: string; timestamp: string; from: string; templateName?: string }>,
  leads: [] as Array<{ id: string; name: string; email: string; phone: string; source: string; status: string; score: number; timestamp: string }>,
  bookings: [] as Array<{ id: string; client: string; date: string; time: string; type: string; status: string; timestamp: string }>,
  sequences: [] as Array<{ id: string; leadId: string; steps: string[]; currentStep: number; status: string; timestamp: string }>,
};

// Industry benchmarks for realistic demo data
const demoTemplates = {
  welcome_email: {
    subject: "Welcome to {{company}}, Here's what happens next",
    body: "Hi {{name}},\n\nThank you for reaching out to us! We're excited to help you transform your business operations.\n\nHere's what happens next:\n1. Our team will review your requirements within 24 hours\n2. We'll schedule a brief call to understand your needs\n3. You'll receive a custom automation roadmap\n\nIn the meantime, check out our latest case studies at elion.ng/case-studies\n\nBest regards,\nThe Elion Team",
  },
  followup_email: {
    subject: "Quick follow-up, {{company}} automation opportunity",
    body: "Hi {{name}},\n\nI wanted to follow up on our previous conversation about automating your lead response process.\n\nBased on our audit, you could be saving approximately NGN 2.4M annually by automating your follow-up sequences.\n\nWould you be available for a 15-minute call this week to discuss implementation?\n\nBest,\nThe Elion Team",
  },
  reactivation_email: {
    subject: "We miss you, {{name}}, Special offer inside",
    body: "Hi {{name}},\n\nIt's been a while since you visited us. We've made some exciting updates that we think you'll love.\n\nAs a valued contact, we're offering you a free Automation Leak Audit (worth NGN 100,000) to help identify where your business is losing time and money.\n\nClick here to claim your free audit: elion.ng/audit\n\nCheers,\nThe Elion Team",
  },
  booking_confirmation: {
    subject: "Your appointment is confirmed, {{date}} at {{time}}",
    body: "Hi {{name}},\n\nYour appointment has been confirmed:\n\nDate: {{date}}\nTime: {{time}}\nLocation: {{location}}\n\nPlease arrive 5 minutes early. If you need to reschedule, reply to this email or call us.\n\nSee you soon!\nThe Elion Team",
  },
  whatsapp_welcome: {
    message: "Hi {{name}}! Thanks for reaching out to Elion. We help businesses automate their lead response, follow-ups, and operations. How can we help you today?",
  },
  whatsapp_followup: {
    message: "Hi {{name}}, just checking in! We noticed you were interested in our automation services. Would you like to schedule a quick 15-min call to discuss how we can help {{company}} save time and increase conversions?",
  },
  whatsapp_booking: {
    message: "Hi {{name}}! Your appointment is confirmed for {{date}} at {{time}}. We'll send you a reminder 24 hours before. See you soon! 📅",
  },
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function replacePlaceholders(template: string, data: Record<string, string>) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    switch (action) {
      case "send_email": {
        const tmpl = data.template || "welcome_email";
        const emailTmpl = tmpl in demoTemplates && "subject" in (demoTemplates as Record<string, Record<string, string>>)[tmpl] ? (demoTemplates as Record<string, Record<string, string>>)[tmpl] : demoTemplates.welcome_email;
        const email = {
          id: generateId("email"),
          to: data.to || "demo@example.com",
          from: "hello@elion.ng",
          subject: replacePlaceholders(emailTmpl.subject || "Welcome", data.placeholders || {}),
          body: replacePlaceholders(emailTmpl.body || "", data.placeholders || {}),
          status: "sent" as string,
          timestamp: new Date().toISOString(),
        };
        demoStore.emails.push(email);
        setTimeout(() => { email.status = "delivered"; }, 1000);
        return NextResponse.json({ success: true, email });
      }

      case "send_whatsapp": {
        const template = demoTemplates[data.template as keyof typeof demoTemplates] || demoTemplates.whatsapp_welcome;
        const msg = {
          id: generateId("wa"),
          to: data.to || "+234 801 234 5678",
          from: "Elion Business",
          message: replacePlaceholders((template as { message: string }).message, data.placeholders || {}),
          status: "sent" as string,
          timestamp: new Date().toISOString(),
          templateName: data.template,
        };
        demoStore.whatsapp.push(msg);
        setTimeout(() => { msg.status = "delivered"; }, 800);
        setTimeout(() => { msg.status = "read"; }, 3000);
        return NextResponse.json({ success: true, whatsapp: msg });
      }

      case "add_lead": {
        const lead = {
          id: generateId("lead"),
          name: data.name || "Demo Lead",
          email: data.email || "lead@example.com",
          phone: data.phone || "+234 801 234 5678",
          source: data.source || "Website",
          status: "new",
          score: Math.floor(Math.random() * 40) + 60,
          timestamp: new Date().toISOString(),
        };
        demoStore.leads.push(lead);
        return NextResponse.json({ success: true, lead });
      }

      case "create_booking": {
        const booking = {
          id: generateId("bk"),
          client: data.client || "Demo Client",
          date: data.date || new Date().toISOString().split("T")[0],
          time: data.time || "10:00",
          type: data.type || "video",
          status: "confirmed",
          timestamp: new Date().toISOString(),
        };
        demoStore.bookings.push(booking);
        return NextResponse.json({ success: true, booking });
      }

      case "start_sequence": {
        const seq = {
          id: generateId("seq"),
          leadId: data.leadId || "demo-lead",
          steps: data.steps || ["welcome_email", "delay_2d", "whatsapp_followup", "delay_3d", "followup_email"],
          currentStep: 0,
          status: "active",
          timestamp: new Date().toISOString(),
        };
        demoStore.sequences.push(seq);
        return NextResponse.json({ success: true, sequence: seq });
      }

      case "get_inbox": {
        return NextResponse.json({
          emails: demoStore.emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
          whatsapp: demoStore.whatsapp.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
          leads: demoStore.leads,
          bookings: demoStore.bookings,
          sequences: demoStore.sequences,
          stats: {
            emailsSent: demoStore.emails.length,
            whatsappSent: demoStore.whatsapp.length,
            leadsCaptured: demoStore.leads.length,
            bookingsCreated: demoStore.bookings.length,
            activeSequences: demoStore.sequences.filter((s) => s.status === "active").length,
          },
        });
      }

      case "run_full_demo": {
        // Run a complete automation demo, lead capture → email → whatsapp → booking
        const demoData = {
          name: data?.name || "Adebayo Johnson",
          email: data?.email || "adebayo@techcorp.ng",
          phone: data?.phone || "+234 801 234 5678",
          company: data?.company || "TechCorp Nigeria",
          source: data?.source || "Meta Ads",
        };

        // Step 1: Lead captured
        const lead = {
          id: generateId("lead"),
          name: demoData.name,
          email: demoData.email,
          phone: demoData.phone,
          source: demoData.source,
          status: "new",
          score: Math.floor(Math.random() * 20) + 80,
          timestamp: new Date().toISOString(),
        };
        demoStore.leads.push(lead);

        // Step 2: Instant email response
        const email = {
          id: generateId("email"),
          to: demoData.email,
          from: "hello@elion.ng",
          subject: replacePlaceholders(demoTemplates.welcome_email.subject, { company: demoData.company, name: demoData.name }),
          body: replacePlaceholders(demoTemplates.welcome_email.body, { company: demoData.company, name: demoData.name }),
          status: "sent" as string,
          timestamp: new Date().toISOString(),
        };
        demoStore.emails.push(email);

        // Step 3: WhatsApp message
        const whatsapp = {
          id: generateId("wa"),
          to: demoData.phone,
          from: "Elion Business",
          message: replacePlaceholders(demoTemplates.whatsapp_welcome.message, { name: demoData.name }),
          status: "sent" as string,
          timestamp: new Date().toISOString(),
          templateName: "whatsapp_welcome",
        };
        demoStore.whatsapp.push(whatsapp);

        // Step 4: Booking created
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const booking = {
          id: generateId("bk"),
          client: demoData.name,
          date: tomorrow.toISOString().split("T")[0],
          time: "10:00",
          type: "video",
          status: "confirmed",
          timestamp: new Date().toISOString(),
        };
        demoStore.bookings.push(booking);

        // Simulate statuses
        setTimeout(() => { email.status = "delivered"; whatsapp.status = "delivered"; }, 1000);
        setTimeout(() => { whatsapp.status = "read"; }, 3000);
        setTimeout(() => { lead.status = "qualified"; }, 2000);

        return NextResponse.json({
          success: true,
          demo: "full_pipeline",
          steps: [
            { step: 1, action: "Lead Captured", detail: `${lead.name} from ${lead.source} (Score: ${lead.score})`, status: "completed" },
            { step: 2, action: "Email Sent", detail: `Welcome email to ${email.to}`, status: "completed" },
            { step: 3, action: "WhatsApp Sent", detail: `Auto-greeting to ${whatsapp.to}`, status: "completed" },
            { step: 4, action: "Booking Created", detail: `${booking.client}, ${booking.date} at ${booking.time}`, status: "completed" },
          ],
          lead, email, whatsapp, booking,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    emails: demoStore.emails,
    whatsapp: demoStore.whatsapp,
    leads: demoStore.leads,
    bookings: demoStore.bookings,
    stats: {
      emailsSent: demoStore.emails.length,
      whatsappSent: demoStore.whatsapp.length,
      leadsCaptured: demoStore.leads.length,
      bookingsCreated: demoStore.bookings.length,
    },
  });
}
