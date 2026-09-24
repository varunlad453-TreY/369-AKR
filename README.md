# 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)

Enterprise B2B workforce orchestration, solar project dispatching, and statutory billing platform for **369 AKR UNIVERSE** — India's premier solar energy EPC (Engineering, Procurement, Construction) and utility-scale infrastructure contractor.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15+-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

---

## ⚡ System Overview

The **369 AKR UNIVERSE Subcontractor Operations Portal (SOP)** provides an end-to-end operational operating system for solar infrastructure dispatches across North and Western India. It connects corporate dispatchers and finance teams with field electrical supervisors, ensuring zero-trust site access, tamper-evident proof-of-work, and GST-compliant milestone billing.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PLATFORM SURFACE                                     │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│   SUBCONTRACTOR FIELD PORTAL             │   CENTRAL DISPATCH & ACCOUNTS PAYABLE       │
│   - Zero-Trust 2-Step OTP Gateway        │   - Real-Time Dispatch Control Board        │
│   - Geotagged Milestone Photo Uploads    │   - Modular Subcontractor Directory         │
│   - High-Voltage Single Line Diagrams    │   - Guarded Cascading Deletion Safety       │
│   - PWA Offline IndexedDB Vault          │   - RA Bill Review & TDS/Retention Math     │
│   - Running Account (RA) Bill Builder    │   - Immutable PostgreSQL Audit Ledger       │
│   - Statutory GST & Banking Profile      │   - Executive Vendor Dossier PDF Export     │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

> [!NOTE]
> **Domain Clarification**: This platform is purpose-built for Solar EPC contractor field dispatches, blueprint distribution, geotagged proof-of-work, and GST billing. It does **not** contain network hardware discovery, network packet routing, or network topology/path trace engines.

---

## 🚀 Core Implemented Features

### 1. Zero-Trust Subcontractor Gateway (`/gateway` & `/gateway/verify`)
- **Step 1: Cryptographic Vendor Code**: Validates assigned contractor codes (e.g., `AKR-1114` or `AKR-JOB-7K9M-SEC`) against active database records.
- **Step 2: Dynamic SMS OTP Verification**: Server-generated 6-digit dynamic cryptographic OTP with 3-attempt lockout and 10-minute sliding window. (Staging bypass token: `369369`).
- **Edge Session Protection**: Successful verification sets an `httpOnly`, `SameSite=Lax` cookie (`akr_sub_session`) verified by Next.js Edge Middleware (`src/middleware.ts`).

### 2. Field Operations Portal (`/portal` & `/portal/job/[jobId]`)
- **Interactive Work Order Stepper**: Live 5-stage dispatch progression (`assigned` ➔ `en_route` ➔ `on_site` ➔ `in_progress` ➔ `completed`).
- **CAD Schematics & SLDs**: Instant access to Single Line Diagrams and engineering blueprints.
- **Geotagged Proof-of-Work**: Live satellite GPS fix acquisition (`navigator.geolocation`) with coordinate and timestamp watermarking.
- **DISCOM Commissioning Certificate**: Auto-generates a print-ready Grid Synchronization & Commissioning Certificate for Indian state electricity boards (DHBVN, UHBVN, JVVNL, MSEDCL).

### 3. Progressive Web App (PWA) & Offline Resilience
- **Offline Shell**: Service Worker (`public/sw.js`) precaches core assets and provides offline fallback.
- **IndexedDB Upload Vault**: Remote rooftop proof uploads captured without cellular signal are diverted to IndexedDB (`akr-sop-offline-db` via `idb-keyval`) and automatically flushed once connectivity restores.
- **Network Status Pill**: Global navbar widget reflecting live connection state (`● FIELD NETWORK ACTIVE` vs `⚠ ROOFTOP OFFLINE VAULT`).

