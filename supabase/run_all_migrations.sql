-- =====================================================
-- ELION — COMBINED MIGRATION 002-006
-- Run this in Supabase SQL Editor
-- All tables use IF NOT EXISTS so safe to re-run
-- =====================================================

-- First ensure the leads table exists (from 001)
-- If 001 was already run, skip this block
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads') THEN
    CREATE TABLE leads (
      id TEXT PRIMARY KEY DEFAULT ('lead_' || gen_random_uuid()::text),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      company_name TEXT NOT NULL DEFAULT 'Not specified',
      website TEXT,
      industry TEXT,
      company_size TEXT,
      primary_problem TEXT,
      current_process TEXT,
      desired_outcome TEXT,
      enquiry_channels TEXT,
      source TEXT DEFAULT 'funnel',
      status TEXT DEFAULT 'new',
      notes TEXT,
      data JSONB DEFAULT '{}'::jsonb
    );
  END IF;
END $$;

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 017_lead_archive.sql — soft archive for leads (kept idempotent)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS leads_archived_at_idx ON public.leads (archived_at)
  WHERE archived_at IS NOT NULL;
