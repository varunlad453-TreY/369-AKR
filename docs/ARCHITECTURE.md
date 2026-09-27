# System Architecture Specification

> **System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
> **Version**: 1.1.0 (Full-Stack Observability, Admin Identity Vault, CI/CD Quality Gates & Native PDF Engine)  
> **Target Domain**: Multi-Sector Infrastructure EPC & Utility Work Dispatch (Solar Power, Indian Railways, BSNL OFC Telecom, High-Voltage Electrical & Civil Infrastructure)  
> **Last Audited**: September 27, 2026  
> **Status**: ACTIVE CANONICAL ARCHITECTURE SPECIFICATION  

---

## 1. High-Level System Overview

The **369 AKR UNIVERSE Subcontractor Operations Portal (SOP)** is a serverless B2B workforce orchestration, job dispatching, and statutory billing platform built for **369 AKR UNIVERSE** — a premier multi-sector Engineering, Procurement, Construction (EPC) and utility infrastructure enterprise operating across **Solar Energy, Indian Railways Electrification, Telecom BSNL Optical Fibre Cable (OFC) Networks, and Industrial Civil/Electrical Engineering**.

The platform provides an enterprise, zero-trust web application designed for harsh Indian field conditions (remote solar arrays, railway corridors, highway OFC trenching routes), strict telecom DLT regulations, Indian GST/Income Tax statutory compliance, and resilient full-stack observability.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIERS                                         │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│   SUBCONTRACTOR FIELD AGENTS             │   ADMINISTRATIVE DISPATCHERS & FINANCE      │
│   - Mobile PWA / Industrial Tablets      │   - Desktop Workstations                    │
│   - Offline-first IndexedDB Vault        │   - Realtime Fleet Telemetry                │
│   - Geotagged Proof-of-Work Capture      │   - Job Creation & Guarded Deletion         │
│   - RA Billing & Milestone Invoicing     │   - TDS & Retention Approval Workbench      │
│   - Route Error Boundary (error.tsx)     │   - Audit Compliance & Observability        │
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
│                                                                                        │
│  Error Boundaries & Telemetry:                                                         │
│  - src/app/error.tsx        ──► Route-level degradation boundary with branded fallback │
│  - src/app/global-error.tsx ──► Root layout fatal crash isolation with inline styles   │
│  - src/lib/logger.ts        ──► Centralized singleton logger (Dev ANSI / Prod JSON)    │
└────────────────────┬────────────────────────────────────────────┬──────────────────────┘
                     │                                            │
                     ▼                                            ▼
