# System Architecture Specification

**System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
**Version**: 1.0.0 (Post-Phase 3 + RA Billing & Invoicing Engine)  
**Target Domain**: Solar EPC (Engineering, Procurement, Construction) & Utility-Scale Dispatches  
**Last Audited**: September 24, 2026  
**Status**: ACTIVE CANONICAL ARCHITECTURE  

---

## 1. High-Level System Overview

The **369 AKR UNIVERSE Subcontractor Operations Portal (SOP)** is a serverless B2B workforce orchestration, job dispatching, and statutory billing platform built for 369 AKR UNIVERSE (India's premier solar energy EPC and renewable infrastructure contractor).

The platform replaces legacy static exports and unencrypted file distribution with an enterprise, zero-trust web application designed for harsh Indian field conditions, strict telecom DLT regulations, and Indian GST/Income Tax statutory compliance.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIERS                                         │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│   SUBCONTRACTOR FIELD AGENTS             │   ADMINISTRATIVE DISPATCHERS & FINANCE      │
│   - Mobile PWA / Industrial Tablets      │   - Desktop Workstations                    │
│   - Offline-first IndexedDB Vault        │   - Realtime Fleet Telemetry                │
│   - Geotagged Proof-of-Work Capture      │   - Job Creation & Guarded Deletion         │
│   - RA Billing & Milestone Invoicing     │   - TDS & Retention Approval Workbench      │
└────────────────────┬─────────────────────┴──────────────────────┬──────────────────────┘
                     │                                            │
                     ▼                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS 15 APPS & EDGE ROUTING                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Edge RBAC Middleware (src/middleware.ts):                                             │
│  - /portal/*  ──► Enforces httpOnly 'akr_sub_session' (OTP verified, 12h TTL)          │
│  - /admin/*   ──► Enforces httpOnly 'akr_admin_session' (Bcrypt verified, 24h TTL)     │
│  - /gateway/* ──► Public Rate-Limited Zero-Trust Onboarding Gateway                    │
└────────────────────┬────────────────────────────────────────────┬──────────────────────┘
                     │                                            │
                     ▼                                            ▼
┌─────────────────────────────────────────┐  ┌───────────────────────────────────────────┐
│     PRIMARY DATA STORE (POSTGRESQL)     │  │      RESILIENT IN-MEMORY STORE            │
│  Supabase Cloud (PostgreSQL 15+)        │  │  src/lib/state/mock-db.ts (Singleton)     │
│  - Row-Level Security (RLS) Policies    │  │  - Zero-config local development          │
│  - Realtime CDC (supabase_realtime)     │  │  - Automatic fallback if Supabase offline │
│  - Immutable Audit Triggers             │  │  - Pre-seeded with authentic solar sites  │
└─────────────────────────────────────────┘  └───────────────────────────────────────────┘
```

> [!NOTE]
> **Domain Clarification**: This repository is dedicated solely to Solar EPC contractor field dispatches, blueprint distribution, geotagged proof-of-work, and GST billing. It does **not** contain network hardware discovery, network packet routing, or network topology/path trace engines.

---

## 2. Full-Stack Tech Stack

| Layer | Technologies & Libraries | Architectural Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.1.4 (App Router) | Dynamic server-side rendering, code-split route handlers, Server Components |
| **Frontend** | React 19.0.0, Lucide React 0.473 | Utilitarian industrial ERP interface, accessible UI primitives |
| **Styling** | Tailwind CSS 3.4.17, PostCSS | High-density corporate dashboard styling, mobile-first responsive grid |
| **Validation** | Zod 3.24.1 | Runtime payload validation for forms and API routes (`src/lib/zod/schemas.ts`) |
| **Primary DB** | Supabase PostgreSQL 15+ (`@supabase/ssr`) | Relational database, Row-Level Security, foreign-key cascade protection |
| **Offline Vault** | IndexedDB (`idb-keyval` 6.3.0) + Service Worker | Offline-first PWA caching for remote solar rooftop installation sites |
| **Invoice PDF** | `jspdf` 4.2.1 + `jspdf-autotable` 5.0.8 | Server-side/client-side GST tax invoice & RA bill generation in memory |
| **Vendor Dossier**| Python 3 + ReportLab | Institutional 1-page subcontractor empanelment PDF generation via child process |
| **SMS Gateway** | MSG91 / Twilio abstraction | TRAI DLT-compliant transactional OTP SMS dispatch with developer fallback |

---

## 3. Directory & Component Architecture

```text
g:/369
├── docs/                                    # Canonical documentation suite
│   ├── ARCHITECTURE.md                      # System design and specifications (this document)
│   ├── API.md                               # Complete 23-endpoint API reference
│   ├── ROADMAP.md                           # Development horizon and feature status
│   ├── SETUP_AND_DEPLOYMENT.md              # Local runbook and environment setup
│   ├── TESTING.md                           # Test assessment and verification workflows
│   ├── DATA_FLOW_AND_SECURITY.md            # End-to-end operational data flows
│   └── archive/                             # Historical milestone handoff documents
│       ├── 01_handoff_subcontractor_operations_portal_upgrade.md
│       ├── 02_handoff_supabase_database_migration_and_pwa_resilience.md
│       └── 03_handoff_admin_portal_modularisation_and_secure_auth.md
├── public/                                  # Static assets, logos, and PWA service worker
│   ├── sw.js                                # Offline caching & Background Sync listener
│   ├── manifest.json                        # PWA standalone manifest
│   └── documents/subcontractors/            # Local KYC documents for verified partners
├── scripts/
│   └── generate_369_sop_vendor_dossier_pdf.py # ReportLab Python script for vendor dossiers
├── src/
│   ├── middleware.ts                        # Edge RBAC gatekeeper for /admin/* and /portal/*
│   ├── app/
│   │   ├── page.tsx                         # Utilitarian industrial landing page
│   │   ├── layout.tsx                       # Root layout with PWA provider and network status
│   │   ├── (public)/
│   │   │   ├── gateway/page.tsx             # Step 1: Vendor Code entry
│   │   │   └── gateway/verify/page.tsx      # Step 2: SMS OTP verification
│   │   ├── (protected-subcontractor)/
│   │   │   └── portal/
│   │   │       ├── page.tsx                 # Subcontractor Operations Dashboard
│   │   │       ├── job/[jobId]/             # Work order details, CAD schematics, proof upload
│   │   │       ├── bills/                   # Subcontractor RA Invoices list
│   │   │       ├── bills/new/               # 5-step GST Bill Builder form
│   │   │       └── profile/                 # Subcontractor GSTIN, PAN, and Bank profile
│   │   ├── (protected-admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx               # Admin persistent navigation shell
│   │   │       ├── page.tsx                 # Central Operations KPI Dashboard
│   │   │       ├── login/page.tsx           # Admin gateway with credential autofill
│   │   │       ├── jobs/page.tsx            # Project Dispatches ledger
│   │   │       ├── jobs/new/page.tsx        # Geotagged work order creation form
│   │   │       ├── subcontractors/page.tsx  # Partner Contractor Directory
│   │   │       ├── subcontractors/new/page.tsx # Contractor Onboarding form
│   │   │       ├── bills/page.tsx           # Accounts Payable & RA bill review list
│   │   │       ├── bills/[billId]/          # TDS/retention adjustment & bill review client
│   │   │       └── audit-logs/page.tsx      # Immutable Security Audit Ledger
│   │   └── api/                             # 18 Next.js Route Handlers (23 endpoints)
│   ├── components/                          # Shared UI components (navbar, footer, PWA pill)
│   ├── lib/
│   │   ├── auth/                            # Session readers and OTP store
│   │   ├── offline/sync-manager.ts          # IndexedDB proof upload queue manager
│   │   ├── pdf/                             # jsPDF Invoice & certificate generators
│   │   ├── sms/sender.ts                    # DLT SMS abstraction
│   │   ├── state/mock-db.ts                 # In-memory dual-layer fallback store
│   │   ├── supabase/                        # Browser & server Supabase clients
│   │   ├── utils.ts                         # Vendor code generators, currency formatters
│   │   └── zod/schemas.ts                   # Type-safe validation schemas
│   └── types/index.ts                       # Global TypeScript interfaces
└── supabase/
    ├── schema.sql                           # Core PostgreSQL schema, RLS, triggers (347 lines)
    └── migration_ra_billing.sql             # RA Billing tables, enum, & triggers (257 lines)
```

---

## 4. Dual-Layer Persistence & Resilience Architecture

A foundational architectural decision in this codebase is the **Dual-Layer Database Strategy**. While historical documentation claimed "zero-mock operation", empirical inspection of the Route Handlers reveals a conscious resilience design:

```
                  ┌───────────────────────────────┐
                  │       API Route Handler       │
                  └──────────────┬────────────────┘
                                 │
                     Query Supabase PostgreSQL
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                  [Success]             [Error / Offline]
                       │                   │
                       ▼                   ▼
           Return Database Row       Query mock-db.ts Singleton
           Map Snake to Camel        Return Seeded In-Memory State
```

### Why this design exists:
1. **Zero-Configuration Local Development**: Developers can clone the repository and run `npm run dev` immediately without provisioning a local PostgreSQL cluster or having active Supabase internet access.
2. **Network Resilience in the Field**: If Supabase credentials expire, rate-limit, or suffer connection timeouts on rural mobile hotspots, the API does not throw unhandled 500 exceptions—it transparently falls back to `mock-db.ts`.
3. **Database Precedence**: When Supabase is configured and reachable, all writes (`INSERT`, `UPDATE`, `DELETE`) commit to the remote PostgreSQL cluster, and triggers fire into `public.audit_logs`.

---

## 5. Security & Authentication Architecture

### 5.1 Subcontractor Authentication (Zero-Trust 2-Step Gateway)
- **Step 1: Cryptographic Vendor Code**: Subcontractors enter a unique alphanumeric code (e.g., `AKR-1114` or `AKR-JOB-7K9M-SEC`).
  - Validated via regex: `/^[A-Za-z0-9\-_]+$/`.
  - Rate-limited to 5 requests per 10 minutes per phone number.
- **Step 2: DLT SMS OTP Verification**:
  - Dynamic 6-digit cryptographic OTP generated on the server (`crypto.getRandomValues`).
  - Stored as SHA-256 hash in `public.subcontractors.otp_hash` with a 10-minute expiry.
  - Locked after 3 incorrect attempts.
  - On success, issues an `httpOnly`, `SameSite=Lax` cookie named `akr_sub_session` (12-hour TTL).
- **Master Staging Bypass**: For evaluation and offline testing, OTP `369369` is recognized as a valid bypass token across all active vendor codes.

### 5.2 Admin Authentication (Server-Side Credential Verification)
- Admin authentication bypasses client-side Supabase Auth to eliminate unconfirmed email failures on internal corporate domains (`@369akruniverse.in`).
- Credentials submitted via `POST /api/auth/admin-login` are verified directly against `public.admins` using secure cryptographic hashing.
- On success, issues an `httpOnly`, `SameSite=Lax` cookie named `akr_admin_session` (24-hour TTL).
- All admin actions emit immutable records into `public.audit_logs`.

### 5.3 Edge RBAC Middleware (`src/middleware.ts`)
- Runs on Next.js Edge Runtime.
- Intercepts `/portal/:path*`: parses `akr_sub_session` and verifies contractor active status.
- Intercepts `/admin/:path*`: parses `akr_admin_session` and ensures the user holds a `'super_admin'` or `'dispatcher'` role. Unauthenticated requests are redirected (HTTP 307) to `/admin/login`.

---

## 6. Field PWA & Offline Upload Vault

Solar power plants in India are frequently located in remote arid zones or on industrial sheet-metal rooftops where cellular signals fluctuate:

1. **Service Worker (`public/sw.js`)**:
   - Precaches the application shell (`/`, `/portal`, `/gateway`, logos, manifest).
   - Stale-While-Revalidate for CSS and JavaScript bundles.
   - Network-First with cache fallback for page navigation.
2. **IndexedDB Upload Vault (`src/lib/offline/sync-manager.ts`)**:
   - Powered by `idb-keyval` under the database `akr-sop-offline-db` / object store `proof-upload-vault`.
   - When a subcontractor snaps a milestone photo without an internet connection, the payload (Base64 JPEG), live GPS coordinates (`navigator.geolocation`), and timestamp are diverted into IndexedDB.
   - A global UI indicator (`NetworkStatusIndicator`) displays: `⚠ ROOFTOP OFFLINE VAULT (N QUEUED)`.
3. **Automatic Flush Engine**:
   - The PWA provider listens for `window.addEventListener('online')` and triggers Background Sync API (`sync-proof-uploads`).
   - Sequentially flushes queued proofs to `/api/jobs/[jobId]/upload` and removes items from IndexedDB upon HTTP 201 confirmation.

---

## 7. Document & PDF Generation Subsystems

The platform incorporates three distinct document generation architectures:

```
┌─────────────────────────────────┬────────────────────────────────┬────────────────────────────────┐
│    1. GST TAX INVOICES (RA)     │    2. VENDOR KYC DOSSIER       │   3. DISCOM COMMISSIONING      │
├─────────────────────────────────┼────────────────────────────────┼────────────────────────────────┤
│ Implementation:                 │ Implementation:                │ Implementation:                │
│ src/lib/pdf/invoice-generator.ts│ scripts/generate_369_...pdf.py │ api/jobs/[id]/commissioning-.. │
│ Engine:                         │ Engine:                        │ Engine:                        │
│ jsPDF + jspdf-autotable         │ Python 3 + ReportLab           │ Server-rendered HTML + CSS     │
│ Output:                         │ Output:                        │ Output:                        │
│ Binary PDF Buffer               │ Binary PDF Buffer (via spawn)  │ text/html with window.print()  │
│ Endpoint:                       │ Endpoint:                      │ Endpoint:                      │
│ GET /api/bills/[billId]/pdf     │ GET /api/subcontractors/export-│ GET /api/jobs/[id]/commiss...  │
└─────────────────────────────────┴────────────────────────────────┴────────────────────────────────┘
```

1. **GST Tax Invoice / RA Bill Generator**:
   - Pure TypeScript/JavaScript execution running in serverless Node.js without binary external dependencies.
   - Computes Indian currency in words (Lakhs & Crores format).
   - Renders 2-column institutional letterhead, line items table, and tax breakdown (CGST 9% + SGST 9% or IGST 18%), minus statutory deductions (TDS Section 194C + Retention).
2. **Subcontractor Empanelment Dossier**:
   - Python ReportLab script designed to generate a Fortune-500 grade single-page PDF compliance record complete with vector QR codes and verified banking tables.
   - Invoked via Node.js `child_process.spawn("python", ...)`.
3. **DISCOM Commissioning Certificate**:
   - Generates an official, print-ready Grid Synchronization Certificate for Indian state electricity boards (DHBVN, UHBVN, JVVNL, MSEDCL).
   - Serves compliant HTML styled with `@page { size: A4; margin: 15mm; }` and a one-click print trigger.