### 4. Running Account (RA) Billing & GST Tax Invoicing (`/portal/bills` & `/admin/bills`)
- **Subcontractor Bill Builder**: Self-service 5-step form to create milestone RA bills with granular line items (HSN/SAC, UoM, Quantity, Rate).
- **Automated Indian Tax Engine**: Computes intra-state CGST (9%) + SGST (9%) or inter-state IGST (18%).
- **Finance Review & Deductions**: Admin workbench to inspect line items, set Performance Retention (e.g., 5%), and deduct Section 194C TDS (e.g., 1% or 2%) with real-time net payable recalculation.
- **GST Tax Invoice PDF Generator**: Pure serverless `jsPDF` engine (`src/lib/pdf/invoice-generator.ts`) generating dual-bordered, printable tax invoices with Indian currency in words (Lakhs & Crores format).

### 5. Centralized Modular Admin Control Plane (`/admin/*`)
- **Operations Overview (`/admin`)**: Real-time KPI telemetry (MWp capacity under execution, active dispatches, partner count).
- **Project Dispatches (`/admin/jobs` & `/admin/jobs/new`)**: Full dispatch ledger with geodetic WGS84 GPS coordinate validation and guarded cascading deletion.
- **Subcontractor Directory (`/admin/subcontractors` & `/admin/subcontractors/new`)**: Contractor onboarding, 1-click vendor code regeneration, and conflict-guarded deletion (HTTP 409 if active jobs exist).
- **Security Audit Stream (`/admin/audit-logs`)**: Immutable chronological ledger tracking all administrative actions, logins, status changes, dispatches, and deletions with IST timestamps and IP addresses.

---

## 📂 Project Structure

