# API Reference Specification

**System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
**Base URL**: `http://localhost:3000` (Local) / `https://369akruniverse.com` (Production)  
**Data Format**: JSON (`Content-Type: application/json`)  
**Last Audited**: September 24, 2026  
**Status**: ACTIVE CANONICAL SPECIFICATION (18 Route Files · 23 Implemented Endpoints)  

---

## 1. Authentication & Session Gateway

### 1.1 Vendor Code Login (Step 1)
- **Endpoint**: `POST /api/auth/vendor-login`
- **Access**: Public (Subject to IP & Phone Rate-Limiting: Max 5 attempts per 10 minutes)
- **Description**: Validates assigned contractor Vendor Code against Supabase `public.subcontractors` (with fallback to `mock-db.ts`), checks brute-force rate limit, generates a 6-digit dynamic cryptographic OTP, saves OTP hash, and dispatches via DLT SMS engine.
- **Request Body**:
  ```json
  {
    "vendorCode": "AKR-1114"
  }
  ```
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "session": {
      "vendorCode": "AKR-1114",
      "maskedPhone": "+91 95526 •••••",
      "expiresAt": "2026-09-24T18:30:00.000Z",
      "demoOtp": "492018"
    }
  }
  ```
- **Error Responses**:
  - `HTTP 400 Bad Request`: Validation failure (Vendor Code < 6 chars or invalid characters).
  - `HTTP 403 Forbidden`: Vendor Code not found or inactive in database.
  - `HTTP 429 Too Many Requests`: Rate limit reached. Returns `retryAfterSeconds`.

---

### 1.2 OTP Verification (Step 2)
- **Endpoint**: `POST /api/auth/verify-otp`
- **Access**: Public
- **Description**: Verifies the submitted 6-digit OTP against the stored SHA-256 hash or evaluates the master staging bypass token (`369369`). Enforces a 3-attempt lockout. On success, issues the `akr_sub_session` cookie.
- **Request Body**:
  ```json
  {
    "vendorCode": "AKR-1114",
    "otp": "369369"
  }
  ```
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "subcontractor": {
      "id": "c0000000-0000-0000-0000-000000000001",
      "companyName": "Swarajya Construction and Developers",
      "phoneNumber": "+919552628232",
      "vendorCode": "AKR-1114",
      "contactPerson": "Yogesh Dnyaneshwar Magar",
      "licenseNumber": "MH-EPC-2023-15908",
      "stateRegion": "Maharashtra",
      "isActive": true,
      "rating": 5.0,
      "createdAt": "2025-01-10T08:00:00Z"
    },
    "redirectUrl": "/portal"
  }
  ```
- **Set-Cookie Header**: `akr_sub_session={...}; Path=/; Max-Age=43200; HttpOnly; SameSite=Lax`
- **Error Responses**:
  - `HTTP 401 Unauthorized`: Invalid code, expired OTP, or maximum 3 attempts exceeded.

---

### 1.3 Admin Credential Login
- **Endpoint**: `POST /api/auth/admin-login`
- **Access**: Public (Admin Gateway)
- **Description**: Verifies email and password directly against `public.admins` in Supabase (or in-memory seed). Bypasses Supabase Auth client SDK to avoid unconfirmed email blocks on internal corporate domains. Sets `akr_admin_session` cookie.
- **Request Body**:
  ```json
  {
    "email": "dispatcher@369akruniverse.in",
    "password": "Admin@369AKR!"
  }
  ```
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "admin": {
      "email": "dispatcher@369akruniverse.in",
      "fullName": "AKR Chief Dispatcher",
      "role": "super_admin"
    }
  }
  ```
- **Set-Cookie Header**: `akr_admin_session={...}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`
- **Error Responses**:
  - `HTTP 401 Unauthorized`: Invalid password.
  - `HTTP 403 Forbidden`: Account not found or inactive.

---

### 1.4 Admin Logout
- **Endpoint**: `POST /api/auth/admin-logout`
- **Access**: Admin
- **Description**: Invalidates the `akr_admin_session` cookie (`Max-Age=0`) and emits `ADMIN_LOGOUT` to the audit log.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 2. Infrastructure Projects & Dispatches (Solar, Railways, BSNL OFC, Civil/Electrical)

### 2.1 List Projects
- **Endpoint**: `GET /api/jobs`
- **Query Parameters**:
  - `subcontractorId` (optional): Filter jobs bound to a specific contractor UUID.
- **Description**: Queries `public.jobs` joined with `job_documents` across all infrastructure divisions (Solar PV arrays, Railway Electrification, BSNL OFC cable routes, and industrial civil sites). Returns normalized camelCase array. Falls back to `mock-db.ts` on Supabase error.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "jobs": [
      {
        "id": "job-akr-rohtak-01",
        "jobCode": "AKR-2026-HAR-019",
        "title": "Rohtak Central Agro-Processing 450 kWp Industrial Rooftop",
        "capacityKwp": 450,
        "systemType": "Industrial Rooftop Bifacial",
        "status": "in_progress",
        "siteAddress": "Plot 42, Sube Singh Industrial Complex, Rohtak",
        "city": "Rohtak",
        "state": "Haryana",
        "pincode": "124001",
        "gpsCoordinates": { "lat": 28.8955, "lng": 76.6066 },
        "subcontractorId": "sub-001-delhi-ncr",
        "documents": []
      }
    ]
  }
  ```

