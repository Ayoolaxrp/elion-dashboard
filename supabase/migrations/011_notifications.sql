-- Notifications Table
-- Tracks admin notifications for document views and other events

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,

  -- Notification type
  type TEXT NOT NULL
    CHECK (type IN ('document_viewed', 'document_accepted', 'document_signed', 'document_paid', 'onboarding_complete', 'provisioning_failed')),

  -- Related entities
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  document_type TEXT,
  metadata JSONB DEFAULT '{}',

  -- Message
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Read status
  is_read BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access on notifications"
  ON notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ',')))
    )
  );
