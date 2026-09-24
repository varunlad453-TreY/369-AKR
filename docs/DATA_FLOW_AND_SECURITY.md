# Data Flow & Security Specification

**System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
**Last Audited**: September 24, 2026  
**Status**: ACTIVE CANONICAL DATA FLOW SPECIFICATION  

---

## 1. Flow 1: Subcontractor Zero-Trust Authentication

```
[Contractor Mobile / PWA]
          │
          │ 1. Enter Vendor Code (e.g. AKR-1114)
          ▼
    POST /api/auth/vendor-login
          │
          ├─► Zod Validation (vendorCodeVerificationSchema)
          ├─► Query public.subcontractors (or mock-db.ts fallback)
          ├─► Check otp_rate_limits (Max 5 requests per 10 mins)
          ├─► Generate 6-digit cryptographic OTP & compute SHA-256 hash
          ├─► Save otp_hash in database / fallback store
          ├─► Dispatch SMS via DLT Pipeline (MSG91 / Twilio / Staging Simulator)
          ├─► Insert 'OTP_REQUESTED' into public.audit_logs
          │
          ▼ Returns HTTP 200 { maskedPhone: "+91 95526 •••••", demoOtp: "..." }
[Advance to /gateway/verify]
          │
          │ 2. Enter 6-digit OTP (or bypass 369369)
          ▼
    POST /api/auth/verify-otp
          │
          ├─► Verify OTP against SHA-256 hash or bypass token
          ├─► Check attempt counter (Max 3 attempts before lockout)
          ├─► Clear otp_hash upon success
          ├─► Insert 'OTP_VERIFIED_SUCCESS' into public.audit_logs
          ├─► Issue httpOnly akr_sub_session cookie (12-hour TTL)
          │
          ▼ Returns HTTP 200 + Set-Cookie: akr_sub_session={ id, vendorCode, ... }
[Next.js Edge Middleware: src/middleware.ts]
          │
          └─► Validates akr_sub_session before granting access to /portal/*
```

---

## 2. Flow 2: Field Proof-of-Work Upload (Online vs. Offline PWA)

```
[Subcontractor at Solar Site: /portal/job/[jobId]]
          │
          │ 1. Capture installation milestone photo
          │ 2. Browser queries satellite GPS: navigator.geolocation.getCurrentPosition()
          ▼
[Client State: job-detail-client.tsx]
          │
     Is Device Online?
    ┌─────┴───────────────────────────────────────────────────────┐
    │                                                             │
  [YES]                                                         [NO]
    │                                                             │
    ▼                                                             ▼
POST /api/jobs/[jobId]/upload                           Enqueued in IndexedDB Vault
    │                                                   Store: 'akr-sop-offline-db'
    ├─► Decode Base64 to binary Buffer                  Status: 'QUEUED'
    ├─► Upload to Supabase Storage S3                   Pill: '⚠ OFFLINE VAULT (1 QUEUED)'
    ├─► Insert metadata into public.job_documents                 │
    │   (geotag: { lat, lng, accuracy, timestamp })              ▼
    ├─► Record 'PROOF_UPLOADED' in public.audit_logs    Device Restores Signal
    │                                                             │
    ▼ Returns HTTP 201 Created                                    ▼
[UI Updates Realtime Thumbnail]                         Service Worker 'sync' Event
                                                        Flushes to /api/jobs/[jobId]/upload
```

---

## 3. Flow 3: Running Account (RA) Billing & Tax Invoice Generation

```
[Subcontractor: /portal/bills/new]
          │
          │ 1. Select Work Order & Enter Line Items (Description, HSN/SAC, UoM, Qty, Rate)
          ▼
    POST /api/bills
          │
          ├─► Validate via billCreationSchema
          ├─► SERVER-SIDE MATH RECOMPUTATION:
          │     Subtotal = SUM(Qty * Rate)
          │     CGST 9% + SGST 9% (or IGST 18%)
          │     Gross Total = Subtotal + Taxes
          │     Initial Net Payable = Gross Total (0 deductions until verified)
          ├─► Insert header into public.bills
          ├─► Insert lines atomically into public.bill_items
          ├─► Record 'BILL_SUBMITTED' in public.audit_logs
          │
          ▼ Returns HTTP 201 Created
[Finance Team Review: /admin/bills/[billId]]
          │
          │ 2. Inspect line items and contractor statutory GSTIN/PAN
          │ 3. Enter Performance Retention (e.g. 5%) and Section 194C TDS (e.g. 2%)
          ▼
    PATCH /api/bills/[billId]
          │
          ├─► Server recalculates deductions on taxable subtotal:
          │     Retention Amount = Subtotal * (Retention% / 100)
          │     TDS Amount = Subtotal * (TDS% / 100)
          │     Net Payable = Gross Total - Retention Amount - TDS Amount
          ├─► Update status to 'approved' or 'paid'
          ├─► Record 'BILL_STATUS_UPDATED' in public.audit_logs
          │
          ▼ Returns HTTP 200 OK
[Subcontractor or Admin Clicks "Download PDF"]
          │
          ▼
    GET /api/bills/[billId]/pdf
          │
          ├─► Query bill joined with jobs, subcontractors, bill_items
          ├─► Invoke generateInvoicePDF(bill) in src/lib/pdf/invoice-generator.ts
          ├─► Convert numeric Net Payable into Indian Words (Lakhs & Crores format)
          ├─► Build vector PDF layout via jsPDF & jspdf-autotable
          │
          ▼ Returns Binary Stream (Content-Disposition: attachment; filename="RA_Bill_...pdf")
```

---

## 4. Flow 4: Administrative Guarded Lifecycles

```
[Admin Dispatcher: /admin/subcontractors]
          │
          │ Click "Delete Contractor"
          ▼
    DELETE /api/subcontractors/[id]
          │
          ├─► Inspect akr_admin_session cookie (HTTP 401 if missing)
          ├─► Query public.jobs for active states:
          │     WHERE subcontractor_id = id AND status IN ('assigned', 'en_route', 'on_site', 'in_progress')
          │
     Active Projects Exist?
    ┌─────┴───────────────────────────────────────────────────────┐
    │                                                             │
  [YES]                                                         [NO]
    │                                                             │
    ▼                                                             ▼
Return HTTP 409 Conflict                                Delete from public.subcontractors
"Cannot delete: Contractor has active projects.         Record 'SUBCONTRACTOR_DELETED'
Reassign or complete those jobs first."                 in public.audit_logs
                                                        Return HTTP 200 OK
```
