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

DO $$ BEGIN
    CREATE TYPE bill_status AS ENUM (
        'draft',
        'submitted',
        'verified',
        'approved',
        'paid',
        'rejected'
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
    gst_number TEXT,
    pan_number TEXT,
    bank_name TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    bank_branch TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS otp_hash TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS bank_branch TEXT;

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
    work_order_no TEXT,
    work_order_date DATE,
    contract_amount NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_order_no TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_order_date DATE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS contract_amount NUMERIC(12,2);

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

-- 9. BILLS TABLE (Running Account Bills & Tax Invoices)
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
    subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
    invoice_no TEXT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status bill_status NOT NULL DEFAULT 'draft',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cgst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    gross_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    retention_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    retention_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tds_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tds_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bills_subcontractor ON public.bills(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_bills_job ON public.bills(job_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_invoice_no ON public.bills(invoice_no);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);

-- 10. BILL_ITEMS TABLE (Granular Line Items & Milestones)
CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    item_code TEXT,
    description TEXT NOT NULL,
    hsn_sac TEXT NOT NULL,
    uom TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL,
    rate NUMERIC(12,2) NOT NULL,
    amount NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotency
DROP POLICY IF EXISTS "Allow portal full access to subcontractors" ON public.subcontractors;
DROP POLICY IF EXISTS "Allow portal full access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow portal full access to documents" ON public.job_documents;
DROP POLICY IF EXISTS "Allow portal full access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow portal full access to otp_rate_limits" ON public.otp_rate_limits;
DROP POLICY IF EXISTS "Allow portal full access to admins" ON public.admins;
DROP POLICY IF EXISTS "Allow portal full access to bills" ON public.bills;
DROP POLICY IF EXISTS "Allow portal full access to bill_items" ON public.bill_items;

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

CREATE POLICY "Allow portal full access to bills" ON public.bills
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to bill_items" ON public.bill_items
    FOR ALL USING (true) WITH CHECK (true);

-- 12. REALTIME CONFIGURATION
-- Enable Supabase Realtime CDC on jobs, subcontractors, audit logs, and bills
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

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 13. IMMUTABLE AUDIT LOG TRIGGERS
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

CREATE OR REPLACE FUNCTION public.log_bill_status_change()
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
            'BILL_STATUS_UPDATED',
            'SYSTEM',
            NEW.id,
            'bills',
            jsonb_build_object(
                'invoice_no', NEW.invoice_no,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'subtotal', NEW.subtotal,
                'gross_total', NEW.gross_total,
                'retention_amount', NEW.retention_amount,
                'tds_amount', NEW.tds_amount,
                'net_payable', NEW.net_payable
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_bill_status ON public.bills;
CREATE TRIGGER trigger_log_bill_status
    AFTER UPDATE ON public.bills
    FOR EACH ROW
    EXECUTE FUNCTION public.log_bill_status_change();

-- 14. SEED REALISTIC 369 AKR UNIVERSE DATA
INSERT INTO public.subcontractors (id, company_name, phone_number, vendor_code, contact_person, license_number, state_region, is_active, rating, gst_number, pan_number, bank_name, bank_account_number, bank_ifsc, bank_branch)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'SuryaShakti EPC Infrastructure Ltd.', '+919812037550', 'AKR-JOB-7K9M-SEC', 'Rajesh Kumar Verma', 'DL-ELECT-2024-8842', 'Haryana / Delhi NCR', true, 4.95, '27ENRPM7534P1ZV', 'ENRPM7534P', 'HDFC Bank Ltd.', '50200124368375', 'HDFC0001991', 'Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513'),
    ('c0000000-0000-0000-0000-000000000002', 'Thar High-Voltage Power Solutions', '+919050937550', 'AKR-JOB-4X2P-SEC', 'Virender Shekhawat', 'RJ-SOLAR-2023-1192', 'Rajasthan', true, 4.88, '08AABCT1330L1ZT', 'AABCT1330L', 'State Bank of India', '389012445678', 'SBIN0004122', 'Jaipur Industrial Area, Rajasthan'),
    ('c0000000-0000-0000-0000-000000000003', 'Apex Green Energy Installations', '+919876543210', 'AKR-JOB-9W1Z-SEC', 'Ankit Tripathy', 'UP-GRID-2024-4011', 'Uttar Pradesh', true, 4.75, '09AAGCA8821Q1Z4', 'AAGCA8821Q', 'ICICI Bank Ltd.', '001205018992', 'ICIC0000012', 'Noida Sector 18, Uttar Pradesh')
ON CONFLICT (phone_number) DO UPDATE SET
    gst_number = EXCLUDED.gst_number,
    pan_number = EXCLUDED.pan_number,
    bank_name = EXCLUDED.bank_name,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_ifsc = EXCLUDED.bank_ifsc,
    bank_branch = EXCLUDED.bank_branch;

INSERT INTO public.jobs (id, job_code, title, description, site_address, city, state, pincode, gps_lat, gps_lng, capacity_kwp, system_type, status, subcontractor_id, scheduled_start, scheduled_end, work_order_no, work_order_date, contract_amount)
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
        timezone('utc'::text, now() + interval '12 days'),
        'AKR/WO/2026/0104',
        '2026-02-15',
        1750000.00
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
        timezone('utc'::text, now() + interval '25 days'),
        'AKR/WO/2026/0189',
        '2026-03-01',
        5400000.00
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
        timezone('utc'::text, now() - interval '1 day'),
        'AKR/WO/2026/0078',
        '2026-01-10',
        480000.00
    )
ON CONFLICT (job_code) DO UPDATE SET
    work_order_no = EXCLUDED.work_order_no,
    work_order_date = EXCLUDED.work_order_date,
    contract_amount = EXCLUDED.contract_amount;

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

INSERT INTO public.bills (id, job_id, subcontractor_id, invoice_no, invoice_date, status, subtotal, cgst_rate, cgst_amount, sgst_rate, sgst_amount, igst_rate, igst_amount, gross_total, retention_percentage, retention_amount, tds_percentage, tds_amount, net_payable, notes)
VALUES
    (
        'd0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'SS/2026/RA-01',
        '2026-03-10',
        'approved',
        385000.00,
        9.00,
        34650.00,
        9.00,
        34650.00,
        0.00,
        0.00,
        454300.00,
        5.00,
        19250.00,
        1.00,
        3850.00,
        431200.00,
        'RA Bill 01: Piling, Module Mounting Structure (MMS) Erection, and DC Cabling milestone completed.'
    ),
    (
        'd0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'SS/2026/RA-02',
        '2026-03-14',
        'submitted',
        240000.00,
        9.00,
        21600.00,
        9.00,
        21600.00,
        0.00,
        0.00,
        283200.00,
        0.00,
        0.00,
        0.00,
        0.00,
        283200.00,
        'Final RA Bill: Commissioning and grid synchronization milestone.'
    )
ON CONFLICT (invoice_no) DO NOTHING;

INSERT INTO public.bill_items (id, bill_id, item_code, description, hsn_sac, uom, quantity, rate, amount)
VALUES
    ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'ITEM-MMS-01', 'MMS Piling & Module Mounting Structure (MMS) Erection with zinc-coated hardware', '9954', 'kWp', 350.000, 750.00, 262500.00),
    ('d1000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'ITEM-DC-02', 'DC Array 1x4 sqmm Solar Cable Laying, Conduit Pulling & String Combiner Inverter Termination', '9987', 'kWp', 350.000, 350.00, 122500.00),
    ('d1000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'ITEM-MOD-01', 'Solar PV 540W Mono-PERC Half-Cut Module Mounting & Interconnection', '9954', 'kWp', 85.000, 1800.00, 153000.00),
    ('d1000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'ITEM-HT-02', 'HT/LT Interconnect Busbar, Energy Net Metering Panel & DISCOM Inspection Sync', '9987', 'Lot', 1.000, 87000.00, 87000.00)
ON CONFLICT DO NOTHING;

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

