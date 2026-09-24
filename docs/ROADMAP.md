# Project Roadmap & Delivery Status

**System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
**Last Audited**: September 24, 2026  
**Status**: ACTIVE CANONICAL ROADMAP  

---

## 1. Status Classification Guide

To prevent ambiguity, every roadmap capability is classified under one of the following verified states:
- **COMPLETED**: Fully implemented, compiled cleanly in production build, and operational.
- **IN PROGRESS**: Partially implemented; active development or integration in progress.
- **NEXT**: Prioritized for immediate implementation (current engineering sprint).
- **PLANNED**: Architected and approved for future development horizons.
- **BLOCKED / DEFERRED**: Dependent on external credentials/approvals or temporarily postponed.
- **ABANDONED**: Replaced, superseded, or deliberately removed from product scope.

---

## 2. Completed Capabilities

### 2.1 Core Subcontractor Operations (Phase 1 & 2)
- [x] **Zero-Trust 2-Step Subcontractor Gateway**:
  - Step 1: Cryptographic Vendor Code verification (`/gateway`) with rate-limiting.
  - Step 2: Dynamic SMS OTP verification (`/gateway/verify`) with 3-attempt lockout.
  - Developer bypass token (`369369`) for staging and evaluator review.
  - Verified session issuance via `akr_sub_session` httpOnly cookie (12-hour TTL).
- [x] **Field Operations Dashboard (`/portal`)**:
  - Server Component deriving identity strictly from session cookie.
  - Active vs completed project segmentation and real-time kWp capacity metrics.
- [x] **Interactive Work Order & Lifecycle Stepper (`/portal/job/[jobId]`)**:
  - 5-stage dispatch progression (`assigned` -> `en_route` -> `on_site` -> `in_progress` -> `completed`).
  - High-voltage Single Line Diagram (SLD) and CAD schematic access.
  - Geotagged proof-of-work photo upload with browser satellite GPS coordinate watermarking.
- [x] **DISCOM Commissioning Certificate Generator**:
  - Serverless HTML certificate generator (`/api/jobs/[jobId]/commissioning-report`) with print CSS formatting for state electricity boards (DHBVN, UHBVN, JVVNL, MSEDCL).

### 2.2 Centralized Admin Control Plane (Phase 3)
- [x] **Modular Next.js 15 Admin Architecture**:
  - Deconstructed monolithic UI into 7 decoupled route pages (`/admin`, `/admin/jobs`, `/admin/jobs/new`, `/admin/subcontractors`, `/admin/subcontractors/new`, `/admin/bills`, `/admin/audit-logs`).
- [x] **Server-Side Administrative Authentication**:
  - Direct database credential verification against `public.admins` bypassing client-side Supabase Auth `email_not_confirmed` errors.
  - Secure session management via `akr_admin_session` cookie (24-hour TTL).
- [x] **Edge RBAC Middleware (`src/middleware.ts`)**:
  - Zero-trust edge route protection for `/admin/*` and `/portal/*`.
- [x] **Guarded Deletion Safety Lifecycles**:
  - Infrastructure project deletion (`DELETE /api/jobs/[id]`) with cascading document purge.
  - Contractor offboarding guard (`DELETE /api/subcontractors/[id]`) returning `HTTP 409 Conflict` if active projects remain assigned.
- [x] **Security Audit Ledger (`/admin/audit-logs`)**:
  - Append-only PostgreSQL compliance stream tracking all state changes, dispatches, and logins.

### 2.3 Field Resilience & Progressive Web App (PWA)
- [x] **Offline-First Application Shell**:
  - Standalone Web App Manifest (`public/manifest.json`) and Service Worker (`public/sw.js`).
- [x] **IndexedDB Upload Vault (`src/lib/offline/sync-manager.ts`)**:
  - Diverts failed/offline proof uploads into IndexedDB (`akr-sop-offline-db`).
  - Listens for network restoration and auto-flushes queue via Background Sync API.
  - Global navbar status pill (`NetworkStatusIndicator`).

### 2.4 Running Account (RA) Billing & GST Invoicing Engine
- [x] **Subcontractor Bill Submission (`/portal/bills/new`)**:
  - Multi-item milestone billing builder with HSN/SAC codes, UoM, quantities, and rates.
  - Automatic tax classification (Intra-state CGST 9% + SGST 9% vs Inter-state IGST 18%).