┌─────────────────────────────────────────┐  ┌───────────────────────────────────────────┐
│     PRIMARY DATA STORE (POSTGRESQL)     │  │      RESILIENT IN-MEMORY STORE            │
│  Supabase Cloud (PostgreSQL 15+)        │  │  src/lib/state/mock-db.ts (Singleton)     │
│  - Row-Level Security (RLS) Policies    │  │  - Zero-config local development          │
│  - System Admins Vault (bcryptjs)       │  │  - Active ONLY in NODE_ENV !== production │
│  - Realtime CDC (supabase_realtime)     │  │  - Strict FAIL-FAST in production (500)   │
│  - Immutable Audit Triggers             │  │  - Pre-seeded multi-sector project sites  │
└─────────────────────────────────────────┘  └───────────────────────────────────────────┘
```

> [!NOTE]
> **Enterprise Operational Scope**: This platform is purpose-built for physical infrastructure field dispatches, engineering schematic distribution, GPS-verified proof-of-work, and GST milestone billing across AKR's core divisions:
> - **Solar Energy & Renewable Power EPC** (Rooftop & Utility Ground-Mount PV)
> - **Indian Railways Infrastructure & EPC** (Track Electrification, Traction Substations & Civil Structures)
> - **Telecom Networks & BSNL OFC** (Optical Fibre Cable HDD Trenching, Blowing, Splicing & Maintenance)
> - **Power Transmission & Heavy Civil Infrastructure**
> 
> *(The platform manages multi-sector field workforce dispatches and EPC operations; it does not perform IP-level network packet routing or software network topology analysis).*

---

## 2. Full-Stack Tech Stack

| Layer | Technologies & Libraries | Architectural Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.1.4 (App Router) | Dynamic server-side rendering, code-split route handlers, Server Components |
| **Frontend** | React 19.0.0, Lucide React 0.473 | Utilitarian industrial ERP interface, accessible UI primitives |
| **Styling** | Tailwind CSS 3.4.17, PostCSS | High-density corporate dashboard styling, mobile-first responsive grid |
| **Validation** | Zod 3.24.1 | Runtime payload validation for forms and API routes (`src/lib/zod/schemas.ts`) |
| **Primary DB** | Supabase PostgreSQL 15+ (`@supabase/ssr`) | Relational database, Row-Level Security, foreign-key cascade protection |
| **Identity Vault** | `bcryptjs` 3.0.3 | 10-round salted password hashing with constant-time dummy hash verification |
| **Offline Vault** | IndexedDB (`idb-keyval` 6.3.0) + Service Worker | Offline-first PWA caching for remote field installation sites (solar, railways, OFC) |
| **PDF Engines** | `jspdf` 4.2.1 + `jspdf-autotable` 5.0.8 | Pure TypeScript in-memory GST tax invoice & vendor dossier generation |
| **Observability** | `@sentry/nextjs` 11.0.0 + `src/lib/logger.ts` | Dual-mode singleton logger, production JSON logging, and Next.js error boundaries |
| **Testing & CI/CD**| Vitest 5.0.1 + GitHub Actions | Automated 4-stage sequential quality gate: Lint -> Typecheck -> 36 Tests -> Build |
| **SMS Gateway** | MSG91 / Twilio abstraction | TRAI DLT-compliant transactional OTP SMS dispatch with developer fallback |

---

## 3. Directory & Component Architecture

```text
g:/369
├── .github/
│   └── workflows/
│       └── production-gate.yml              # GitHub Actions CI/CD Quality Gate Pipeline
├── docs/                                    # Canonical documentation suite
│   ├── ARCHITECTURE.md                      # System design and specifications (this document)
│   ├── API.md                               # Complete 19-route-file API reference
│   ├── ROADMAP.md                           # Development horizon and feature status
│   ├── SETUP_AND_DEPLOYMENT.md              # Local runbook and environment setup
│   ├── TESTING.md                           # Test assessment and verification workflows
│   ├── DATA_FLOW_AND_SECURITY.md            # End-to-end operational data flows
│   ├── WALKTHROUGH_ADMIN_IDENTITY_VAULT.md  # Detailed Phase 5 Security Walkthrough
│   ├── WALKTHROUGH_CI_CD_PIPELINE.md        # Detailed Phase 6 DevOps Walkthrough
│   └── Handoff/                             # Historical milestone handoff documents (Phases 1-6)
├── public/                                  # Static assets, logos, and PWA service worker
│   ├── sw.js                                # Offline caching & Background Sync listener
│   ├── manifest.json                        # PWA standalone manifest
│   └── documents/subcontractors/            # Local KYC documents for verified partners
├── scripts/
│   └── generate-admin-hash.js               # CLI utility to generate bcrypt password hashes
├── src/
│   ├── middleware.ts                        # Edge RBAC gatekeeper for /admin/* and /portal/*
│   ├── app/
│   │   ├── error.tsx                        # Route-level error boundary with branded fallback UI
│   │   ├── global-error.tsx                 # Root layout fatal crash isolation with inline styles
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
│   │   └── api/                             # 19 Next.js Route Handlers
│   ├── components/                          # Shared UI components (navbar, footer, PWA pill)
│   ├── lib/
│   │   ├── auth/                            # Session readers, OTP store, and admin auth tests
│   │   ├── logger.ts                        # Centralized singleton logger with Sentry integration
│   │   ├── offline/sync-manager.ts          # IndexedDB proof upload queue manager
│   │   ├── pdf/                             # Pure jsPDF Invoice and Dossier generators + tests
│   │   ├── sms/sender.ts                    # DLT SMS abstraction
│   │   ├── state/mock-db.ts                 # In-memory local development fallback store
│   │   ├── supabase/                        # Browser, server, and admin Supabase clients
│   │   ├── utils.ts                         # Vendor code generators, currency formatters
│   │   └── zod/schemas.ts                   # Type-safe validation schemas + unit tests
│   └── types/index.ts                       # Global TypeScript interfaces
└── supabase/
    ├── schema.sql                           # Core PostgreSQL schema, RLS, triggers (347 lines)
    ├── migration_ra_billing.sql             # RA Billing tables, enum, & triggers (257 lines)
    └── migrations/
        └── 20260925000000_create_admins_vault.sql # Admin Identity Vault table & RLS policies