---

### 2.2 Create New Project Dispatch
- **Endpoint**: `POST /api/jobs`
- **Access**: Admin (Restricted by UI/Middleware)
- **Description**: Validates payload via `jobCreationSchema`, automatically assigns job code (e.g., `AKR-2026-ROH-004`), inserts into `public.jobs`, and records audit entry.
- **Request Body**:
  ```json
  {
    "title": "500 kWp Rooftop Array — Sonipat Warehouse",
    "description": "Turnkey bifacial module mounting and HT termination",
    "siteAddress": "Industrial Area Phase 2",
    "city": "Sonipat",
    "state": "Haryana",
    "pincode": "131001",
    "gpsLat": 28.9931,
    "gpsLng": 77.0151,
    "capacityKwp": 500,
    "systemType": "Commercial Rooftop",
    "subcontractorId": "c0000000-0000-0000-0000-000000000001",
    "scheduledStart": "2026-10-01T08:00:00Z",
    "scheduledEnd": "2026-10-20T18:00:00Z",
    "notes": "Night work allowed"
  }
  ```
- **Response (`HTTP 201 Created`)**: Returns `{ success: true, job: { ... } }`.

---

### 2.3 Delete Project Dispatch
- **Endpoint**: `DELETE /api/jobs/[jobId]`
- **Access**: Admin (Requires valid `akr_admin_session` cookie)
- **Description**: Purges associated records in `public.job_documents` before deleting the project from `public.jobs`. Emits `JOB_DELETED` to audit logs.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "deletedJobCode": "AKR-2026-HAR-019"
  }
  ```
- **Error Responses**:
  - `HTTP 401 Unauthorized`: Session cookie missing or invalid.
  - `HTTP 404 Not Found`: Project ID not found.

---

### 2.4 Update Job Lifecycle Status
- **Endpoint**: `PATCH /api/jobs/[jobId]/status`
- **Access**: Subcontractor / Admin
- **Description**: Advances job through lifecycle stages (`draft`, `assigned`, `en_route`, `on_site`, `in_progress`, `inspection_pending`, `completed`, `rejected`). If transition is to `completed`, automatically inserts a DISCOM Commissioning Report document into `job_documents`.
- **Request Body**:
  ```json
  {
    "status": "completed",
    "actorRole": "SUBCONTRACTOR",
    "actorIdentifier": "+919812037550"
  }
  ```
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, job: { ... } }`.

---

### 2.5 Upload Field Proof-of-Work & Documents
- **Endpoint**: `POST /api/jobs/[jobId]/upload`
- **Access**: Subcontractor / Admin
- **Description**: Validates metadata via `proofOfWorkUploadSchema`. If `previewUrl` contains Base64 image data, decodes it into a binary Buffer and uploads to Supabase Storage bucket `job-documents`. Records geodetic GPS coordinates into `job_documents` table and writes audit log.
- **Request Body**:
  ```json
  {
    "documentType": "proof_of_work",
    "fileName": "ARRAY_BAY_INVERTER_MOUNT.jpg",
    "fileSize": 1048576,
    "mimeType": "image/jpeg",
    "latitude": 28.895512,
    "longitude": 76.606634,
    "accuracy": 3.2,
    "notes": "DC cables tied to trays with UV ties",
    "previewUrl": "data:image/jpeg;base64,...",
    "uploadedBy": "+919812037550",
    "uploaderRole": "SUBCONTRACTOR"
  }
  ```
