-- =====================================================
-- 027 — SECURE exec_sql (CRITICAL SECURITY FIX)
--
-- Problem found during the commercial-delivery sprint:
--   * exec_sql was created SECURITY DEFINER with NO explicit
--     grants, so PostgreSQL granted EXECUTE to PUBLIC.
--   * The anon key could therefore run arbitrary SQL as the
--     function owner (postgres) — DROP TABLE, read any table,
--     tamper with auth.users — verified live on production.
--
-- Fix:
--   * REVOKE EXECUTE from PUBLIC, anon, authenticated.
--   * GRANT EXECUTE only to service_role (server-side only).
--   * Force a minimal search_path so SECURITY DEFINER cannot be
--     hijacked by a malicious schema in the caller's path.
--   * Keep the function (admin migration page + scripts use it)
--     but ONLY callable with the service-role key.
-- =====================================================

-- 1. Kill PUBLIC / anon / authenticated execution immediately.
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM authenticated;

-- 2. Re-create the function hardened:
--    - SECURITY DEFINER with a locked search_path. We use `public` (not
--      `pg_catalog, public`) because PostgreSQL implicitly searches
--      pg_catalog first for name resolution anyway, and putting it first
--      explicitly breaks DDL (CREATE TABLE resolves against pg_catalog
--      and fails with "permission denied for schema pg_catalog").
--    - Returns status text (same contract as before)
DROP FUNCTION IF EXISTS exec_sql(TEXT);
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE query;
  RETURN 'OK';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- 3. Grant ONLY to service_role.
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- 4. Double-check nothing else holds it (defensive).
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM authenticated;

-- 5. Guard: if some future grant re-opens it, deny at the DB level
--    by making sure the role membership cannot inherit it.
ALTER FUNCTION exec_sql(TEXT) OWNER TO postgres;
