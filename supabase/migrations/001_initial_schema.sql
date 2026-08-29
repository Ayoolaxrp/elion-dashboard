-- ELION Database Schema for Supabase PostgreSQL
-- Run this in the Supabase SQL Editor to create all tables

-- =====================================================
-- LEADS TABLE
-- Core lead/contact records from funnel submissions
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT ('lead_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contact info
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,

  -- Business info
  company_name TEXT NOT NULL DEFAULT 'Not specified',
  website TEXT,
  industry TEXT,
  company_size TEXT,

  -- Qualification
  primary_problem TEXT,
  current_process TEXT,
  desired_outcome TEXT,
  enquiry_channels TEXT,

  -- Status tracking
  audit_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (audit_status IN ('pending', 'processing', 'completed', 'failed')),
  lead_status TEXT NOT NULL DEFAULT 'new'
    CHECK (lead_status IN ('new', 'audited', 'contacted', 'qualified', 'proposal', 'payment_pending', 'paid', 'implementation', 'completed', 'lost')),

  -- Source tracking
  source TEXT DEFAULT 'funnel',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Downstream status
  n8n_status TEXT DEFAULT 'not_sent'
    CHECK (n8n_status IN ('not_sent', 'sent', 'failed')),
  email_status TEXT DEFAULT 'not_sent',
  crm_status TEXT DEFAULT 'not_synced',
  whatsapp_status TEXT DEFAULT 'not_sent'
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- =====================================================
-- AUDITS TABLE
-- Audit results associated with leads
-- =====================================================
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY DEFAULT ('audit_' || gen_random_uuid()::text),
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Audit input
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,

  -- Audit output
  overall_score INTEGER,
  leak_count INTEGER DEFAULT 0,
  critical_leaks INTEGER DEFAULT 0,
  high_leaks INTEGER DEFAULT 0,
  summary TEXT,

  -- Structured findings (JSON for flexibility)
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_audits_lead ON audits(lead_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- =====================================================
-- PAYMENTS TABLE
-- Payment records for implementation requests
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT ('payment_' || gen_random_uuid()::text),
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  amount INTEGER NOT NULL, -- in kobo (NGN * 100)
  currency TEXT NOT NULL DEFAULT 'NGN',
  description TEXT,

  -- Paystack
  paystack_ref TEXT,
  paystack_status TEXT DEFAULT 'pending'
    CHECK (paystack_status IN ('pending', 'success', 'failed', 'abandoned')),

  -- General status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'refunded')),

  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payments_lead ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- =====================================================
-- ACTIVITY LOG
-- Audit trail for lead lifecycle events
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  performed_by TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(event_type);

-- =====================================================
-- AUTO-UPDATE updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Leads: public can INSERT only (via funnel), admin can read/update
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous INSERT for funnel submissions
CREATE POLICY "allow_funnel_insert" ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role can do everything (used by API routes)
CREATE POLICY "service_role_all" ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Audits: public can INSERT only, admin can read
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_audit_insert" ON audits
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "service_role_all" ON audits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Payments: service role only
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Activity log: service role only
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON activity_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
