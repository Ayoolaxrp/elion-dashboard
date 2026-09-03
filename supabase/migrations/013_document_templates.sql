-- Document Templates Table
-- Stores the customizable templates for the 6 onboarding documents:
-- 1. Proposal, 2. Contract, 3. Invoice, 4. Welcome, 5. Portal, 6. Thank You
-- Templates are global (not per-client) and versioned for future audit.

CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY DEFAULT ('dt_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Document type this template renders
  doc_type TEXT NOT NULL UNIQUE
    CHECK (doc_type IN ('proposal', 'contract', 'invoice', 'welcome', 'portal', 'thankyou')),

  -- Template content (JSONB: subject, greeting, body, sections, closing, signature)
  content JSONB NOT NULL DEFAULT '{}',

  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',

  -- Active flag: only the active template is used for generation
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(doc_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);

-- RLS: admin-managed registry, readable by the app
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_templates_all_access' AND tablename = 'document_templates') THEN
    CREATE POLICY "document_templates_all_access" ON document_templates FOR ALL USING (true);
  END IF;
END $$;

-- Seed defaults so the editor has something to load
INSERT INTO document_templates (doc_type, version, content, is_active) VALUES
  ('proposal', '1.0.0', '{
    "subject": "Automation Implementation Proposal for {{company_name}}",
    "greeting": "Hi {{contact_name}},",
    "body": "Thank you for your interest in ELION. Based on our assessment of {{company_name}}, we have prepared the following proposal for your automation implementation.",
    "overview": "ELION will implement automation systems for {{company_name}} to address operational inefficiencies in lead response, follow-up, and booking workflows.",
    "scope": "The following automation systems will be implemented:\n{{#each automations}}\n- {{this}}\n{{/each}}",
    "timeline": "Kickoff within 48 hours of contract signing. Implementation completed within 2-4 weeks. Each automation is tested before going live.",
    "investment": "Total: N{{total_amount}}\n\nOne-time setup fee. No recurring charges for the automation infrastructure.",
    "closing": "We look forward to working with you.",
    "signature_name": "Ayoolamikun",
    "signature_title": "ELION"
  }', TRUE),
  ('contract', '1.0.0', '{
    "subject": "Service Agreement - ELION x {{company_name}}",
    "body": "This Service Agreement is entered into between ELION (Provider) and {{contact_name}} / {{company_name}} (Client).",
    "scope": "Provider will implement automation systems as described in the attached Proposal, which is incorporated into this Agreement by reference.",
    "timeline": "Work will commence within 48 hours of contract execution and payment. Implementation will be completed within 2-4 weeks.",
    "payment": "Total fee: N{{total_amount}}. Payment due before implementation begins.",
    "ownership": "Client owns the configurations, data, and documentation delivered. Provider retains pre-existing reusable infrastructure.",
    "support": "Includes 30 days of post-launch support. Optional support plans may be purchased separately.",
    "confidentiality": "Both parties agree to keep business information confidential.",
    "signature_required": true,
    "closing": "By signing, both parties agree to the terms above."
  }', TRUE),
  ('invoice', '1.0.0', '{
    "subject": "Invoice {{invoice_number}} - ELION",
    "body": "Hi {{contact_name}}, please find your invoice below.",
    "total_label": "Total",
    "due_label": "Due Date",
    "payment_note": "Payment is required before implementation begins.",
    "payment_methods": "Bank Transfer, Card Payment",
    "closing": "Thank you for choosing ELION."
  }', TRUE),
  ('welcome', '1.0.0', '{
    "subject": "Welcome to ELION, {{contact_name}}",
    "greeting": "Hi {{contact_name}},",
    "body": "Welcome to ELION. We are officially getting started. Your automation project is now moving into the implementation phase.",
    "step_1": "Kickoff call to confirm scope",
    "step_2": "Workflow discovery",
    "step_3": "System build and configuration",
    "step_4": "Testing",
    "step_5": "Go live",
    "closing": "Welcome to ELION. Let us build.",
    "signature_name": "Ayoolamikun",
    "signature_title": "ELION"
  }', TRUE),
  ('portal', '1.0.0', '{
    "subject": "Your ELION Client Portal",
    "body": "Hi {{contact_name}}, your ELION client portal is ready. View your documents, track progress, and monitor your automation systems.",
    "dashboard_link_text": "Go to Dashboard",
    "closing": "See you inside."
  }', TRUE),
  ('thankyou', '1.0.0', '{
    "subject": "Your ELION Systems Are Live, {{contact_name}}",
    "greeting": "Hi {{contact_name}},",
    "body": "Your automation has been completed and is ready for use. Here is what was delivered:",
    "delivered_label": "Automation",
    "status_label": "Status",
    "connected_label": "Connected Systems",
    "workflow_label": "Key Workflow",
    "closing": "Thank you for trusting ELION with this part of your business. We genuinely appreciate the opportunity to build with you.",
    "signature_name": "Ayoolamikun",
    "signature_title": "ELION"
  }', TRUE)
ON CONFLICT (doc_type) DO NOTHING;