- **Response (`HTTP 201 Created`)**: Returns `{ success: true, document: { ... } }`.

---

### 2.6 View & Store DISCOM Commissioning Report
- **View Certificate (`GET /api/jobs/[jobId]/commissioning-report`)**:
  - Returns `text/html; charset=utf-8` containing a styled, print-ready Grid Synchronization Certificate with IS 3043:2018 earthing tests, 1000V insulation tests, embedded site photo records, and official digital signature blocks.
- **Store Certificate (`POST /api/jobs/[jobId]/commissioning-report`)**:
  - Registers the commissioning report into `public.job_documents`.

---

## 3. Subcontractor Management

### 3.1 List Subcontractor Directory
- **Endpoint**: `GET /api/subcontractors`
- **Description**: Returns all partner contractor firms with active status, contact details, assigned job counts, and ratings.
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, subcontractors: [ ... ] }`.

---

### 3.2 Onboard New Subcontractor
- **Endpoint**: `POST /api/subcontractors`
- **Access**: Admin
- **Description**: Validates contractor profile via `subcontractorOnboardingSchema`, generates a cryptographically secure Vendor Code (`AKR-VND-xxxx-SEC` or custom `AKR-1114`), inserts into `public.subcontractors`, and emits `SUBCONTRACTOR_ONBOARDED`.
- **Request Body**:
  ```json
  {
    "companyName": "Apex Green Energy Installations",
    "contactPerson": "Ankit Tripathy",
    "phoneNumber": "+919876543210",
    "licenseNumber": "UP-GRID-2024-4011",
    "stateRegion": "Uttar Pradesh",
    "vendorCode": "AKR-1115"
  }
  ```
- **Response (`HTTP 201 Created`)**: Returns `{ success: true, subcontractor: { ... } }`.

---

### 3.3 Delete Subcontractor (Guarded Offboarding)
- **Endpoint**: `DELETE /api/subcontractors/[id]`
- **Access**: Admin (Requires `akr_admin_session`)
- **Description**: Inspects `public.jobs` for active projects (`assigned`, `en_route`, `on_site`, `in_progress`). If active jobs exist, execution is strictly blocked with `HTTP 409 Conflict`. Otherwise, safely deletes the contractor.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "deletedCompany": "Apex Green Energy Installations"
  }
  ```
- **Conflict Response (`HTTP 409 Conflict`)**:
  ```json
  {
    "success": false,
    "error": "Cannot delete contractor: They have 2 active project(s) in progress. Reassign or complete those jobs first."
  }
  ```

---

### 3.4 Update Subcontractor Statutory Profile
- **Endpoint**: `PATCH /api/subcontractors/[id]/profile`
- **Access**: Subcontractor / Admin
- **Description**: Validates Indian GSTIN (15-character regex), PAN (10-character regex), bank account number, and IFSC code (11-character regex). Updates `public.subcontractors`.
- **Request Body**:
  ```json
  {
    "gstNumber": "27ENRPM7534P1ZV",
    "panNumber": "ENRPM7534P",
    "bankName": "HDFC Bank",
    "bankAccountNumber": "50200124368375",
    "bankIfsc": "HDFC0001991",
    "bankBranch": "Hingoli - Nawa Mondha, Plot No 8/163"
  }
  ```
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, subcontractor: { ... } }`.

---

### 3.5 Regenerate Cryptographic Vendor Code
- **Endpoint**: `POST /api/subcontractors/[id]/regenerate-code`
- **Access**: Admin
- **Description**: Revokes active code and assigns a new high-entropy Vendor Code (`AKR-VND-xxxx-SEC`). Emits `VENDOR_CODE_REVOKED_AND_REGENERATED` to audit logs.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "vendorCode": "AKR-VND-9K2M-SEC",
    "newVendorCode": "AKR-VND-9K2M-SEC"
  }
  ```

---

### 3.6 Export Official Vendor Dossier PDF
- **Endpoint**: `GET /api/subcontractors/export-pdf?vendorCode=AKR-1114`  
  *(Also mirrored at `/api/admin/subcontractors/export-pdf`)*
- **Description**: Spawns `scripts/generate_369_sop_vendor_dossier_pdf.py` using Python ReportLab. Generates a Fortune-500 grade single-page PDF compliance dossier with vector QR code, statutory registrations, and verified banking table.
- **Response (`HTTP 200 OK`)**: Binary PDF Stream (`Content-Type: application/pdf`).

