-- Align notifications to the schema the application expects.
-- 008 created the table with a `read` boolean and no client link; the
-- app (admin list, sidebar unread badge, automations/commercial/documents
-- inserts) uses is_read, read_at and client_id. Add the missing columns
-- and backfill from `read`, keeping `read` for compatibility.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Backfill is_read from the legacy read column where present
UPDATE notifications SET is_read = read WHERE read IS NOT NULL AND is_read IS NULL;

-- Keep legacy column in sync for any older writer
UPDATE notifications SET read = is_read WHERE is_read IS NOT NULL AND read IS DISTINCT FROM is_read;

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
