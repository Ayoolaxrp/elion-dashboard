-- ============================================
-- CLIENT SETUP SCRIPT
-- Run this in Supabase SQL Editor to create
-- a client with login access
-- ============================================

-- STEP 1: Create the client record
-- Replace the values below with actual client data
DO $$
DECLARE
  client_id_val TEXT;
  org_id_val TEXT;
  auth_user_id TEXT;
BEGIN
  -- Create client record
  INSERT INTO clients (contact_name, email, company_name, plan_name, status, onboarding_status)
  VALUES (
    'John Doe',                    -- Contact name
    'john@example.com',            -- Client email (they will use this to login)
    'ABC Realty',                  -- Company name
    'growth',                      -- Plan: starter, growth, scale, custom
    'active',                      -- Status
    'completed'                    -- Onboarding status
  )
  RETURNING id INTO client_id_val;

  -- Create organization for this client
  INSERT INTO organizations (name, org_type, client_id, status)
  VALUES (
    'ABC Realty',                  -- Same as company name
    'client',
    client_id_val,
    'active'
  )
  RETURNING id INTO org_id_val;

  -- Link organization to client
  UPDATE clients SET organization_id = org_id_val WHERE id = client_id_val;

  -- NOTE: The auth user must be created via Supabase Auth UI or API
  -- After creating the auth user, run:
  -- INSERT INTO organization_memberships (user_id, organization_id, role, status)
  -- VALUES ('<AUTH_USER_ID>', org_id_val, 'owner', 'active');

  RAISE NOTICE 'Client created: %', client_id_val;
  RAISE NOTICE 'Organization created: %', org_id_val;
  RAISE NOTICE 'NOW: Create auth user for john@example.com via Supabase Auth UI';
  RAISE NOTICE 'THEN: Link auth user to organization using the org_id above';
END $$;

-- STEP 2: After creating the auth user, link them
-- Uncomment and fill in the auth user ID:
-- INSERT INTO organization_memberships (user_id, organization_id, role, status)
-- VALUES ('<PASTE_AUTH_USER_ID_HERE>', '<PASTE_ORG_ID_HERE>', 'owner', 'active');

-- STEP 3: Assign automations to the client
-- Uncomment and fill in the client_id:
-- INSERT INTO client_automations (client_id, template_id, custom_name, status)
-- SELECT
--   '<CLIENT_ID>',
--   id,
--   name,
--   'pending'
-- FROM workflow_templates
-- WHERE category IN ('lead_response', 'follow_up', 'booking');

