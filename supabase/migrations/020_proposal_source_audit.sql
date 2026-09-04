-- 020: proposals.source_audit_id — trace a proposal back to the audit it was created from.
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS source_audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_source_audit ON proposals(source_audit_id);