```text
/src
  /app
    /(public)
      /gateway                     # Step 1: Vendor Code Entry
      /gateway/verify              # Step 2: SMS OTP Verification
    /(protected-subcontractor)
      /portal                      # Subcontractor Operations Dashboard
      /portal/job/[jobId]          # Work order, CAD schematics, Geotagged proofs
      /portal/bills                # Subcontractor RA Invoices list
      /portal/bills/new            # Subcontractor 5-step Bill Builder
      /portal/profile              # Subcontractor GSTIN, PAN, and Bank profile
    /(protected-admin)
      /admin                       # Central Operations KPI Dashboard
      /admin/login                 # Admin Gateway with autofill
      /admin/jobs                  # Project Dispatches ledger
      /admin/jobs/new              # Geotagged solar job dispatch form
      /admin/subcontractors        # Contractor Directory
      /admin/subcontractors/new    # Contractor Onboarding form
      /admin/bills                 # Accounts Payable & RA bill review
      /admin/bills/[billId]        # Bill Review & TDS/retention adjustment
      /admin/audit-logs            # Immutable Security Audit Ledger
    /api
      /auth/vendor-login           # Step 1: Code check & OTP dispatch
      /auth/verify-otp             # Step 2: OTP verification & session issuance
      /auth/admin-login            # Server-side admin verification
      /auth/admin-logout           # Admin session invalidation
      /jobs                        # Job listing & creation
      /jobs/[jobId]                # Guarded job deletion (cascade)
      /jobs/[jobId]/status         # Status progression + auto DISCOM trigger
      /jobs/[jobId]/upload         # Geotagged proof upload (S3 / base64)
      /jobs/[jobId]/commissioning-report # Printable DISCOM certificate
      /subcontractors              # Subcontractor listing & onboarding
      /subcontractors/[id]         # Guarded contractor offboarding (HTTP 409)
      /subcontractors/[id]/profile # Statutory profile update (GSTIN/PAN/Bank)
      /subcontractors/[id]/regenerate-code # Cryptographic code rotation
      /subcontractors/export-pdf   # Python ReportLab vendor dossier generator
      /bills                       # RA Bills query & submission
      /bills/[billId]              # Bill review & deduction updates
      /bills/[billId]/pdf          # Download official GST Tax Invoice PDF
      /audit-logs                  # Security audit ledger query stream
  /components                      # Brand UI components, PWA status, layouts
  /lib
    /auth/                         # Session helpers & OTP store
    /offline/sync-manager.ts       # IndexedDB upload vault & sync logic
    /pdf/invoice-generator.ts      # jsPDF GST Tax Invoice generator
    /sms/sender.ts                 # DLT SMS sender abstraction
    /state/mock-db.ts              # In-memory dual-layer database fallback
    /supabase/                     # Supabase SSR browser & server clients
    /utils.ts                      # Cryptographic code generators & formatters
    /zod/schemas.ts                # Runtime Zod validation schemas
  /types/index.ts                  # Global TypeScript interfaces
  /middleware.ts                   # Edge RBAC middleware for /admin/* & /portal/*
/supabase
  schema.sql                       # Core schema, RLS, & audit triggers (347 lines)
  migration_ra_billing.sql         # RA Billing tables, enum, & triggers (257 lines)
/scripts
  generate_369_sop_vendor_dossier_pdf.py # ReportLab Python script for vendor dossiers
/docs                              # Canonical documentation suite
  ARCHITECTURE.md                  # Comprehensive architectural specification
  API.md                           # Exhaustive 23-endpoint API reference
  ROADMAP.md                       # Current roadmap & delivery status
  SETUP_AND_DEPLOYMENT.md          # Local setup & production runbook
  TESTING.md                       # Testing audit & verification blueprints
  DATA_FLOW_AND_SECURITY.md        # End-to-end operational data flows
  /archive/                        # Historical milestone handoffs (Phases 1-3)
```

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/varunlad453-TreY/369-AKR.git
cd 369-AKR
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Pre-configured with live Supabase project `gpwkxifefmygoexiepws.supabase.co`).*

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start -- -p 3000
```
All 26 routes compile cleanly with zero TypeScript errors (`npx tsc --noEmit`).

---

## 🔐 Demo Credentials

| Role | Access URL | Credentials | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Solar Contractor**<br>(Swarajya Construction) | `/gateway` | Vendor Code: `AKR-1114`<br>OTP: `369369` (or dynamic code) | 350 kWp Hingoli project, blueprints, proof upload, RA bills, statutory profile |
| **Solar Contractor**<br>(SuryaShakti EPC) | `/gateway` | Vendor Code: `AKR-JOB-7K9M-SEC`<br>OTP: `369369` (or dynamic code) | 450 kWp Rohtak industrial rooftop & RA-01 invoice |
| **Admin Dispatcher** | `/admin/login` | Email: `dispatcher@369akruniverse.in`<br>Password: `Admin@369AKR!` | Full Dispatcher Control Plane, job creation, contractor management, audit ledger |
| **Finance Officer** | `/admin/bills` | Authenticated Admin Session | Accounts Payable workbench, TDS/retention adjustments, payout authorization |

---

## 📚 Canonical Documentation Suite

For detailed technical specifications, consult the dedicated documentation files:

- [System Architecture Specification](file:///g:/369/docs/ARCHITECTURE.md)
- [API Reference Specification](file:///g:/369/docs/API.md)
- [Project Roadmap & Delivery Status](file:///g:/369/docs/ROADMAP.md)
- [Setup & Deployment Runbook](file:///g:/369/docs/SETUP_AND_DEPLOYMENT.md)
- [Testing & Quality Verification Audit](file:///g:/369/docs/TESTING.md)
- [Data Flow & Security Architecture](file:///g:/369/docs/DATA_FLOW_AND_SECURITY.md)
- [Historical Milestone Archive](file:///g:/369/docs/archive/)

---

## 🏢 Corporate Headquarters

**369 AKR UNIVERSE SOLAR EPC PRIVATE LIMITED**  
Plot 42, Sube Singh Complex, HSIIDC Industrial Estate, Sector 31, Rohtak, Haryana, India 124001  
**Helpline**: +91 98120 37550 / +91 90509 37550  
**Email**: info@369akruniverse.in | central.dispatch@369akruniverse.in  
