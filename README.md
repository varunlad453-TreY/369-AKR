# 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)

Enterprise workforce orchestration, multi-discipline infrastructure project dispatching, and statutory contractor billing platform for **369 AKR UNIVERSE** — an integrated Engineering, Procurement, and Construction (EPC) infrastructure enterprise executing across **Solar Energy & Renewable Power, Indian Railways Electrification & Civil Infrastructure, BSNL Optical Fibre Cable (OFC) Telecom Networks, and High-Voltage Electrical Infrastructure**.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15+-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-5.0.1-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Sentry](https://img.shields.io/badge/Sentry-11.0.0-362D59?style=flat-square&logo=sentry)](https://sentry.io/)

---

## System Overview

The **369 AKR UNIVERSE Subcontractor Operations Portal (SOP)** delivers a unified operational control system for infrastructure execution across India. The platform integrates corporate dispatchers, engineering divisions, and accounts payable with field contractors across **Solar Power Plants, Railway Corridors, BSNL OFC Routes, and Substation Construction Sites**, enforcing zero-trust site credentials, tamper-evident field proof-of-work, GST-compliant milestone billing, and resilient full-stack observability.

```
+----------------------------------------------------------------------------------------+
|                                   PLATFORM SURFACE                                     |
+------------------------------------------+---------------------------------------------+
|   SUBCONTRACTOR FIELD PORTAL             |   CENTRAL DISPATCH & ACCOUNTS PAYABLE       |
|   - Zero-Trust 2-Step OTP Gateway        |   - Multi-Sector Dispatch Control Board     |
|   - Geotagged Milestone Photo Uploads    |   - Admin Identity Vault (bcryptjs)         |
|   - Engineering Blueprints & CAD SLDs    |   - Guarded Cascading Deletion Safety       |
|   - PWA Offline IndexedDB Vault          |   - RA Bill Review & TDS/Retention Math     |
|   - Running Account (RA) Bill Builder    |   - Immutable PostgreSQL Audit Ledger       |
|   - Route Error Boundary (error.tsx)     |   - Executive Vendor Dossier PDF (jsPDF)    |
|   - Statutory GST & Banking Profile      |   - CI/CD Quality Gates & Sentry Telemetry  |
+------------------------------------------+---------------------------------------------+
```

> [!NOTE]
> **Enterprise Operational Scope**: This platform is engineered specifically for physical infrastructure field dispatches, engineering schematic distribution, GPS-verified proof-of-work, and GST milestone billing across AKR's core divisions:
> - **Solar Energy & Renewable Power EPC** (Commercial/Industrial Rooftop & Utility Ground-Mount PV)
> - **Indian Railways Infrastructure & EPC** (Track Electrification, Traction Substations & Civil Structures)
> - **Telecom Networks & BSNL OFC** (Optical Fibre Cable HDD Trenching, Blowing, Splicing & Maintenance)
> - **Power Transmission & Heavy Civil Infrastructure**
> 
> *(The platform manages multi-sector field workforce dispatches and EPC operations; it does not perform IP-level network packet routing or software network topology analysis).*

---

## Core Operational Capabilities

### 1. Zero-Trust Subcontractor Gateway (`/gateway` & `/gateway/verify`)
- **Step 1: Cryptographic Vendor Code**: Validates assigned contractor credentials (e.g., `AKR-1114` or `AKR-JOB-7K9M-SEC`) against active database records.
- **Step 2: Dynamic SMS OTP Verification**: Server-generated 6-digit dynamic cryptographic OTP with 3-attempt lockout and 10-minute sliding window. (Evaluation bypass token: `369369`).
- **Edge Session Protection**: Successful verification sets an `httpOnly`, `SameSite=Lax` cookie (`akr_sub_session`) verified by Next.js Edge Middleware (`src/middleware.ts`).

### 2. Field Operations Portal (`/portal` & `/portal/job/[jobId]`)
- **Interactive Work Order Stepper**: 5-stage dispatch progression (`assigned` -> `en_route` -> `on_site` -> `in_progress` -> `completed`).
- **CAD Schematics & Engineering Blueprints**: Secure distribution of Single Line Diagrams (SLDs), railway track alignment schematics, and optical fibre route plans.
- **Geotagged Proof-of-Work**: High-precision satellite GPS fix acquisition (`navigator.geolocation`) with coordinate and timestamp watermarking.
- **Statutory Commissioning Certificates**: Automated generation of print-ready Grid Synchronization & Commissioning Certificates for state electricity boards (DHBVN, UHBVN, JVVNL, MSEDCL) and field handoff memos.

### 3. Progressive Web App (PWA) & Offline Resilience
- **Offline Shell**: Service Worker (`public/sw.js`) precaches core assets and provides offline execution fallbacks.
- **IndexedDB Upload Vault**: Remote field proof uploads captured without cellular signal (rural railway corridors, remote solar farms, highway OFC trenches) are diverted to IndexedDB (`akr-sop-offline-db` via `idb-keyval`) and automatically flushed once connectivity restores.
- **Network Status Monitor**: Persistent UI component reflecting live connection status (`[FIELD NETWORK ACTIVE]` vs `[FIELD OFFLINE VAULT]`).

### 4. Running Account (RA) Billing & GST Tax Invoicing (`/portal/bills` & `/admin/bills`)
- **Subcontractor Bill Builder**: 5-step form to generate milestone RA bills with granular line items (HSN/SAC, UoM, Quantity, Rate).
- **Automated Indian Tax Engine**: Computes intra-state CGST (9%) + SGST (9%) or inter-state IGST (18%).
- **Finance Review & Deductions**: Administrative workbench to inspect line items, apply Performance Retention (e.g., 5%), and deduct Section 194C TDS (e.g., 1% or 2%) with real-time net payable recalculation.
- **GST Tax Invoice PDF Generator**: Pure serverless `jsPDF` engine (`src/lib/pdf/invoice-generator.ts`) generating institutional, printable tax invoices with Indian currency represented in words (Lakhs & Crores format).

### 5. Centralized Modular Admin Control Plane (`/admin/*`)
- **Operations Overview (`/admin`)**: Real-time KPI telemetry (capacity under execution, active dispatches, partner count).
- **Admin Identity Vault**: Cryptographic authentication verifying credentials against `public.system_admins` with salted `bcryptjs` hashing, constant-time dummy hash verification, and account lockout tracking.
- **Project Dispatches (`/admin/jobs` & `/admin/jobs/new`)**: Full dispatch ledger with geodetic WGS84 GPS coordinate validation and guarded cascading deletion.
- **Subcontractor Directory (`/admin/subcontractors` & `/admin/subcontractors/new`)**: Contractor onboarding, 1-click vendor code regeneration, conflict-guarded deletion (`HTTP 409 Conflict`), and native in-memory `jsPDF` vendor dossier generation (`src/lib/pdf/dossier-generator.ts`).
- **Security Audit Stream (`/admin/audit-logs`)**: Immutable chronological ledger tracking all administrative actions, logins, status transitions, dispatches, and deletions with IST timestamps and client IP addresses.

### 6. Full-Stack Observability & Error Boundaries
- **Route Error Boundary (`src/app/error.tsx`)**: Isolates route crashes, displays a branded **369 AKR UNIVERSE** fallback UI informing the user that *"System degraded. Our dispatch team has been notified."*, displays an incident hash, and provides retry actions.
- **Root Layout Global Error Boundary (`src/app/global-error.tsx`)**: Replaces the root layout upon catastrophic layout crashes with an autonomous `<html><body>` shell and self-contained dark styling.
- **Centralized Singleton Logger (`src/lib/logger.ts`)**: Pretty-prints in development, outputs structured single-line JSON in production for Datadog/Axiom ingestion, and dispatches exceptions to Sentry (`@sentry/nextjs`) guarded by `NEXT_PUBLIC_SENTRY_DSN`.
- **Production Fail-Fast Database Circuit**: In production (`NODE_ENV === 'production'`), API route handlers abort transactions and return HTTP 500 when Supabase is unreachable, strictly blocking fallback to RAM state to protect financial ledgers.

### 7. Automated Quality Gates & CI/CD Pipeline
- **GitHub Actions Pipeline (`.github/workflows/production-gate.yml`)**: Automated sequential quality gates on Node 22 LTS:
  1. ESLint Static Analysis (`npm run lint`)
  2. Strict TypeScript Compilation (`npx tsc --noEmit`)
  3. Vitest Automated Test Harness (`npm test` — 36 unit and integration tests)
  4. Next.js Production Route Compilation (`npm run build`)
- **GitHub Branch Protection Rulesets**: Enforces required pull requests and passing status checks before merging to `main`.

---

## Directory Structure

```text
/
├── .github/
│   └── workflows/
│       └── production-gate.yml      # CI/CD Quality Gate Pipeline
├── docs/                            # Canonical technical documentation
│   ├── ARCHITECTURE.md              # System architecture specification
│   ├── API.md                       # Complete 19-route-file API reference
│   ├── ROADMAP.md                   # Current roadmap & delivery status
│   ├── SETUP_AND_DEPLOYMENT.md      # Local setup & production runbook
│   ├── TESTING.md                   # Testing audit & verification specification
│   ├── DATA_FLOW_AND_SECURITY.md    # End-to-end operational data flows
│   ├── WALKTHROUGH_ADMIN_IDENTITY_VAULT.md # Phase 5 Security Walkthrough
│   ├── WALKTHROUGH_CI_CD_PIPELINE.md       # Phase 6 CI/CD Walkthrough
│   └── Handoff/                     # Historical milestone handoff records (Phases 1-6)
├── public/                          # Static assets, logos, and PWA service worker
├── scripts/
│   └── generate-admin-hash.js       # CLI utility to generate bcrypt password hashes
├── src/
│   ├── app/
│   │   ├── error.tsx                # Route-level error boundary with branded fallback UI
│   │   ├── global-error.tsx         # Root layout fatal crash isolation
│   │   ├── layout.tsx               # Root layout with PWA provider and navigation
│   │   ├── page.tsx                 # Portal landing page
│   │   ├── (public)/                # Zero-trust login gateway (/gateway, /gateway/verify)
│   │   ├── (protected-subcontractor)/ # Subcontractor operations portal (/portal/*)
│   │   ├── (protected-admin)/       # Central operations control plane (/admin/*)
│   │   └── api/                     # 19 Next.js Route Handlers
│   ├── components/                  # UI components, navbar, footer, PWA indicators
│   ├── lib/
│   │   ├── auth/                    # Session helpers, OTP store, admin auth tests
│   │   ├── logger.ts                # Centralized singleton logger with Sentry integration
│   │   ├── offline/sync-manager.ts  # IndexedDB upload vault & sync logic
│   │   ├── pdf/                     # jsPDF GST invoice & vendor dossier generators + tests
│   │   ├── sms/sender.ts            # DLT SMS sender abstraction
│   │   ├── state/mock-db.ts         # In-memory local development fallback store
│   │   ├── supabase/                # Supabase browser, server, and admin clients
│   │   ├── utils.ts                 # Cryptographic code generators & formatters
│   │   └── zod/schemas.ts           # Runtime Zod validation schemas + tests
│   ├── middleware.ts                # Edge RBAC middleware for /admin/* & /portal/*
│   └── types/index.ts               # Global TypeScript interfaces
└── supabase/
    ├── schema.sql                   # Core schema, RLS, & audit triggers
    ├── migration_ra_billing.sql     # RA Billing tables, enum, & triggers
    └── migrations/
        └── 20260925000000_create_admins_vault.sql # Admin Identity Vault table & RLS
```

---

## Local Setup & Deployment

### 1. Repository Setup & Dependencies
```bash
git clone https://github.com/varunlad453-TreY/369-AKR.git
cd 369-AKR
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Automated Tests
```bash
npm test
```
Executes all 36 passing Vitest unit and integration tests.

### 4. Launch Development Instance
```bash
npm run dev
```
Access the application at [http://localhost:3000](http://localhost:3000).

### 5. Build for Production Execution
```bash
npx tsc --noEmit
npm run build
npm run start -- -p 3000
```
All routes compile deterministically with zero TypeScript errors.

---

## Evaluation & Access Credentials

| Role | Access URL | Credentials | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Infrastructure Contractor**<br>(Swarajya Construction) | `/gateway` | Vendor Code: `AKR-1114`<br>OTP: `369369` (or dynamic code) | 350 kWp Hingoli Solar Project & BSNL OFC Trenching, schematics, proof upload, RA bills, statutory profile |
| **Infrastructure Contractor**<br>(SuryaShakti EPC) | `/gateway` | Vendor Code: `AKR-JOB-7K9M-SEC`<br>OTP: `369369` (or dynamic code) | 450 kWp Rohtak Industrial Project & Railway Electrification, RA-01 invoice |
| **Admin Dispatcher** | `/admin/login` | Email: `dispatcher@369akruniverse.in`<br>Password: `Admin@369AKR!` | Full Central Dispatch Control Plane, multi-sector project creation, contractor management, audit ledger |
| **Finance Officer** | `/admin/bills` | Authenticated Admin Session | Accounts Payable workbench, TDS/retention adjustments, payout authorization |

---

## Canonical Technical Documentation

For detailed technical specifications, consult the dedicated documentation files:

- [System Architecture Specification](file:///g:/369/docs/ARCHITECTURE.md)
- [API Reference Specification](file:///g:/369/docs/API.md)
- [Project Roadmap & Delivery Status](file:///g:/369/docs/ROADMAP.md)
- [Setup & Deployment Runbook](file:///g:/369/docs/SETUP_AND_DEPLOYMENT.md)
- [Testing & Quality Verification Specification](file:///g:/369/docs/TESTING.md)
- [Data Flow & Security Architecture](file:///g:/369/docs/DATA_FLOW_AND_SECURITY.md)
- [Walkthrough: Admin Identity Vault](file:///g:/369/docs/WALKTHROUGH_ADMIN_IDENTITY_VAULT.md)
- [Walkthrough: CI/CD Pipeline & Automated Quality Gates](file:///g:/369/docs/WALKTHROUGH_CI_CD_PIPELINE.md)
- [Historical Milestone Handoff Archive](file:///g:/369/docs/Handoff/)

---

## Corporate Entity & Contact Information

**369 AKR UNIVERSE INFRASTRUCTURE & EPC PRIVATE LIMITED**  
*(Operating Divisions: Solar Power EPC, Indian Railways Electrification & Civil Infrastructure, Telecom BSNL OFC Networks, High-Voltage Substation Engineering)*  
Plot 42, Sube Singh Complex, HSIIDC Industrial Estate, Sector 31, Rohtak, Haryana, India 124001  
**Contact Desk**: +91 98120 37550 / +91 90509 37550  
**Electronic Mail**: info@369akruniverse.in | central.dispatch@369akruniverse.in  