- [x] **Admin Accounts Payable & Bill Review (`/admin/bills` & `/admin/bills/[billId]`)**:
  - Finance verification workbench to inspect submitted RA bills.
  - Dynamic adjustment of Performance Retention (e.g., 5%) and Section 194C TDS (e.g., 1% or 2%).
  - Real-time server-side net payable computation.
- [x] **Subcontractor Statutory KYC Profile (`/portal/profile`)**:
  - Self-service form to register GSTIN, PAN, Bank Name, Account Number, and IFSC coordinates.
- [x] **GST Tax Invoice PDF Generator (`src/lib/pdf/invoice-generator.ts`)**:
  - Built with `jsPDF` + `jspdf-autotable`.
  - Features dual borders, Indian currency in words (Lakhs & Crores), tax summary tables, bank disbursement coordinates, and digital hash.
- [x] **Executive Subcontractor Empanelment Dossier PDF**:
  - Python ReportLab pipeline (`scripts/generate_369_sop_vendor_dossier_pdf.py`) producing 1-page executive compliance certificate with vector QR code.

---

## 3. In Progress

- [ ] **Automated CI/CD Test Suite**:
  - *Current Status*: ZERO committed automated tests exist in the codebase. Testing has historically relied on manual verification scripts and type checking.
  - *Action*: Install Vitest and implement unit tests for Zod schemas, billing calculations, and API routes.
- [ ] **Direct S3 Presigned URL Upload Pipeline**:
  - *Current Status*: Proof uploads accept Base64 data and upload via server Buffer. Direct browser-to-S3 presigned URLs should be completed to handle large 4K video files without serverless memory overhead.

---

## 4. Next (Immediate Horizon)

1. **Codify Automated Testing Harness**:
   - Install `vitest`, `@testing-library/react`, and write integration tests for:
     - Vendor OTP verification and lockout logic.
     - RA Bill calculation math (CGST/SGST/IGST + TDS + Retention).
     - Edge RBAC middleware route protection.
2. **Decouple Python Dependency for Vendor PDF Export**:
   - Re-implement the ReportLab vendor dossier generator in pure TypeScript (`jsPDF`) so that serverless environments (Vercel, AWS Lambda) do not require a separate Python 3 runtime and ReportLab package.
3. **Provision and Restrict Supabase Storage S3 Bucket**:
   - Configure public read policies and authenticated upload policies on the `job-documents` bucket in Supabase Cloud.

---

## 5. Planned (Future Horizons)

1. **Executive GIS Fleet Dashboard ("War Room" Map)**:
   - Target route: `/admin/fleet-map`.
   - Leaflet / OpenStreetMap integration with live marker clustering across North & Western India (Haryana, Rajasthan, Uttar Pradesh, Maharashtra).
   - Realtime CDC color-coding (`assigned`: Purple, `in_progress`: Amber pulse, `completed`: Emerald check).
2. **Supply Chain Asset Serialization & Barcode Scanning**:
   - WebRTC / HTML5 barcode scanner (`html5-qrcode`) embedded in work order view.
   - Restrict status progression to `in_progress` until primary project materials (string inverters & solar PV pallets, railway catenary/substation equipment, or BSNL OFC cable drums) are scanned and validated against warehouse manifests.
3. **Automated Banking Settlement Integration**:
   - Integration with Indian payment payout APIs (RazorpayX / Cashfree) for direct NEFT/RTGS disbursement once an RA bill is marked `approved` or `paid`.

---

## 6. Blocked / Deferred

1. **TRAI DLT Production SMS Header**:
   - *Status*: BLOCKED on formal telecom registration of Principal Entity (PE) and Header ID (`AKRSOP`).
   - *Mitigation*: System runs in sandbox mode, exposing generated OTP in API responses and console logs.
2. **Push Notifications (WebPush / FCM)**:
   - *Status*: DEFERRED until field PWA deployment is fully adopted by partner firms.

---

## 7. Abandoned Approaches

1. **Monolithic Admin Component**:
   - *Reason*: Single 940-line `admin/page.tsx` was unmaintainable, slow to re-render, and prone to state race conditions. Extracted into 7 modular Next.js routes.
2. **Supabase Auth SDK for Internal Admin Staff**:
   - *Reason*: Supabase Auth's mandatory email confirmation requirement failed for internal non-mailserver domains (`@369akruniverse.in`), returning unhandled `email_not_confirmed` errors. Replaced with server-side credential verification against `public.admins`.
3. **Static HTML/CSS Export**:
   - *Reason*: Static marketing site had zero operational capability, unencrypted file distribution, and no contractor authentication. Fully superseded by Next.js 15 App Router.
