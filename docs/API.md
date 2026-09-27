# API Reference Specification

> **System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
> **Base URL**: `http://localhost:3000` (Local) / `https://369akruniverse.com` (Production)  
> **Data Format**: JSON (`Content-Type: application/json`)  
> **Last Audited**: September 27, 2026  
> **Status**: ACTIVE CANONICAL API SPECIFICATION (19 Route Handlers · Pure TypeScript Serverless)  

---

## 1. Authentication & Session Gateway

### 1.1 Vendor Code Login (Step 1)
- **Endpoint**: `POST /api/auth/vendor-login`
- **Access**: Public (Subject to IP & Phone Rate-Limiting: Max 5 attempts per 10 minutes)
- **Description**: Validates assigned contractor Vendor Code against Supabase `public.subcontractors` (with fallback to `mock-db.ts` in dev), checks brute-force rate limit, generates a 6-digit dynamic cryptographic OTP, saves OTP hash, and dispatches via DLT SMS engine.
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
      "expiresAt": "2026-09-27T18:30:00.000Z",
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
- **Description**: Verifies username/email against the `public.system_admins` cryptographic vault in Supabase using `bcryptjs` salted password comparisons. Implements constant-time execution via a reference dummy hash (`DUMMY_BCRYPT_HASH`) when the user is not found to prevent timing side-channel attacks and username enumeration. Enforces account lockout via `failed_login_attempts` and `locked_until`.
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
  - `HTTP 401 Unauthorized`: Invalid password or unrecognized account.
  - `HTTP 403 Forbidden`: Account locked due to excessive failed attempts or deactivated.

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

## 2. Infrastructure Project Dispatches

### 2.1 Query Jobs
- **Endpoint**: `GET /api/jobs`
- **Query Parameters**:
  - `subcontractorId` (optional): Filter jobs assigned to a specific contractor UUID.
  - `status` (optional): Filter by dispatch status (`assigned`, `en_route`, `on_site`, `in_progress`, `completed`).
- **Description**: Returns all infrastructure projects matching criteria, joined with subcontractor profiles and document counts.
- **Response (`HTTP 200 OK`)**:
  ```json
  {
    "success": true,
    "jobs": [
      {
        "id": "job-akr-rohtak-01",
        "jobCode": "AKR-JOB-7K9M",
        "title": "450 kWp Industrial Rooftop Solar Installation",
        "systemType": "Rooftop Commercial & Industrial",
        "status": "in_progress",
        "capacityKwp": 450,
        "city": "Rohtak",
        "state": "Haryana",
        "gpsLat": 28.8955,
        "gpsLng": 76.6066
      }
    ]
  }
  ```

---

### 2.2 Create Infrastructure Project Dispatch
- **Endpoint**: `POST /api/jobs`
- **Access**: Admin (Dispatcher)
- **Description**: Validates project parameters using `jobCreationSchema` (WGS84 GPS latitude/longitude, 6-digit PIN code, work order reference) and inserts into `public.jobs`. Emits `JOB_CREATED` to audit logs.
- **Request Body**:
  ```json
  {
    "jobCode": "AKR-JOB-8X2Q",
    "title": "350 kWp Utility Solar Array Phase 1",
    "description": "Ground-mount bifacial solar installation with single-axis tracking.",
    "siteAddress": "Survey No. 42, MIDC Industrial Area",
    "city": "Hingoli",
    "state": "Maharashtra",
    "pincode": "431513",
    "gpsLat": 19.7183,
    "gpsLng": 77.1485,
    "capacityKwp": 350,
    "systemType": "Ground Mount Utility Scale",
    "subcontractorId": "c0000000-0000-0000-0000-000000000001",
    "workOrderNo": "WO/AKR/2026/042",
    "workOrderDate": "2026-03-01",
    "contractAmount": 8750000
  }
  ```
- **Response (`HTTP 201 Created`)**: Returns `{ success: true, job: { ... } }`.

---

