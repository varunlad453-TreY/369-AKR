# 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)

Enterprise-grade, serverless B2B workforce orchestration platform for **369 AKR UNIVERSE** — India's premier solar energy EPC and utility-scale infrastructure contractor.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15+-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

---

## ⚡ Architecture Overview

```
Static Next.js Marketing Export (Legacy) ────────► Subcontractor Operations Portal (SOP)
- Static HTML/CSS asset exports                    - Dynamic Next.js 15 App Router Serverless Engine
- Zero authentication or contractor access         - Zero-Trust 2-Step Gateway (Vendor Code + DLT SMS OTP)
- Uncontrolled, unencrypted file sharing           - Supabase Storage with Strict Presigned S3 URLs
- No field progress tracking or compliance         - Geotagged GPS Proof-of-Work Verification (Sub-meter)
- Complete lack of operational data security       - PostgreSQL Row-Level Security (RLS) Tenant Isolation
- No audit trail for dispatches or logins          - Immutable PostgreSQL Audit Ledger with IST Logging
```

---

## 🚀 Core Features

### 1. Zero-Trust Subcontractor Gateway (`/gateway`)
- **Step 1: Cryptographic Vendor Code Verification**: Validates 256-bit unique vendor codes (`AKR-JOB-xxxx-SEC`) tying specific solar installations to authorized contractor mobile numbers.
- **Step 2: DLT SMS OTP Authentication**: Dynamic 6-digit one-time password dispatched directly via TRAI DLT-compliant SMS pipelines (MSG91 / Twilio).
- **Anti-Pumping Protection**: Rate-limiting shields endpoints against automated SMS pumping and brute-force abuse.

### 2. Field Operations Portal (`/portal` & `/portal/job/[jobId]`)
- **Interactive Work Order Stepper**: Live 5-stage dispatch progression (`Dispatched` ➔ `En Route` ➔ `On Site` ➔ `In Progress` ➔ `Commissioned`).
- **Presigned CAD Schematics**: High-voltage Single Line Diagrams (SLD) and CAD engineering schematics with presigned S3 URLs.
- **Geotagged Proof-of-Work**: Live satellite GPS coordinate acquisition (`navigator.geolocation`) with tamper-evident milestone watermarking.

### 3. Centralized Admin Control Plane (`/admin`)
- **Real-Time Dispatch Board**: Monitor active dispatches, megawatt capacity under execution, and contractor allocation across North India.
- **Subcontractor Management**: Onboard contractor firms and generate / revoke cryptographic Vendor Codes.
- **Security Audit Ledger (`/admin/audit-logs`)**: Immutable compliance log recording all system events with IST timestamps, actors, and client IP addresses.

---

## 📂 Project Structure

```text
/src
  /app
    /(public)
      /gateway                     # Step 1: Zero-Trust Vendor Code Gateway
      /gateway/verify              # Step 2: DLT SMS OTP Verification
    /(protected-subcontractor)
      /portal                      # Subcontractor Field Operations Dashboard
      /portal/job/[jobId]          # Work Order, CAD schematics, Geotagged Proof
    /(protected-admin)
      /admin                       # Central Dispatcher Control Plane
      /admin/audit-logs            # Immutable Security Audit Ledger
    /api
      /auth/vendor-login           # Code validation & rate-limiting
      /auth/verify-otp             # OTP verification & session issuance
      /jobs                        # Job creation & dispatch queries
      /jobs/[jobId]/status         # Real-time status progression
      /jobs/[jobId]/upload         # Presigned CAD & Geotagged proof uploads
      /subcontractors              # Subcontractor onboarding & code revocation
      /audit-logs                  # Security audit ledger query stream
  /components                      # Brand UI components, navigation, footers
  /lib
    /state/mock-db.ts              # Enterprise database state store
    /zod/schemas.ts                # Strictly typed Zod validation schemas
    /sms/sender.ts                 # DLT-compliant SMS sender abstraction
    /supabase/client.ts            # Supabase PostgreSQL client integration
    /utils.ts                      # Cryptographic Vendor Code generator & formatters
  /types                           # Global TypeScript interface definitions
/supabase
  schema.sql                       # PostgreSQL schema, RLS policies & audit triggers
/docs
  /Handoff docs
    01_handoff_subcontractor_operations_portal_upgrade.md
```

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/varunlad453-TreY/369-AKR.git
cd 369-AKR
npm install
```

### 2. Build for Production
```bash
npm run build
```

### 3. Launch the Server
```bash
npm run start -- -p 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Demo Credentials for Subcontractor Portal

| Role | Access URL | Credentials |
| :--- | :--- | :--- |
| **Subcontractor (Rohtak 450 kWp)** | `/gateway` | Vendor Code: `AKR-JOB-7K9M-SEC`<br>OTP: `369369` (or auto-generated) |
| **Subcontractor (Jaipur 1.2 MWp)** | `/gateway` | Vendor Code: `AKR-JOB-4X2P-SEC`<br>OTP: `369369` (or auto-generated) |
| **Admin Dispatcher** | `/admin` | Unrestricted Dispatcher Control Plane |
| **Audit Compliance Officer** | `/admin/audit-logs` | Immutable audit ledger stream |

---

## 🏢 Corporate Headquarters

**369 AKR UNIVERSE**  
Sube Singh Complex, X3-4624, Rohtak, Haryana, India 124001  
**Phone**: +91 98120 37550 / +91 90509 37550  
**Email**: info@369akruniverse.in  
