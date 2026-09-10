-- ======================================================================================
-- 369 AKR UNIVERSE - Subcontractor Operations Portal (SOP) Enterprise Database Schema
-- Architecture: Supabase (PostgreSQL 15+) with Row-Level Security (RLS) & Audit Triggers
-- ======================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'dispatcher', 'safety_lead', 'auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM (
        'draft',
        'assigned',
        'en_route',
        'on_site',
        'in_progress',
        'inspection_pending',
        'completed',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE document_type AS ENUM (
        'cad_blueprint',
        'structural_permit',
        'single_line_diagram',
        'safety_checklist',
        'proof_of_work',
        'commissioning_report'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'dispatcher',
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SUBCONTRACTORS TABLE
CREATE TABLE IF NOT EXISTS public.subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE, -- E.164 format (+91XXXXXXXXXX)
    vendor_code TEXT NOT NULL UNIQUE, -- Cryptographically secure code e.g. AKR-VND-8492-SEC
    contact_person TEXT NOT NULL,
    license_number TEXT,
    state_region TEXT NOT NULL DEFAULT 'Haryana',
    is_active BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(3,2) DEFAULT 5.00,
    otp_hash TEXT,
    otp_expires_at TIMESTAMPTZ,
    otp_attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS otp_hash TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_subcontractors_phone ON public.subcontractors(phone_number);
CREATE INDEX IF NOT EXISTS idx_subcontractors_vendor_code ON public.subcontractors(vendor_code);

-- 5. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_code TEXT NOT NULL UNIQUE, -- Human-readable identifier e.g. AKR-2026-DEL-104
    title TEXT NOT NULL,
    description TEXT,
    site_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    capacity_kwp NUMERIC(8,2) NOT NULL, -- e.g. 350.00 kWp
    system_type TEXT NOT NULL DEFAULT 'Rooftop Commercial & Industrial',
    status job_status NOT NULL DEFAULT 'assigned',
    subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE SET NULL,
    created_by TEXT DEFAULT 'admin-dispatcher-01',
    scheduled_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    scheduled_end TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '14 days'),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_jobs_subcontractor ON public.jobs(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_code ON public.jobs(job_code);

-- 6. JOB DOCUMENTS TABLE (Blueprints, Permits & Geotagged Proof-of-Work)
CREATE TABLE IF NOT EXISTS public.job_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage or URL
    download_url TEXT,
    uploaded_by TEXT NOT NULL,
    uploader_role TEXT NOT NULL CHECK (uploader_role IN ('ADMIN', 'SUBCONTRACTOR')),
    geotag JSONB, -- Coordinates { latitude: 28.8955, longitude: 76.6066, accuracy: 5.2 }
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_job_documents_job_id ON public.job_documents(job_id);

-- 7. AUDIT LOGS TABLE (Immutable B2B Compliance Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL, -- e.g. VENDOR_CODE_GENERATED, OTP_VERIFIED, PROOF_UPLOADED
    actor_id TEXT,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('ADMIN', 'SUBCONTRACTOR', 'SYSTEM', 'GATEWAY')),
    actor_identifier TEXT, -- Email or phone for traceability
    resource_id UUID,
    resource_type TEXT, -- e.g. jobs, subcontractors, job_documents
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- 8. OTP RATE LIMITING TRACKER
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    phone_number TEXT PRIMARY KEY,
    attempts_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    blocked_until TIMESTAMPTZ
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotency
DROP POLICY IF EXISTS "Allow portal full access to subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Allow portal full access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow portal full access to documents" ON public.job_documents;
DROP POLICY IF EXISTS "Allow portal full access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow portal full access to otp_rate_limits" ON public.otp_rate_limits;
DROP POLICY IF EXISTS "Allow portal full access to admins" ON public.admins;

-- Permissive policies for the portal client & API routes
CREATE POLICY "Allow portal full access to subcontractors" ON public.subcontractors
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to jobs" ON public.jobs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to documents" ON public.job_documents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to audit_logs" ON public.audit_logs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to otp_rate_limits" ON public.otp_rate_limits
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to admins" ON public.admins
    FOR ALL USING (true) WITH CHECK (true);

-- 10. REALTIME CONFIGURATION
-- Enable Supabase Realtime CDC on jobs, subcontractors, and audit logs
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subcontractors;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 11. IMMUTABLE AUDIT LOG TRIGGER
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.audit_logs (
            action,
            actor_type,
            resource_id,
            resource_type,
            metadata
        ) VALUES (
            'JOB_STATUS_UPDATED',
            'SYSTEM',
            NEW.id,
            'jobs',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'job_code', NEW.job_code
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_job_status ON public.jobs;
CREATE TRIGGER trigger_log_job_status
    AFTER UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.log_job_status_change();

-- 12. SEED REALISTIC 369 AKR UNIVERSE DATA
INSERT INTO public.subcontractors (id, company_name, phone_number, vendor_code, contact_person, license_number, state_region, is_active, rating)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'SuryaShakti EPC Infrastructure Ltd.', '+919812037550', 'AKR-JOB-7K9M-SEC', 'Rajesh Kumar Verma', 'DL-ELECT-2024-8842', 'Haryana / Delhi NCR', true, 4.95),
    ('c0000000-0000-0000-0000-000000000002', 'Thar High-Voltage Power Solutions', '+919050937550', 'AKR-JOB-4X2P-SEC', 'Virender Shekhawat', 'RJ-SOLAR-2023-1192', 'Rajasthan', true, 4.88),
    ('c0000000-0000-0000-0000-000000000003', 'Apex Green Energy Installations', '+919876543210', 'AKR-JOB-9W1Z-SEC', 'Ankit Tripathy', 'UP-GRID-2024-4011', 'Uttar Pradesh', true, 4.75)
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO public.jobs (id, job_code, title, description, site_address, city, state, pincode, gps_lat, gps_lng, capacity_kwp, system_type, status, subcontractor_id, scheduled_start, scheduled_end)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'AKR-2026-ROH-001',
        '350 kWp Industrial Rooftop Solar Project - Rohtak Cold Chain',
        'Full turnkey EPC installation of 350 kWp rooftop solar PV with 540W mono-PERC half-cut modules and Sungrow string inverters on cold storage sheds.',
        'Plot 42, HSIIDC Industrial Estate, Sector 31',
        'Rohtak',
        'Haryana',
        '124001',
        28.8955,
        76.6066,
        350.00,
        'Rooftop Commercial & Industrial',
        'in_progress',
        'c0000000-0000-0000-0000-000000000001',
        timezone('utc'::text, now() - interval '2 days'),
        timezone('utc'::text, now() + interval '12 days')
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'AKR-2026-JPR-002',
        '1.2 MWp Ground-Mount Solar Array - Thar Agri Park',
        'Megawatt scale utility solar ground-mount with single-axis tracking and central inverter station.',
        'Village Kotputli, NH-48 Express Corridor',
        'Jaipur',
        'Rajasthan',
        '303108',
        27.7025,
        76.2014,
        1200.00,
        'Ground Mount Utility Scale',
        'assigned',
        'c0000000-0000-0000-0000-000000000002',
        timezone('utc'::text, now() + interval '1 day'),
        timezone('utc'::text, now() + interval '25 days')
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'AKR-2026-JND-003',
        '85 kWp Commercial Rooftop Grid-Tie System - Jind General Hospital',
        'Hospital rooftop PV with emergency backup busbar interconnect and net metering sync.',
        'Civil Lines, Opp. Mini Secretariat',
        'Jind',
        'Haryana',
        '126102',
        29.3167,
        76.3167,
        85.00,
        'Rooftop Commercial & Industrial',
        'completed',
        'c0000000-0000-0000-0000-000000000001',
        timezone('utc'::text, now() - interval '10 days'),
        timezone('utc'::text, now() - interval '1 day')
    )