### 2.3 Guarded Project Deletion
- **Endpoint**: `DELETE /api/jobs/[jobId]`
- **Access**: Admin
- **Description**: Deletes a project and executes a cascade purge across `public.job_documents` and associated S3 storage objects.
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, message: "Job deleted successfully" }`.

---

### 2.4 Update Dispatch Status
- **Endpoint**: `PATCH /api/jobs/[jobId]/status`
- **Access**: Subcontractor / Admin
- **Description**: Advances job lifecycle (`assigned` -> `en_route` -> `on_site` -> `in_progress` -> `completed`). Emits status change event to `public.audit_logs`.
- **Request Body**:
  ```json
  {
    "status": "in_progress",
    "notes": "Module mounting structures completed; commencing DC cabling."
  }
  ```
- **Response (`HTTP 200 OK`)**: Returns updated job record.

---

### 2.5 Upload Geotagged Milestone Proof
- **Endpoint**: `POST /api/jobs/[jobId]/upload`
- **Access**: Subcontractor
- **Description**: Accepts milestone installation proofs (Base64 JPEG/PNG) with satellite GPS coordinates (`lat`, `lng`, `accuracy`) and timestamp. Uploads binary buffer to Supabase Storage `job-documents` bucket and logs to `public.job_documents`.
- **Request Body**:
  ```json
  {
    "documentType": "proof_of_work",
    "title": "Inverter DC String Termination Proof",
    "fileBase64": "data:image/jpeg;base64,...",
    "gpsLat": 19.7183,
    "gpsLng": 77.1485,
    "accuracy": 4.2
  }
  ```
- **Response (`HTTP 201 Created`)**: Returns `{ success: true, document: { ... } }`.

---

### 2.6 DISCOM Commissioning Certificate
- **Endpoint**: `GET /api/jobs/[jobId]/commissioning-report`
- **Description**: Renders a print-ready Grid Synchronization & Commissioning Certificate formatted for Indian state electricity boards (DHBVN, UHBVN, JVVNL, MSEDCL).
- **Response (`HTTP 200 OK`)**: HTML Document (`Content-Type: text/html`).

---

## 3. Partner Contractor Management

### 3.1 List Subcontractors
- **Endpoint**: `GET /api/subcontractors`
- **Access**: Admin
- **Description**: Returns all empanelled contractors with active job counts and verification statuses.

---

### 3.2 Onboard Subcontractor
- **Endpoint**: `POST /api/subcontractors`
- **Access**: Admin
- **Description**: Registers a new contractor firm, generates an initial Vendor Code, and creates an audit record.

---

### 3.3 Guarded Contractor Offboarding
- **Endpoint**: `DELETE /api/subcontractors/[id]`
- **Access**: Admin
- **Description**: Validates that no active projects (`assigned`, `en_route`, `on_site`, `in_progress`) are assigned to the contractor. Returns `HTTP 409 Conflict` if projects exist.
- **Response (`HTTP 200 OK`)**: `{ success: true, message: "Subcontractor offboarded" }`.
- **Error Response (`HTTP 409 Conflict`)**:
  ```json
  {
    "success": false,
    "error": "Cannot delete subcontractor with active projects. Reassign or complete jobs first."
  }
  ```

---

### 3.4 Update Statutory KYC Profile
- **Endpoint**: `PATCH /api/subcontractors/[id]/profile`
- **Access**: Subcontractor / Admin
- **Description**: Updates GSTIN, PAN, and Bank Account IFSC coordinates with strict Zod validation.

---

### 3.5 Regenerate Cryptographic Vendor Code
- **Endpoint**: `POST /api/subcontractors/[id]/regenerate-code`
- **Access**: Admin
- **Description**: Revokes active code and assigns a new high-entropy Vendor Code (`AKR-VND-xxxx-SEC`).

---

### 3.6 Export Official Vendor Compliance Dossier PDF
- **Endpoint**: `GET /api/subcontractors/export-pdf?vendorCode=AKR-1114`  
  *(Also mirrored at `/api/admin/subcontractors/export-pdf`)*
- **Description**: Generates an institutional single-page PDF compliance dossier in-memory using pure TypeScript `jsPDF` ([`src/lib/pdf/dossier-generator.ts`](file:///g:/369/src/lib/pdf/dossier-generator.ts)). Renders corporate identity, empanelment status, banking coordinates, and statutory GSTIN/PAN records without external OS or Python dependencies.
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
- **Response (`HTTP 200 OK`)**: `{ success: true, bills: [ ... ] }`.

---

### 4.2 Submit RA Bill / Tax Invoice
- **Endpoint**: `POST /api/bills`
- **Access**: Subcontractor
- **Description**: Validates bill metadata and array of line items via `billCreationSchema`. Recomputes all math server-side (taxable subtotal, CGST 9% + SGST 9% or IGST 18%, gross total). Inserts atomically into `public.bills` and `public.bill_items`.
- **Fail-Fast Circuit**: In production (`NODE_ENV === 'production'`), if Supabase fails or is unreachable, the route aborts and returns `HTTP 500` to prevent uncommitted in-memory ledger drift, emitting an error alert to Sentry via `logger.error(...)`.
- **Response (`HTTP 201 Created`)**: `{ success: true, bill: { ... } }`.
- **Error Response (`HTTP 500 Internal Server Error`)**:
  ```json
  {
    "success": false,
    "error": "Database transaction failed. Invoice creation aborted to prevent financial data loss."
  }
  ```

---

### 4.3 Get Bill Details
- **Endpoint**: `GET /api/bills/[billId]`
- **Description**: Retrieves full bill detail joined with client, contractor, and item entities.

---

### 4.4 Review & Update Bill (TDS & Retention)
- **Endpoint**: `PATCH /api/bills/[billId]`
- **Access**: Admin / Finance
- **Description**: Updates bill status (`approved`, `paid`, `rejected`), applies statutory retention percentage (e.g., 5.0%), and Section 194C TDS percentage (e.g., 1.0% or 2.0%). Automatically computes net payable.

---

### 4.5 Download Official GST Tax Invoice PDF
- **Endpoint**: `GET /api/bills/[billId]/pdf`
- **Description**: Pure TypeScript PDF generator using `jsPDF` and `jspdf-autotable`. Returns a binary PDF attachment named `RA_Bill_<invoiceNo>.pdf`. Features dual borders, Indian currency in words (Lakhs & Crores), banking coordinates, GST calculation breakdown, and digital verification hash.
- **Response (`HTTP 200 OK`)**: Binary PDF Stream (`Content-Type: application/pdf`).

---

## 5. Security & Compliance Audit Stream

### 5.1 Query Audit Ledger
- **Endpoint**: `GET /api/audit-logs`
- **Access**: Admin
- **Description**: Streams the immutable append-only compliance ledger from `public.audit_logs` ordered by `created_at DESC`.
- **Response (`HTTP 200 OK`)**: Returns `{ success: true, logs: [ ... ] }`.