```

---

## 4. Dual-Layer Persistence & Production Fail-Fast Architecture

The platform uses a conscious persistence architecture separating local development convenience from production data integrity:

```
                  ┌───────────────────────────────┐
                  │       API Route Handler       │
                  └──────────────┬────────────────┘
                                 │
                     Query Supabase PostgreSQL
                                 │
                       ┌─────────┴─────────┐
                       │                   │
                  [Success]             [Failure / Error]
                       │                   │
                       ▼                   ▼
           Return Database Row     Is NODE_ENV === 'production'?
           Commit Transaction      ┌───────┴───────┐
                                   │               │
                                 [YES]           [NO]
                                   │               │
                                   ▼               ▼
                        FAIL FAST (HTTP 500)   Query mock-db.ts
                        Log Telemetry Error    Dev In-Memory State
                        Abort Transaction
```

### Architectural Principles:
1. **Production Fail-Fast**: In production (`NODE_ENV === 'production'`), the API strictly rejects fallback to in-memory state when Supabase encounters degradation. Falling back to RAM state in production creates silent data loss, financial ledger corruption, and unrecoverable billing drift. Operations fail fast with an HTTP 500 status code and trigger immediate telemetry alerts via `logger.error(...)`.
2. **Local Development Resilience**: In local developer environments (`NODE_ENV !== 'production'`), the API transparently falls back to `mock-db.ts`, enabling engineers to clone the repo and work offline without provisioning local PostgreSQL clusters.
3. **Database Precedence**: When Supabase is reachable, all mutations (`INSERT`, `UPDATE`, `DELETE`) commit to the remote PostgreSQL cluster, and database triggers write immutable records into `public.audit_logs`.

---

## 5. Security & Authentication Architecture

### 5.1 Subcontractor Authentication (Zero-Trust 2-Step Gateway)
- **Step 1: Cryptographic Vendor Code**: Subcontractors enter an alphanumeric vendor code (e.g., `AKR-1114`). Validated via regex `/^[A-Za-z0-9\-_]+$/` and rate-limited to 5 attempts per 10 minutes per phone number.
- **Step 2: DLT SMS OTP Verification**: Server-generated 6-digit cryptographic OTP stored as SHA-256 hash in `public.subcontractors.otp_hash` with a 10-minute expiry and 3-attempt lockout.
- **Session Issuance**: On success, issues an `httpOnly`, `SameSite=Lax` cookie named `akr_sub_session` (12-hour TTL).
- **Master Staging Bypass**: For evaluation and offline testing, OTP `369369` is recognized as a valid bypass token across all active vendor codes.

### 5.2 Admin Identity Vault ([`supabase/migrations/20260925000000_create_admins_vault.sql`](file:///g:/369/supabase/migrations/20260925000000_create_admins_vault.sql))
- Replaces legacy in-memory credential arrays with an isolated PostgreSQL identity vault (`public.system_admins`).
- **Cryptographic Hashing**: Passwords stored as salted `bcryptjs` hashes (10 rounds).
- **Timing Attack Mitigation**: When an unrecognized username is submitted, the server executes a dummy bcrypt comparison against a precomputed reference hash (`$2a$10$7EqJtq98hPqEX7fNZaFWoO5y2n0qgR8fQ1h.m2Z4n7r8l0x...`), enforcing constant-time execution and preventing username enumeration.
- **Account Lockout**: Tracks `failed_login_attempts` and sets `locked_until` after consecutive failures.
- **Privileged Access**: Table access is protected by Row Level Security denying all public access (`service_role` privileged key only).
- **Session**: Sets an `httpOnly`, `SameSite=Lax` cookie named `akr_admin_session` (24-hour TTL).

### 5.3 Edge RBAC Middleware ([`src/middleware.ts`](file:///g:/369/src/middleware.ts))
- Operates on Next.js Edge Runtime.
- Intercepts `/portal/:path*`: parses `akr_sub_session` and verifies contractor active status.
- Intercepts `/admin/:path*`: parses `akr_admin_session` and ensures the user holds a `'super_admin'` or `'dispatcher'` role. Unauthenticated requests are redirected (HTTP 307) to `/admin/login`.

---

## 6. Full-Stack Observability & Error Boundaries

```mermaid
graph TD
    subgraph "Frontend Client Layer"
        ROUTE_ERR[Route Segment Crash] -->|Captured by| EB[src/app/error.tsx<br/>Branded Fallback Card]
        ROOT_ERR[Root Layout Crash] -->|Captured by| GEB[src/app/global-error.tsx<br/>Autonomous Root Shell]
    end

    subgraph "Centralized Telemetry Utility"
        LOGGER[src/lib/logger.ts<br/>Singleton Logger Engine]
        EB -->|useEffect Hook| LOGGER
        GEB -->|useEffect Hook| LOGGER
    end

    subgraph "Backend Route Handlers"
        API[src/app/api/bills/route.ts] -->|Fail-Fast 500| LOGGER
    end

    subgraph "Dispatch Targets"
        LOGGER -->|Local Dev| ANSI[Dev Terminal Pretty-Print]
        LOGGER -->|Production| JSON[Structured JSON Stdout for Datadog / Axiom]
        LOGGER -->|NEXT_PUBLIC_SENTRY_DSN| SENTRY[@sentry/nextjs captureException]
    end
