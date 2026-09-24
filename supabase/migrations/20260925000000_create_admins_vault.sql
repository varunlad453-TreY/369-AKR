-- ======================================================================================
-- 369 AKR UNIVERSE - Subcontractor Operations Portal (SOP)
-- Migration: Create Admin Identity Vault & Cryptographic Authentication Table
-- File: supabase/migrations/20260925000000_create_admins_vault.sql
-- ======================================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the system_admins identity vault table
CREATE TABLE IF NOT EXISTS public.system_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Case-insensitive unique index for high-velocity lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_admins_username_lower 
    ON public.system_admins (lower(username));

-- Comment on table and columns for enterprise cataloging
COMMENT ON TABLE public.system_admins IS '369 AKR UNIVERSE Admin Identity Vault storing cryptographic password hashes for privileged administrators and dispatch leads.';
COMMENT ON COLUMN public.system_admins.id IS 'Unique identifier for the administrator.';
COMMENT ON COLUMN public.system_admins.username IS 'Unique administrative login identifier or email address.';
COMMENT ON COLUMN public.system_admins.password_hash IS 'Cryptographically secure bcryptjs password hash (cost factor 12).';
COMMENT ON COLUMN public.system_admins.role IS 'RBAC administrative role (e.g. super_admin, dispatcher, safety_lead, auditor).';
COMMENT ON COLUMN public.system_admins.last_login IS 'Timestamp of the most recent successful administrative authentication.';

-- 3. Row-Level Security (RLS) Lockdown
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

-- Deny ALL access to public, anon, and standard authenticated users.
-- Only the privileged backend API running under service_role can access this vault.
DROP POLICY IF EXISTS "Deny all public access to system_admins" ON public.system_admins;
CREATE POLICY "Deny all public access to system_admins"
    ON public.system_admins
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);

-- Defense-in-depth: explicitly revoke table permissions from anon & authenticated roles
REVOKE ALL ON TABLE public.system_admins FROM anon, authenticated, public;
GRANT ALL ON TABLE public.system_admins TO service_role;

-- 4. Seed initial SuperAdmin account
-- Password: SuperAdmin@369!
-- Algorithm: bcryptjs (12 salt rounds)
-- Generated Hash: $2b$12$ftooAlgDWp8Sjg7mgflAMeqecymU9OGUA1LjI6M0w3ry6SfPUp50K
INSERT INTO public.system_admins (
    id,
    username,
    password_hash,
    role,
    last_login,
    created_at,
    updated_at
)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'superadmin',
    '$2b$12$ftooAlgDWp8Sjg7mgflAMeqecymU9OGUA1LjI6M0w3ry6SfPUp50K',
    'super_admin',
    NULL,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
)
ON CONFLICT (username) DO NOTHING;
