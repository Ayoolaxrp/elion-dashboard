-- =====================================================
-- 022 — Notifications: unify read column, complete schema, tighten RLS
-- =====================================================
-- Migration 011 (is_read + client_id/document_type/read_at + type CHECK) was
-- never applied because 008 had already created `notifications` with a `read`
-- column and 011 used CREATE TABLE IF NOT EXISTS. Code and APIs drifted: the
-- admin API reads/writes `is_read` while the live table only has `read`.
-- This migration makes the live schema match the intended 011 shape (column
-- `is_read`), widens the type CHECK so lifecycle events (onboarding sends,
-- payments, contracts…) can be logged, and replaces 008's permissive
-- "USING (true)" RLS policy with a service-role-only policy so anonymous
-- callers can no longer read admin notifications.

BEGIN;

-- 1) Unify on is_read.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE notifications RENAME COLUMN read TO is_read;
  END IF;
END $$;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications DROP COLUMN IF EXISTS read;

-- 2) Complete the 011 columns that were never added.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS document_type TEXT;

-- 3) Indexes (old index follows the renamed column; ensure the rest exist).
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 4) Widened type CHECK (replaces the missing 011 constraint; 008 had none).
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'document_viewed', 'document_accepted', 'document_signed', 'document_paid',
    'onboarding_complete', 'provisioning_failed', 'new_lead',
    'onboarding_email_sent', 'lead_created', 'client_created',
    'payment_recorded', 'contract_signed', 'audit_completed',
    'automation_status', 'system'
  )
);

-- 5) Tighten RLS: notifications are admin-only. Drop 008's permissive
-- "FOR ALL USING (true)" policy (any name it may have had) so anonymous and
-- non-admin roles can no longer read or write admin notifications.
DROP POLICY IF EXISTS "Admin full access notifications" ON notifications;
DROP POLICY IF EXISTS "Admin full access on notifications" ON notifications;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'service_role_all_notifications') THEN
    CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMIT;