```

1. **Route Error Boundary (`src/app/error.tsx`)**:
   - Catches unhandled exceptions within any route segment.
   - Renders a polished **369 AKR UNIVERSE** fallback card informing the contractor: *"System degraded. Our dispatch team has been notified."*
   - Displays an incident digest hash and provides a 1-click clipboard copy button for support escalations.
   - Provides "Retry Route" (`reset()`), "Reload Application", and "Return to Gateway" actions.
2. **Root Layout Fatal Boundary (`src/app/global-error.tsx`)**:
   - Catches catastrophic crashes occurring inside the root layout ([`src/app/layout.tsx`](file:///g:/369/src/app/layout.tsx)).
   - Renders an autonomous `<html>` and `<body>` shell with self-contained CSS styling, guaranteeing branded rendering even if external stylesheets fail to mount.
3. **Centralized Singleton Logger (`src/lib/logger.ts`)**:
   - Exposes `logger.error`, `logger.warn`, and `logger.info`.
   - In development: Outputs colorized ANSI-tagged console messages with formatted context.
   - In production: Emits structured single-line JSON log objects ready for ingestion by Datadog, Axiom, or CloudWatch.
   - Sentry: Dispatches to `@sentry/nextjs` via `captureException` and `addBreadcrumb`, guarded by `process.env.NEXT_PUBLIC_SENTRY_DSN`.

---

## 7. Document & PDF Generation Subsystems

The platform incorporates two pure TypeScript serverless document generation engines:

```
┌─────────────────────────────────┬────────────────────────────────┐
│    1. GST TAX INVOICES (RA)     │    2. VENDOR KYC DOSSIER       │
├─────────────────────────────────┼────────────────────────────────┤
│ Implementation:                 │ Implementation:                │
│ src/lib/pdf/invoice-generator.ts│ src/lib/pdf/dossier-generator  │
│ Engine:                         │ Engine:                        │
│ jsPDF + jspdf-autotable         │ jsPDF + jspdf-autotable        │
│ Output:                         │ Output:                        │
│ Binary PDF Buffer               │ Binary PDF Buffer              │
│ Endpoint:                       │ Endpoint:                      │
│ GET /api/bills/[billId]/pdf     │ GET /api/subcontractors/export │
└─────────────────────────────────┴────────────────────────────────┘
```

1. **GST Tax Invoice / RA Bill Generator (`src/lib/pdf/invoice-generator.ts`)**:
   - Pure TypeScript execution running in serverless Node.js without external binary dependencies.
   - Computes Indian currency in words (Lakhs & Crores format).
   - Renders 2-column institutional letterhead, line items table, tax breakdown (CGST 9% + SGST 9% or IGST 18%), and statutory deductions (TDS Section 194C + Retention).
2. **Subcontractor Empanelment Dossier (`src/lib/pdf/dossier-generator.ts`)**:
   - Pure TypeScript engine generating single-page institutional vendor compliance certificates.
   - Renders company details, empanelment metadata, banking coordinates, and statutory GSTIN/PAN records.
   - Completely replaces legacy Python ReportLab scripts.
