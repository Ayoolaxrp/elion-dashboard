// The 6-Document Onboarding System
// Based on: "Six documents. That's the whole system.
// Proposal, contract, invoice, welcome doc, client portal, thank you doc.
// Nothing else changes between a $2k project and a $12k project."

export interface OnboardingDocument {
  id: string;
  client_id: string;
  type: "proposal" | "contract" | "invoice" | "welcome" | "portal" | "thankyou";
  status: "draft" | "sent" | "viewed" | "accepted" | "signed" | "paid" | "completed";
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  completed_at: string | null;
  data: Record<string, unknown>;
}

export interface DocumentTemplate {
  type: OnboardingDocument["type"];
  label: string;
  description: string;
  step: number;
}

export const DOCUMENT_SYSTEM: DocumentTemplate[] = [
  { type: "proposal", label: "Proposal", description: "Scope, deliverables, and pricing", step: 1 },
  { type: "contract", label: "Contract", description: "Agreement and terms", step: 2 },
  { type: "invoice", label: "Invoice", description: "Payment request", step: 3 },
  { type: "welcome", label: "Welcome Doc", description: "Sets expectations from day one", step: 4 },
  { type: "portal", label: "Client Portal", description: "Where everything lives", step: 5 },
  { type: "thankyou", label: "Thank You", description: "Personal touch after completion", step: 6 },
];

// Generate proposal content from client data
export function generateProposal(client: {
  company_name: string;
  contact_name: string;
  scope: string;
  automations: string[];
  total_amount: number;
}) {
  return {
    title: `Automation Implementation Proposal`,
    prepared_for: client.company_name,
    contact: client.contact_name,
    date: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    scope: client.scope,
    automations: client.automations,
    total: client.total_amount,
    timeline: "2-4 weeks from kickoff",
    sections: [
      {
        title: "Overview",
        content: `ELION will implement automation systems for ${client.company_name} to address operational inefficiencies in lead response, follow-up, and booking workflows.`,
      },
      {
        title: "Scope of Work",
        items: client.automations.map(a => ({
          name: a,
          description: `Implementation, configuration, and deployment of ${a.toLowerCase()} automation.`,
        })),
      },
      {
        title: "Timeline",
        content: `Kickoff within 48 hours of contract signing. Implementation completed within 2-4 weeks. Each automation is tested before going live.`,
      },
      {
        title: "Investment",
        content: `Total: N${client.total_amount.toLocaleString()}`,
        note: "One-time setup fee. No recurring charges for the automation infrastructure.",
      },
    ],
  };
}

// Generate contract content
export function generateContract(client: {
  company_name: string;
  contact_name: string;
  email: string;
  scope: string;
  total_amount: number;
}) {
  return {
    title: `Service Agreement`,
    between: `ELION ("Provider")`,
    and: `${client.contact_name} / ${client.company_name} ("Client")`,
    date: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    sections: [
      {
        title: "1. Scope of Services",
        content: `Provider will implement automation systems as described in the attached Proposal, which is incorporated into this Agreement by reference.`,
      },
      {
        title: "2. Timeline",
        content: `Work will commence within 48 hours of contract execution and payment. Implementation will be completed within 2-4 weeks.`,
      },
      {
        title: "3. Payment Terms",
        content: `Total fee: N${client.total_amount.toLocaleString()}. Payment due before implementation begins. No refunds once implementation has started.`,
      },
      {
        title: "4. Ownership",
        content: `Client owns all custom configurations, workflows, and business data created during implementation. Provider retains ownership of pre-existing reusable infrastructure and templates.`,
      },
      {
        title: "5. Support",
        content: `30 days of post-launch support included. Additional support available on a monthly retainer basis.`,
      },
      {
        title: "6. Confidentiality",
        content: `Both parties agree to maintain confidentiality of proprietary information shared during the engagement.`,
      },
    ],
    signature_line: true,
  };
}

// Generate invoice content
export function generateInvoice(client: {
  company_name: string;
  contact_name: string;
  invoice_number: string;
  items: { description: string; amount: number }[];
  total_amount: number;
  due_date: string;
}) {
  return {
    invoice_number: client.invoice_number,
    date: new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" }),
    bill_to: client.company_name,
    contact: client.contact_name,
    items: client.items,
    total: client.total_amount,
    due_date: client.due_date,
    payment_methods: ["Bank Transfer", "Card Payment"],
    note: "Payment is required before implementation begins.",
  };
}

// Generate welcome doc content
export function generateWelcomeDoc(client: {
  company_name: string;
  contact_name: string;
  automations: string[];
}) {
  return {
    title: `Welcome to ELION`,
    greeting: `Hi ${client.contact_name},`,
    body: `Welcome to ELION. We are officially getting started.

Your automation project is now moving into the implementation phase, and we look forward to building something that genuinely improves how ${client.company_name} operates.

Our process is simple:

Discover > Configure > Build > Test > Launch

We will start by understanding how your business currently handles the workflow we are automating, where the bottlenecks are, and what the ideal process should look like.`,
    what_happens_next: [
      "Kickoff call to confirm scope and requirements",
      "Workflow discovery and configuration",
      "System build and deployment",
      "Testing and verification",
      "Go live with your automations",
    ],
    your_automations: client.automations,
    closing: `This is not about simply adding another software tool to your business. The goal is to build a system that actually works around how your business operates.

Welcome to ELION. Let us build.`,
    signature: "Ayoolamikun",
    signature_title: "ELION",
  };
}

// Generate thank you doc content
export function generateThankYouDoc(client: {
  company_name: string;
  contact_name: string;
  automations: string[];
  connected_systems: string[];
}) {
  return {
    title: `Your ELION Systems Are Live`,
    greeting: `Hi ${client.contact_name},`,
    body: `Your ELION automation has been completed and is ready for use.

Over the course of the implementation, we took the workflow we discussed, configured the system around your business, connected the required components, and tested the agreed process.`,
    delivered: client.automations.map(a => ({
      name: a,
      status: "Live",
    })),
    connected_systems: client.connected_systems,
    your_next_step: `You can now begin using the system as part of your normal business operations. We will also provide any relevant handover information, access details, or instructions you need.

Please remember that the purpose of this system is not simply to "have automation." It is to remove a repetitive operational burden from your business and create a process that works consistently.`,
    closing: `Thank you for trusting ELION with this part of your business. We genuinely appreciate the opportunity to build with you.

Here is to building better systems.`,
    signature: "Ayoolamikun",
    signature_title: "ELION",
  };
}
