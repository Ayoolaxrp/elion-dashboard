-- Add onboarding form data column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_form_data JSONB DEFAULT NULL;

-- Add onboarding email sent tracking
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_email_sent BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_email_sent_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;
