# Project Roadmap & Delivery Status

> **System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
> **Last Audited**: September 27, 2026  
> **Status**: ACTIVE CANONICAL ROADMAP (Phases 1–7 Production Verified)  

---

## 1. Status Classification Guide

Every roadmap capability is classified under one of the following verified states:
- **COMPLETED**: Fully implemented, compiled cleanly in production build, covered by automated tests, and operational.
- **IN PROGRESS**: Active implementation or integration in progress with partial codebase presence.
- **NEXT**: Prioritized for immediate implementation (upcoming engineering sprint).
- **PLANNED**: Architected and approved for future development horizons.
- **BLOCKED / DEFERRED**: Dependent on external enterprise credentials/approvals or temporarily postponed.
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
  - Global navbar status indicator (`NetworkStatusIndicator`).

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
  - Features dual borders, Indian currency in words (Lakhs & Crores), tax summary tables, bank disbursement coordinates, and digital verification hash.

### 2.5 Security Lockdown & Native PDF Engine (Phase 4)
- [x] **Production Database Fail-Fast Circuit**:
  - Enforced strict Fail-Fast (HTTP 500) during Supabase degradation in production, eliminating silent RAM-state financial ledger drift.
  - Mock DB fallback strictly restricted to local development environments (`NODE_ENV !== 'production'`).
- [x] **Native Subcontractor Dossier Generator (`src/lib/pdf/dossier-generator.ts`)**:
  - Decoupled Python ReportLab dependency; engineered pure TypeScript in-memory `jsPDF` vendor compliance dossier generator.
- [x] **Automated Testing Suite**:
  - Integrated Vitest 5 with 36 automated unit and integration tests across schemas, billing math, dossier generation, and authentication.

### 2.6 Admin Identity Vault & Cryptographic Authentication (Phase 5)
- [x] **Database Identity Vault (`supabase/migrations/20260925000000_create_admins_vault.sql`)**:
  - Isolated `public.system_admins` table storing salted bcrypt password hashes.
  - Constant-time dummy hash verification mitigating timing side-channel attacks and username enumeration.
  - Account lockout tracking (`failed_login_attempts`, `locked_until`).
- [x] **Administrative Password Hash CLI (`scripts/generate-admin-hash.js`)**:
  - Standalone Node.js utility to generate 10-round bcrypt hashes for administrative seeding.

### 2.7 CI/CD Automated Quality Gates (Phase 6)
- [x] **GitHub Actions Pipeline (`.github/workflows/production-gate.yml`)**:
  - 4-stage sequential automated verification: Linting -> Type-Checking -> Vitest (36 tests) -> Production Next.js Build.
- [x] **Branch Protection Rulesets**:
  - Enforced required pull requests, status checks, and force-push blocks on `main`.

### 2.8 Full-Stack Observability & Error Boundaries (Phase 7)
- [x] **Next.js Route Error Boundary (`src/app/error.tsx`)**:
  - Branded 369 AKR UNIVERSE fallback card with automated incident ID tracing and client reset.
- [x] **Root Layout Global Error Boundary (`src/app/global-error.tsx`)**:
  - Autonomous root shell rendering custom `<html>` and `<body>` with self-contained CSS styling for catastrophic layout crashes.
- [x] **Centralized Singleton Logger (`src/lib/logger.ts`)**:
  - Dual-mode logger with colorized ANSI output in dev, structured single-line JSON in production (Datadog/Axiom), and native `@sentry/nextjs` exception capture guarded by `NEXT_PUBLIC_SENTRY_DSN`.
- [x] **API Route Telemetry Refactoring (`src/app/api/bills/route.ts`)**:
  - Replaced raw `console.error` statements with structured `logger.error(...)` capturing execution context.

---

## 3. In Progress

- [ ] **Direct S3 Presigned URL Upload Pipeline**:
  - *Current Status*: Geotagged proof uploads accept Base64 data and upload via server Buffer.
  - *Action*: Transition to browser-to-S3 presigned URLs to handle large high-resolution installation proofs and inspection video clips without serverless payload limits.

---

## 4. Next (Immediate Sprint Horizon)

1. **Supply Chain Asset Serialization & Barcode Scanning**:
   - WebRTC / HTML5 barcode scanner (`html5-qrcode`) embedded in work order stepper.
   - Enforces barcode scanning of string inverters, PV module pallets, railway catenary hardware, and BSNL OFC drums before allowing status progression to `in_progress`.
2. **Executive GIS Fleet Dashboard ("War Room" Map)**:
   - Target route: `/admin/fleet-map`.
   - Leaflet / OpenStreetMap visualization with live project clustering across North & Western India (Haryana, Rajasthan, Uttar Pradesh, Maharashtra).
3. **Automated Banking Settlement Integration**:
   - Payout API integration (RazorpayX / Cashfree) for direct NEFT/RTGS disbursement once an RA bill is marked `approved` by accounts payable.

---

## 5. Planned (Future Horizons)

1. **Mobile Push Notifications**:
   - WebPush / FCM integration to alert field contractors when new dispatches or emergency work orders are assigned.
2. **Automated Subcontractor KYC Verification**:
   - Real-time GSTIN and PAN validation via Karza / Surepass APIs during contractor onboarding.

---

## 6. Blocked / Deferred

1. **TRAI DLT Production SMS Header**:
   - *Status*: BLOCKED on formal telecom registration of Principal Entity (PE) and Header ID (`AKRSOP`).
   - *Mitigation*: System runs in safe sandbox mode, exposing generated OTP in API responses and console logs.

---

## 7. Abandoned Approaches

1. **Python ReportLab Subprocess for Vendor PDF Dossiers**:
   - *Reason*: Spawning an external Python 3 process with ReportLab created serverless deployment failures on Vercel/AWS Lambda. Superseded by pure in-memory `jsPDF` engine ([`src/lib/pdf/dossier-generator.ts`](file:///g:/369/src/lib/pdf/dossier-generator.ts)).
2. **Plaintext In-Memory Admin Credential Array**:
   - *Reason*: Hardcoding admin credentials in application source code created severe security risks. Superseded by `public.system_admins` cryptographic vault with bcryptjs.
3. **Silent RAM-State Database Fallback in Production**:
   - *Reason*: Transparent fallback to RAM state masked database outages and caused silent financial ledger drift. Superseded by strict Fail-Fast HTTP 500 circuit breaker in production.
4. **Monolithic Admin Component**:
   - *Reason*: Single 940-line `admin/page.tsx` was unmaintainable and prone to state race conditions. Superseded by 7 modular Next.js routes.
