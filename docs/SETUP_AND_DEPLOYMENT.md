# Setup & Deployment Guide

**System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
**Last Audited**: September 24, 2026  
**Status**: ACTIVE CANONICAL SETUP GUIDE  

---

## 1. Prerequisites

Before installing the application, ensure your environment meets the following specifications:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended). Compatible with `v18.17+`.
- **npm**: `v10.x` or higher.
- **Git**: For version control operations.
- **Python 3.x** *(Optional)*: Required only if running the Subcontractor KYC Empanelment Dossier script (`scripts/generate_369_sop_vendor_dossier_pdf.py`) with `reportlab` installed:
  ```bash
  pip install reportlab
  ```
  *Note: The primary GST Tax Invoice / RA Bill PDF generator (`src/lib/pdf/invoice-generator.ts`) runs purely in Node.js via `jsPDF` and requires no Python.*

---

## 2. Environment Variables Configuration

Create a `.env.local` file in the project root by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Environment Variable Catalog

| Variable | Required | Default / Reference Value | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `https://gpwkxifefmygoexiepws.supabase.co` | Supabase project REST & Realtime endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `sb_publishable_NE1LcsxqP1EAtTNsA1zLkA_Mgr98evi` | Public client anon key for browser & SSR clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional | `sb_publishable_NE1LcsxqP1EAtTNsA1zLkA_Mgr98evi` | Backward-compatibility alias for latest Supabase SSR |
| `MSG91_AUTH_KEY` | Optional | *(None)* | TRAI DLT transactional SMS auth key |
| `MSG91_TEMPLATE_ID` | Optional | *(None)* | Approved DLT transactional OTP template ID |
| `TWILIO_ACCOUNT_SID` | Optional | *(None)* | Twilio SMS API Account SID |
| `TWILIO_AUTH_TOKEN` | Optional | *(None)* | Twilio SMS API Auth Token |
| `TWILIO_PHONE_NUMBER` | Optional | *(None)* | Twilio E.164 dispatched sender phone number |

> [!NOTE]
> If SMS provider credentials (`MSG91_*` or `TWILIO_*`) are omitted, the system automatically runs in **safe developer simulation mode**, logging the OTP to the server console and exposing it in the API response under `session.demoOtp`.

---

## 3. Local Installation & Development

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
The server will boot with Next.js Turbopack at [http://localhost:3000](http://localhost:3000).

---

## 4. Production Build & Deployment

### Step 1: Execute Type Check
Verify that zero TypeScript compilation errors exist:
```bash
npx tsc --noEmit
```

### Step 2: Build Optimized Production Bundle
```bash
npm run build
```
Next.js compiles all 26 static and dynamic routes. You should see `✓ Generating static pages (26/26)` and `Compiled successfully`.

### Step 3: Launch Production Server
```bash
npm run start -- -p 3000
```

---

## 5. Database Setup & Supabase Migrations

If configuring a fresh Supabase PostgreSQL project, execute the SQL scripts in this exact sequence inside the Supabase SQL Editor:

### Step 1: Execute Core Schema (`supabase/schema.sql`)
- Provisions PostgreSQL extensions (`uuid-ossp`, `pgcrypto`).
- Creates enums (`user_role`, `job_status`, `document_type`).
- Creates core tables: `admins`, `subcontractors`, `jobs`, `job_documents`, `audit_logs`, `otp_rate_limits`.
- Attaches Row Level Security (RLS) policies and the automatic audit log trigger (`trigger_log_job_status`).
- Seeds initial multi-sector infrastructure projects (Solar, Railways, BSNL OFC) and Tier-1 contractors.

### Step 2: Execute RA Billing Migration (`supabase/migration_ra_billing.sql`)
- Extends `subcontractors` with statutory fields (`gst_number`, `pan_number`, `bank_name`, `bank_account_number`, `bank_ifsc`, `bank_branch`).
- Extends `jobs` with work order references (`work_order_no`, `work_order_date`, `contract_amount`).
- Creates `bill_status` enum and tables: `bills` and `bill_items`.
- Configures RLS policies, audit log trigger (`trigger_log_bill_status`), and Realtime CDC publication:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
  ```
- Seeds initial sample RA bills (`SS/2026/RA-01`, `SS/2026/RA-02`).

---

## 6. Demo Credentials & Operational Runbook

| Role | Access URL | Credentials | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Infrastructure Contractor**<br>(Swarajya Construction) | `/gateway` | Vendor Code: `AKR-1114`<br>OTP: `369369` (or dynamic code) | View assigned jobs (Solar/Railways/OFC), CAD schematics, upload geotagged proofs, submit RA bills, edit tax profile |
| **Infrastructure Contractor**<br>(SuryaShakti EPC) | `/gateway` | Vendor Code: `AKR-JOB-7K9M-SEC`<br>OTP: `369369` (or dynamic code) | Rohtak 450 kWp industrial rooftop operations, railway electrification work & RA-01 invoice |
| **Admin Dispatcher** | `/admin/login` | Email: `dispatcher@369akruniverse.in`<br>Password: `Admin@369AKR!` | Dispatch projects, manage contractors, review audit stream, generate vendor codes |
| **Finance Officer** | `/admin/bills` | Authenticated Admin Session | Review submitted RA bills, adjust retention & Section 194C TDS, approve payouts |

---

## 7. Cloud Deployment Considerations

1. **Vercel / Cloudflare / Netlify Serverless**:
   - The primary application (Next.js 15, Supabase SSR, jsPDF Tax Invoices) is 100% serverless compatible.
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the hosting dashboard.
2. **Python Subprocess Caveat**:
   - The route `GET /api/subcontractors/export-pdf` attempts to spawn a local Python process to run `scripts/generate_369_sop_vendor_dossier_pdf.py`. On standard Vercel serverless functions, Python may not be available in the runtime image unless configured via custom Docker or Nixpacks.
   - The route contains a fallback handler to serve pre-generated files if Python execution fails.

---

## 8. Continuous Integration & Quality Gates (CI/CD)

The repository enforces enterprise-grade automated quality gates via GitHub Actions ([`.github/workflows/production-gate.yml`](../.github/workflows/production-gate.yml)) and GitHub Branch Rulesets targeting the `main` branch.

### Automated Quality Gate Matrix
Every `push` to `main` and all `pull_request` events automatically execute the following stages in Node.js 22.x LTS:
1. **Dependency & Build Caching**: Caches `~/.npm` via `actions/setup-node@v4` and `.next/cache` via `actions/cache@v4`.
2. **Static Analysis & Linting**: Executes `npm run lint` (ESLint with Next.js core web vitals).
3. **Strict Type-Safety**: Executes `npx tsc --noEmit` to ensure 0 TypeScript compilation errors.
4. **Automated Unit & Integration Testing**: Executes `npm test` running 36 passing Vitest test suites (Zod validation, cryptographic auth vault, jsPDF GST tax invoices, and vendor compliance dossiers).
5. **Production Build Verification**: Executes `npm run build` validating that all 26 App Router routes statically compile without errors.

### Branch Protection Ruleset
The `main` branch is protected by the **Production Quality Gate** ruleset:
- Restricts branch deletions and blocks force pushes (`git push --force`).
- Requires a pull request before merging with automated approval dismissals on new commits.
- Enforces that the `Production Quality Gate` status check must pass cleanly before merge.