---

## 4. Running Account (RA) Billing & GST Tax Invoicing

### 4.1 Query RA Bills
- **Endpoint**: `GET /api/bills`
- **Query Parameters**:
  - `subcontractorId` (optional)
  - `jobId` (optional)
  - `status` (optional: `draft`, `submitted`, `verified`, `approved`, `paid`, `rejected`)
- **Description**: Returns bills joined with jobs, subcontractors, and line items.
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, bills: [ ... ] }`.

---

### 4.2 Submit RA Bill / Tax Invoice
- **Endpoint**: `POST /api/bills`
- **Access**: Subcontractor
- **Description**: Validates bill metadata and array of line items via `billCreationSchema`. Recomputes all math server-side (taxable subtotal, CGST 9% + SGST 9% or IGST 18%, gross total). Inserts atomically into `public.bills` and `public.bill_items`.
- **Request Body**:
  ```json
  {
    "jobId": "job-akr-rohtak-01",
    "subcontractorId": "sub-001-delhi-ncr",
    "invoiceNo": "SS/2026/RA-01",
    "invoiceDate": "2026-03-12",
    "taxType": "INTRA_STATE",
    "notes": "RA Bill 01 for 450 kWp Rohtak agro-industrial rooftop project.",
    "items": [
      {
        "itemCode": "CIVIL-01",
        "description": "Module Mounting Structure (MMS) Installation & Alignment",
        "hsnSac": "995465",
        "uom": "kWp",
        "quantity": 450,
        "rate": 250
      },
      {
        "itemCode": "ELEC-01",
        "description": "Tier-1 Bifacial PV Module Placement & String Interconnection",
        "hsnSac": "995465",
        "uom": "kWp",
        "quantity": 450,
        "rate": 350
      }
    ]
  }
  ```
- **Response (`HTTP 201 Created`)**: Returns `{ success: true, bill: { ... } }`.

---

### 4.3 Get Bill Details
- **Endpoint**: `GET /api/bills/[billId]`
- **Description**: Retrieves full bill detail joined with client, contractor, and item entities.
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, bill: { ... } }`.

---

### 4.4 Review & Update Bill (TDS & Retention)
- **Endpoint**: `PATCH /api/bills/[billId]`
- **Access**: Admin / Finance
- **Description**: Allows finance team to update status (`approved`, `paid`, `rejected`), set statutory retention percentage (e.g., 5.0%), and apply Section 194C TDS percentage (e.g., 1.0% or 2.0%). Automatically computes net payable.
- **Request Body**:
  ```json
  {
    "status": "approved",
    "retentionPercentage": 5.0,
    "tdsPercentage": 2.0,
    "notes": "Approved by Finance for 450 kWp milestone completion."
  }
  ```
- **Response (`HTTP 200 OK`)**: Returns updated financial values and net payable.

---

### 4.5 Download Official GST Tax Invoice PDF
- **Endpoint**: `GET /api/bills/[billId]/pdf`
- **Description**: Pure JavaScript/TypeScript PDF generator using `jsPDF` and `jspdf-autotable`. Returns a binary PDF attachment named `RA_Bill_<invoiceNo>.pdf`. Features dual borders, Indian currency in words (Lakhs & Crores), banking coordinates, GST calculation breakdown, and digital verification hash.
- **Response (`HTTP 200 OK`)**: Binary PDF Stream (`Content-Type: application/pdf`).

---

## 5. Security & Compliance Audit Stream

### 5.1 Query Audit Ledger
- **Endpoint**: `GET /api/audit-logs`
- **Access**: Admin (Audit Compliance Officer)
- **Description**: Streams the immutable append-only compliance ledger from `public.audit_logs` ordered by `created_at DESC`.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "logs": [
      {
        "id": "log-1",
        "action": "OTP_VERIFIED_SUCCESS",
        "actorType": "SUBCONTRACTOR",
        "actorIdentifier": "+919812037550",
        "resourceId": "sub-001-delhi-ncr",
        "resourceType": "subcontractors",
        "ipAddress": "157.34.88.19",
        "userAgent": "Mozilla/5.0 ...",
        "metadata": { "loginTime": "2026-09-24T12:00:00Z" },
        "createdAt": "2026-09-24T12:00:00Z"
      }
    ]
  }
  ```
