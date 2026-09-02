-- Client Documents Table
-- Tracks the 6 onboarding documents per client:
-- 1. Proposal, 2. Contract, 3. Invoice, 4. Welcome, 5. Portal, 6. Thank You

CREATE TABLE IF NOT EXISTS client_documents (
  id TEXT PRIMARY KEY DEFAULT ('doc_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Client reference
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Document type
  doc_type TEXT NOT NULL
    CHECK (doc_type IN ('proposal', 'contract', 'invoice', 'welcome', 'portal', 'thankyou')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'draft', 'sent', 'viewed', 'accepted', 'signed', 'paid', 'completed')),

  -- Document content (JSONB for flexible structure)
  content JSONB NOT NULL DEFAULT '{}',

  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,

  -- Unique constraint: one document per type per client
  UNIQUE(client_id, doc_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_status ON client_documents(status);

-- RLS policies
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on client_documents"
  ON client_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );

-- Clients can read their own documents
CREATE POLICY "Clients read own documents"
  ON client_documents FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE auth_user_id = auth.uid()
      OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Clients can update viewed_at on their own documents
CREATE POLICY "Clients mark documents viewed"
  ON client_documents FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE auth_user_id = auth.uid()
      OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients
      WHERE auth_user_id = auth.uid()
      OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
