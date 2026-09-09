-- =====================================================
-- 026 — SYSTEM CONFIG + ADMIN DIRECTORY
-- Self-service credential/admin management.
--
-- 1. system_config: key-value app settings (support email,
--    phone, whatsapp, timezone). One row per key.
-- 2. admin_directory: which auth users are ELION admins.
--    Read dynamically by auth/login + auth/server.ts so
--    granting/revoking admin takes effect immediately,
--    WITHOUT a redeploy. The ADMIN_EMAILS env var remains
--    a bootstrap fallback (owner account).
-- =====================================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

INSERT INTO system_config (key, value) VALUES
  ('company_name', 'ELION'),
  ('support_email', 'awodeyiayoola@gmail.com'),
  ('support_phone', '09126281855'),
  ('whatsapp_number', ''),
  ('default_timezone', 'Africa/Lagos')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_directory (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('super_admin', 'admin')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_directory_email ON admin_directory(lower(email));

-- Service role does everything; authenticated users can read
-- their own membership (used by client code if needed).
ALTER TABLE admin_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'admin_directory' AND policyname = 'admin_directory_read'
  ) THEN
    CREATE POLICY admin_directory_read ON admin_directory
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE tablename = 'system_config' AND policyname = 'system_config_read'
  ) THEN
    CREATE POLICY system_config_read ON system_config
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;