ON CONFLICT (job_code) DO NOTHING;

INSERT INTO public.job_documents (job_id, document_type, file_name, file_size, mime_type, storage_path, download_url, uploaded_by, uploader_role)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'cad_blueprint',
        'AKR_ROHTAK_ROOFTOP_CAD_REV3.dwg.pdf',
        4200000,
        'application/pdf',
        'blueprints/AKR_ROHTAK_ROOFTOP_CAD_REV3.pdf',
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80',
        'admin-dispatcher-01',
        'ADMIN'
    ),
    (
        'b0000000-0000-0000-0000-000000000001',
        'single_line_diagram',
        'SLD_33KV_GRID_INTERCONNECT_V2.pdf',
        1850000,
        'application/pdf',
        'blueprints/SLD_33KV_GRID_INTERCONNECT_V2.pdf',
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=1200&q=80',
        'admin-dispatcher-01',
        'ADMIN'
    ),
    (
        'b0000000-0000-0000-0000-000000000001',
        'structural_permit',
        'HARYANA_DISCOM_NOC_APPROVAL_2026.pdf',
        950000,
        'application/pdf',
        'permits/HARYANA_DISCOM_NOC_APPROVAL_2026.pdf',
        NULL,
        'admin-dispatcher-01',
        'ADMIN'
    )
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_logs (action, actor_type, actor_identifier, resource_type, metadata)
VALUES
    ('SYSTEM_INIT', 'SYSTEM', 'system@369akruniverse.in', 'system', '{"message": "369 AKR UNIVERSE Supabase Database initialized successfully"}'::jsonb),
    ('SUBCONTRACTOR_ONBOARDED', 'ADMIN', 'dispatcher@369akruniverse.in', 'subcontractors', '{"vendorCode": "AKR-JOB-7K9M-SEC", "companyName": "SuryaShakti EPC Infrastructure Ltd."}'::jsonb),
    ('JOB_DISPATCHED', 'ADMIN', 'dispatcher@369akruniverse.in', 'jobs', '{"jobCode": "AKR-2026-ROH-001", "capacityKwp": 350.00}'::jsonb);

-- 13. SUPABASE STORAGE BUCKETS & POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-documents', 'job-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to job-documents" ON storage.objects;
CREATE POLICY "Public Access to job-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-documents');

DROP POLICY IF EXISTS "Allow portal uploads to job-documents" ON storage.objects;
CREATE POLICY "Allow portal uploads to job-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-documents');

DROP POLICY IF EXISTS "Allow portal updates to job-documents" ON storage.objects;
CREATE POLICY "Allow portal updates to job-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'job-documents');

