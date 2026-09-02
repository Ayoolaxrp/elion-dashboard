"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, FileText, Shield, CreditCard, Mail, Settings, Handshake, Download, Send } from "lucide-react";

const DOC_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  proposal: { icon: FileText, color: "#3B66E8", label: "Proposal" },
  contract: { icon: Shield, color: "#8B5CF6", label: "Contract" },
  invoice: { icon: CreditCard, color: "#F59E0B", label: "Invoice" },
  welcome: { icon: Mail, color: "#10B981", label: "Welcome Doc" },
  portal: { icon: Settings, color: "#00D4FF", label: "Client Portal" },
  thankyou: { icon: Handshake, color: "#10B981", label: "Thank You" },
};

// Mock document data for demo
const MOCK_DOCS: Record<string, any> = {
  proposal: {
    title: "Automation Implementation Proposal",
    prepared_for: "ABC Properties",
    contact: "Adebayo Okonkwo",
    date: "August 22, 2026",
    sections: [
      { title: "Overview", content: "ELION will implement automation systems for ABC Properties to address operational inefficiencies in lead response, follow-up, and booking workflows." },
      { title: "Scope of Work", items: [
        { name: "Lead Response System", description: "Automated lead capture, qualification, and response via WhatsApp and Email." },
        { name: "Follow-Up Sequence", description: "Automated follow-up sequences for leads who do not convert on first contact." },
        { name: "Booking Automation", description: "Calendar sync and automated appointment scheduling." },
      ]},
      { title: "Timeline", content: "Kickoff within 48 hours of contract signing. Implementation completed within 2-4 weeks. Each automation is tested before going live." },
      { title: "Investment", content: "Total: N350,000", note: "One-time setup fee. No recurring charges for the automation infrastructure." },
    ],
  },
  contract: {
    title: "Service Agreement",
    between: 'ELION ("Provider")',
    and: 'Adebayo Okonkwo / ABC Properties ("Client")',
    date: "August 22, 2026",
    sections: [
      { title: "1. Scope of Services", content: "Provider will implement automation systems as described in the attached Proposal, which is incorporated into this Agreement by reference." },
      { title: "2. Timeline", content: "Work will commence within 48 hours of contract execution and payment. Implementation will be completed within 2-4 weeks." },
      { title: "3. Payment Terms", content: "Total fee: N350,000. Payment due before implementation begins. No refunds once implementation has started." },
      { title: "4. Ownership", content: "Client owns all custom configurations, workflows, and business data created during implementation. Provider retains ownership of pre-existing reusable infrastructure and templates." },
      { title: "5. Support", content: "30 days of post-launch support included. Additional support available on a monthly retainer basis." },
      { title: "6. Confidentiality", content: "Both parties agree to maintain confidentiality of proprietary information shared during the engagement." },
    ],
    signature_line: true,
    signed: true,
    signed_at: "August 22, 2026",
  },
  invoice: {
    invoice_number: "ELION-2026-001",
    date: "August 22, 2026",
    bill_to: "ABC Properties",
    contact: "Adebayo Okonkwo",
    items: [
      { description: "Lead Response System - Setup", amount: 150000 },
      { description: "Follow-Up Sequence - Setup", amount: 100000 },
      { description: "Booking Automation - Setup", amount: 100000 },
    ],
    total: 350000,
    due_date: "September 5, 2026",
    paid: true,
    paid_at: "August 23, 2026",
  },
  welcome: {
    greeting: "Hi Adebayo,",
    body: "Welcome to ELION. We are officially getting started.\n\nYour automation project is now moving into the implementation phase, and we look forward to building something that genuinely improves how ABC Properties operates.\n\nOur process is simple:\n\nDiscover > Configure > Build > Test > Launch\n\nWe will start by understanding how your business currently handles the workflow we are automating, where the bottlenecks are, and what the ideal process should look like.",
    what_happens_next: [
      "Kickoff call to confirm scope and requirements",
      "Workflow discovery and configuration",
      "System build and deployment",
      "Testing and verification",
      "Go live with your automations",
    ],
    your_automations: ["Lead Response System", "Follow-Up Sequence", "Booking Automation"],
    closing: "This is not about simply adding another software tool to your business. The goal is to build a system that actually works around how your business operates.\n\nWelcome to ELION. Let us build.",
    signature: "Ayoolamikun",
  },
  thankyou: {
    greeting: "Hi Adebayo,",
    body: "Your ELION automation has been completed and is ready for use.\n\nOver the course of the implementation, we took the workflow we discussed, configured the system around your business, connected the required components, and tested the agreed process.",
    delivered: [
      { name: "Lead Response System", status: "Live" },
      { name: "Follow-Up Sequence", status: "Live" },
      { name: "Booking Automation", status: "Live" },
    ],
    connected_systems: ["WhatsApp Business", "Email (SMTP)", "Google Calendar"],
    closing: "Thank you for trusting ELION with this part of your business. We genuinely appreciate the opportunity to build with you.\n\nHere is to building better systems.",
    signature: "Ayoolamikun",
  },
};

export default function DocumentPage({ params }: { params: Promise<{ docType: string }> }) {
  const { docType } = use(params);
  const config = DOC_CONFIG[docType];
  const doc = MOCK_DOCS[docType];

  // Fetch real document data
  const [realDoc, setRealDoc] = useState<any>(null);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    fetch("/api/client/documents")
      .then(r => r.json())
      .then(d => {
        const found = d.documents?.find((doc: any) => doc.type === docType);
        if (found?.content) {
          setRealDoc(found.content);
          setClientName(d.client?.name || "");
          // Mark as viewed
          fetch("/api/client/documents", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ doc_type: docType }),
          });
        }
      })
      .catch(() => {});
  }, [docType]);

  // Use real data if available, fallback to mock
  const displayDoc = realDoc || doc;

