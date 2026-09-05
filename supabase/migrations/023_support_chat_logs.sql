-- =====================================================
-- 023 — Support assistant chat logs
-- =====================================================
-- Logs visitor questions and whether they were answered or escalated,
-- so the founder can see what prospects actually ask. Never stores
-- credentials or payment details. RLS is service-role-only (admin-only
-- reads happen through authenticated admin APIs), matching the
-- notifications hardening in migration 022.

BEGIN;

CREATE TABLE IF NOT EXISTS support_chat_logs (
  id TEXT PRIMARY KEY DEFAULT ('support_chat_' || gen_random_uuid()::text),
  question TEXT NOT NULL,
  answer_summary TEXT,
  outcome TEXT NOT NULL DEFAULT 'answered'
    CHECK (outcome IN ('answered', 'escalated', 'refused', 'error')),
  escalated_to_form BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_chat_logs_created ON support_chat_logs (created_at DESC);

-- Admin-only data: anonymous and client roles must see nothing.
ALTER TABLE support_chat_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_support_chat_logs" ON support_chat_logs;
CREATE POLICY "service_role_all_support_chat_logs" ON support_chat_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
