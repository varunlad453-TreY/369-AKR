-- ======================================================================================
-- 369 AKR UNIVERSE - SOP: Running Account (RA) Billing & Tax Invoice Migration
-- Migration Script: 20260918_ra_billing_and_tax_invoices.sql
-- Compatible with PostgreSQL 15+ & Supabase RLS / Realtime CDC
-- ======================================================================================

-- 1. EXTEND SUBCONTRACTORS TABLE (Statutory GST, PAN & Disbursement Bank Coordinates)
ALTER TABLE public.subcontractors 
    ADD COLUMN IF NOT EXISTS gst_number TEXT,
    ADD COLUMN IF NOT EXISTS pan_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_name TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
    ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
    ADD COLUMN IF NOT EXISTS bank_branch TEXT;

-- 2. EXTEND JOBS TABLE (Work Order References & Contract Values)
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS work_order_no TEXT,
    ADD COLUMN IF NOT EXISTS work_order_date DATE,
    ADD COLUMN IF NOT EXISTS contract_amount NUMERIC(12,2);

-- 3. CREATE BILL STATUS ENUM
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

-- 4. CREATE BILLS TABLE (Header for Tax Invoices & RA Bills)
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

-- Indexes for Bills Table
CREATE INDEX IF NOT EXISTS idx_bills_subcontractor ON public.bills(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_bills_job ON public.bills(job_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_invoice_no ON public.bills(invoice_no);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);

-- 5. CREATE BILL_ITEMS TABLE (Granular Line Items & Milestones)
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

-- Index for Bill Items
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Allow portal full access to bills" ON public.bills;
DROP POLICY IF EXISTS "Allow portal full access to bill_items" ON public.bill_items;
DROP POLICY IF EXISTS "Subcontractors can view own bills" ON public.bills;
DROP POLICY IF EXISTS "Subcontractors can insert own bills" ON public.bills;
DROP POLICY IF EXISTS "Subcontractors can update own draft bills" ON public.bills;
DROP POLICY IF EXISTS "Users can access bill_items through bills" ON public.bill_items;

-- Permissive policies for server route handlers and verified portal operations
CREATE POLICY "Allow portal full access to bills" ON public.bills
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow portal full access to bill_items" ON public.bill_items
    FOR ALL USING (true) WITH CHECK (true);

-- 7. REALTIME CDC PUBLICATION
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. AUDIT LOG TRIGGER FOR STATUS CHANGES
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

-- 9. POPULATE INITIAL STATUTORY DATA ON EXISTING SEED CONTRACTORS & JOBS
UPDATE public.subcontractors
SET
    gst_number = '27ENRPM7534P1ZV',
    pan_number = 'ENRPM7534P',
    bank_name = 'HDFC Bank Ltd.',
    bank_account_number = '50200124368375',
    bank_ifsc = 'HDFC0001991',
    bank_branch = 'Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513'
WHERE id = 'c0000000-0000-0000-0000-000000000001' AND gst_number IS NULL;

UPDATE public.subcontractors
SET
    gst_number = '08AABCT1330L1ZT',
    pan_number = 'AABCT1330L',
    bank_name = 'State Bank of India',
    bank_account_number = '389012445678',
    bank_ifsc = 'SBIN0004122',
    bank_branch = 'Jaipur Industrial Area, Rajasthan'
WHERE id = 'c0000000-0000-0000-0000-000000000002' AND gst_number IS NULL;

UPDATE public.subcontractors
SET
    gst_number = '09AAGCA8821Q1Z4',
    pan_number = 'AAGCA8821Q',
    bank_name = 'ICICI Bank Ltd.',
    bank_account_number = '001205018992',
    bank_ifsc = 'ICIC0000012',
    bank_branch = 'Noida Sector 18, Uttar Pradesh'
WHERE id = 'c0000000-0000-0000-0000-000000000003' AND gst_number IS NULL;

UPDATE public.jobs
SET
    work_order_no = 'AKR/WO/2026/0104',
    work_order_date = '2026-02-15',
    contract_amount = 1750000.00
WHERE id = 'b0000000-0000-0000-0000-000000000001' AND work_order_no IS NULL;

UPDATE public.jobs
SET
    work_order_no = 'AKR/WO/2026/0189',
    work_order_date = '2026-03-01',
    contract_amount = 5400000.00
WHERE id = 'b0000000-0000-0000-0000-000000000002' AND work_order_no IS NULL;

UPDATE public.jobs
SET
    work_order_no = 'AKR/WO/2026/0078',
    work_order_date = '2026-01-10',
    contract_amount = 480000.00
WHERE id = 'b0000000-0000-0000-0000-000000000003' AND work_order_no IS NULL;

-- 10. SEED SAMPLE REALISTIC RA BILLS & TAX INVOICES
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