if (!config || !doc) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-lg font-bold text-white mb-2">Document not found</h1>
          <Link href="/dashboard" className="text-sm text-[var(--color-accent)] hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: config.color }} />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{config.label}</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs font-medium hover:text-white transition-colors">
            <Download className="w-3 h-3" /> Download
          </button>
        </div>
      </header>

      {/* Document Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-8 md:p-12">
          {/* Document Header */}
          <div className="text-center mb-8 pb-8 border-b border-[var(--color-border)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${config.color}20` }}>
              <Icon className="w-6 h-6" style={{ color: config.color }} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {displayDoc.title || config.label}
            </h1>
            {displayDoc.prepared_for && <p className="text-sm text-[var(--color-text-muted)]">Prepared for {displayDoc.prepared_for}</p>}
            {displayDoc.bill_to && <p className="text-sm text-[var(--color-text-muted)]">Bill to: {displayDoc.bill_to}</p>}
            {displayDoc.invoice_number && <p className="text-xs text-[var(--color-text-muted)] mt-1">{displayDoc.invoice_number}</p>}
          </div>

          {/* Proposal */}
          {docType === "proposal" && (
            <div className="space-y-6">
              {displayDoc.sections.map((section: any, i: number) => (
                <div key={i}>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{section.title}</h2>
                  {section.content && <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{section.content}</p>}
                  {section.items && (
                    <div className="space-y-2 mt-2">
                      {section.items.map((item: any, j: number) => (
                        <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface)]">
                          <CheckCircle className="w-4 h-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.note && <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">{section.note}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Contract */}
          {docType === "contract" && (
            <div className="space-y-6">
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p>Between: <span className="text-[var(--color-text-primary)] font-medium">{displayDoc.between}</span></p>
                <p>And: <span className="text-[var(--color-text-primary)] font-medium">{displayDoc.and}</span></p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Date: {displayDoc.date}</p>
              </div>
              {displayDoc.sections.map((section: any, i: number) => (
                <div key={i}>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{section.title}</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{section.content}</p>
                </div>
              ))}
              {displayDoc.signature_line && (
                <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                  {displayDoc.signed ? (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Signed by {displayDoc.and?.split("/")[0]?.trim()} on {displayDoc.signed_at}</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="h-px bg-[var(--color-border)] w-48" />
                      <p className="text-xs text-[var(--color-text-muted)]">Signature / Date</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Invoice */}
          {docType === "invoice" && (
            <div className="space-y-6">
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p>Bill to: <span className="text-[var(--color-text-primary)] font-medium">{displayDoc.bill_to}</span></p>
                <p className="text-xs text-[var(--color-text-muted)]">Date: {displayDoc.date} | Due: {displayDoc.due_date}</p>
              </div>
              <div className="space-y-2">
                {displayDoc.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4 rounded-lg bg-[var(--color-surface)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">{item.description}</span>
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">N{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total</span>
                  <span className="text-lg font-bold text-[var(--color-accent)]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>N{displayDoc.total.toLocaleString()}</span>
                </div>
              </div>
              {displayDoc.paid ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">Paid on {displayDoc.paid_at}</span>
                </div>
              ) : (
                <button className="w-full py-3 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Pay Now
                </button>
              )}
            </div>
          )}

          {/* Welcome Doc */}
          {docType === "welcome" && (
            <div className="space-y-6">
              <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                <p className="text-[var(--color-text-primary)] font-medium mb-4">{displayDoc.greeting}</p>
                {displayDoc.body}
              </div>
              {displayDoc.what_happens_next && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">What happens next</h2>
                  <div className="space-y-2">
                    {displayDoc.what_happens_next.map((step: string, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[var(--color-accent)]">{i + 1}</span>
                        </div>
                        <span className="text-sm text-[var(--color-text-secondary)]">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {displayDoc.your_automations && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Your Automations</h2>
                  <div className="flex flex-wrap gap-2">
                    {displayDoc.your_automations.map((a: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium border border-[var(--color-accent)]/20">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line mt-6 pt-6 border-t border-[var(--color-border)]">
                {displayDoc.closing}
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{displayDoc.signature}</p>
                <p className="text-xs text-[var(--color-text-muted)]">ELION</p>
              </div>
            </div>
          )}

          {/* Thank You Doc */}
          {docType === "thankyou" && (
            <div className="space-y-6">
              <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                <p className="text-[var(--color-text-primary)] font-medium mb-4">{displayDoc.greeting}</p>
                {displayDoc.body}
              </div>
              {displayDoc.delivered && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">What has been delivered</h2>
                  <div className="space-y-2">
                    {displayDoc.delivered.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface)]">
                        <span className="text-sm text-[var(--color-text-secondary)]">{item.name}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {displayDoc.connected_systems && (
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Connected Systems</h2>
                  <div className="flex flex-wrap gap-2">
                    {displayDoc.connected_systems.map((s: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-xs font-medium border border-[var(--color-border)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line mt-6 pt-6 border-t border-[var(--color-border)]">
                {displayDoc.closing}
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{displayDoc.signature}</p>
                <p className="text-xs text-[var(--color-text-muted)]">ELION</p>
              </div>
            </div>
          )}

          {docType === "portal" && (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Your client portal is the dashboard you are viewing now.</p>
              <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-colors">
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
