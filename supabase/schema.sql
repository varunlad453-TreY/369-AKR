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
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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
    capacity_kwp NUMERIC(8,2) NOT NULL, -- e.g. 150.50 kWp
    system_type TEXT NOT NULL DEFAULT 'Rooftop Commercial & Industrial',
    status job_status NOT NULL DEFAULT 'assigned',
    subcontractor_id UUID REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
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
    storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
    uploaded_by UUID NOT NULL,
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
    actor_id UUID,
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

-- Admins full access policy (checks if auth.uid() exists in admins table)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Subcontractor identity verification
CREATE OR REPLACE FUNCTION public.get_subcontractor_id()
RETURNS UUID AS $$
DECLARE
    sub_id UUID;
BEGIN
    SELECT id INTO sub_id FROM public.subcontractors WHERE auth_user_id = auth.uid();
    RETURN sub_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins RLS
CREATE POLICY "Admins full access to admins" ON public.admins
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access to subcontractors" ON public.subcontractors
    FOR ALL USING (public.is_admin());

CREATE POLICY "Subcontractors can view their own profile" ON public.subcontractors
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins full access to jobs" ON public.jobs
    FOR ALL USING (public.is_admin());

CREATE POLICY "Subcontractors can view their assigned jobs" ON public.jobs
    FOR SELECT USING (subcontractor_id = public.get_subcontractor_id());

CREATE POLICY "Subcontractors can update their assigned job status" ON public.jobs
    FOR UPDATE USING (subcontractor_id = public.get_subcontractor_id())
    WITH CHECK (subcontractor_id = public.get_subcontractor_id());

CREATE POLICY "Admins full access to job documents" ON public.job_documents
    FOR ALL USING (public.is_admin());

CREATE POLICY "Subcontractors can view documents of assigned jobs" ON public.job_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_documents.job_id
            AND jobs.subcontractor_id = public.get_subcontractor_id()
        )
    );

CREATE POLICY "Subcontractors can upload documents to assigned jobs" ON public.job_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_documents.job_id
            AND jobs.subcontractor_id = public.get_subcontractor_id()
        )
    );

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- 10. IMMUTABLE AUDIT LOG TRIGGER
CREATE OR REPLACE FUNCTION public.log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.audit_logs (
            action,
            actor_id,
            actor_type,
            resource_id,
            resource_type,
            metadata
        ) VALUES (
            'JOB_STATUS_UPDATED',
            auth.uid(),
            CASE WHEN public.is_admin() THEN 'ADMIN' ELSE 'SUBCONTRACTOR' END,
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

CREATE OR REPLACE TRIGGER trigger_log_job_status
    AFTER UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.log_job_status_change();
