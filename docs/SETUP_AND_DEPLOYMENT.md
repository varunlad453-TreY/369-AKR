# Setup & Deployment Guide

> **System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
> **Last Audited**: September 27, 2026  
> **Status**: ACTIVE CANONICAL SETUP & DEPLOYMENT GUIDE (Node 22 LTS · Supabase PostgreSQL 15+ · Pure TypeScript Serverless)  

---

## 1. Prerequisites

Before installing the application, ensure your environment meets the following specifications:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended, matching `.github/workflows/production-gate.yml`).
- **npm**: `v10.x` or higher.
- **Git**: For version control operations.
- **Pure JavaScript/TypeScript Stack**: Zero Python, ReportLab, or OS-level binary dependencies required. Both the GST Tax Invoice generator ([`src/lib/pdf/invoice-generator.ts`](file:///g:/369/src/lib/pdf/invoice-generator.ts)) and the Subcontractor KYC Empanelment Dossier generator ([`src/lib/pdf/dossier-generator.ts`](file:///g:/369/src/lib/pdf/dossier-generator.ts)) execute natively in-memory via `jsPDF`.

---

## 2. Environment Variables Configuration

Create a `.env.local` file in the project root by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Environment Variable Catalog

| Variable | Required | Default / Reference Value | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `https://gpwkxifefmygoexiepws.supabase.co` | Supabase project REST & Realtime endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `sb_publishable_NE1LcsxqP1EAtTNsA1zLkA_Mgr98evi` | Public client anon key for browser & SSR clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional | `sb_publishable_NE1LcsxqP1EAtTNsA1zLkA_Mgr98evi` | Backward-compatibility alias for latest Supabase SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | *(Service Role Key)* | Privileged server-side key for administrative database operations (bypasses RLS) |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | *(Sentry DSN URL)* | Sentry client & server error telemetry ingestion endpoint |
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

### Step 2: Execute Automated Quality Suite
```bash
npm test
```
Executes all 36 automated unit and integration tests across Zod schemas, billing calculations, and authentication vault.

### Step 3: Start Development Server
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
Next.js compiles all routes, error boundaries, and API handlers. You should see `Compiled successfully` with zero errors.

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

### Step 3: Execute Admin Identity Vault Migration (`supabase/migrations/20260925000000_create_admins_vault.sql`)
- Provisions the isolated `public.system_admins` cryptographic vault table.
- Stores bcrypt-hashed passwords (salt rounds: 10/12) and tracks `failed_login_attempts`, `locked_until`, and `last_login`.
- Attaches RLS policy denying all public/anon access (`service_role` privileged access only).
- Seeds initial SuperAdmin record (`dispatcher@369akruniverse.in`).
- Use [`scripts/generate-admin-hash.js`](file:///g:/369/scripts/generate-admin-hash.js) to generate new password hashes:
  ```bash
  node scripts/generate-admin-hash.js "YourSecurePassword"
  ```

---

## 6. Demo Credentials & Operational Runbook

| Role | Access URL | Credentials | Operational Scope |
| :--- | :--- | :--- | :--- |
| **Infrastructure Contractor**<br>(Swarajya Construction) | `/gateway` | Vendor Code: `AKR-1114`<br>OTP: `369369` (or dynamic code) | View assigned jobs (Solar/Railways/OFC), CAD schematics, upload geotagged proofs, submit RA bills, edit tax profile |
| **Infrastructure Contractor**<br>(SuryaShakti EPC) | `/gateway` | Vendor Code: `AKR-JOB-7K9M-SEC`<br>OTP: `369369` (or dynamic code) | Rohtak 450 kWp industrial rooftop operations, railway electrification work & RA-01 invoice |
| **Admin Dispatcher** | `/admin/login` | Email: `dispatcher@369akruniverse.in`<br>Password: `Admin@369AKR!` | Dispatch projects, manage contractors, review audit stream, generate vendor codes |
| **Finance Officer** | `/admin/bills` | Authenticated Admin Session | Review submitted RA bills, adjust retention & Section 194C TDS, approve payouts |

---

## 7. Cloud Deployment & Observability Runbook

1. **Vercel / Cloudflare / Netlify Serverless**:
   - The application (Next.js 15, Supabase SSR, jsPDF Tax Invoices, jsPDF Vendor Dossiers) is **100% serverless-native**.
   - No Python runtime or external OS binaries are required.
   - Configure environment variables in the hosting dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXT_PUBLIC_SENTRY_DSN`
2. **Production Fail-Fast Database Circuit**:
   - In production (`NODE_ENV === 'production'`), API route handlers strictly fail-fast and return HTTP 500 when Supabase is unreachable or database writes fail, completely blocking fallback to in-memory state to protect ledger integrity.
   - All failures emit structured telemetry logs to Sentry and stdout (Datadog/Axiom).
3. **Observability & Error Boundaries**:
   - Nested route crashes are captured by [`src/app/error.tsx`](file:///g:/369/src/app/error.tsx).
   - Root layout crashes are isolated by [`src/app/global-error.tsx`](file:///g:/369/src/app/global-error.tsx).
   - Real-time error telemetry is managed by the singleton [`src/lib/logger.ts`](file:///g:/369/src/lib/logger.ts).

---

## 8. Continuous Integration & Quality Gates (CI/CD)

The repository enforces enterprise-grade automated quality gates via GitHub Actions ([`.github/workflows/production-gate.yml`](file:///g:/369/.github/workflows/production-gate.yml)) and GitHub Branch Rulesets targeting the `main` branch.

### Automated Quality Gate Sequence
Every `push` to `main` and all `pull_request` events automatically execute the following stages in Node.js 22.x LTS:
1. **Dependency & Build Caching**: Caches `~/.npm` via `actions/setup-node@v4` and `.next/cache` via `actions/cache@v4`.
2. **Static Analysis & Linting**: Executes `npm run lint` (ESLint with Next.js core web vitals).
3. **Strict Type-Safety**: Executes `npx tsc --noEmit` to ensure 0 TypeScript compilation errors.
4. **Automated Unit & Integration Testing**: Executes `npm test` running 36 passing Vitest test suites (Zod validation, cryptographic auth vault, jsPDF GST tax invoices, and vendor compliance dossiers).
5. **Production Build Verification**: Executes `npm run build` validating that all routes statically compile without errors.

### Branch Protection Ruleset
The `main` branch is protected by the **Production Quality Gate** ruleset:
- Restricts branch deletions and blocks force pushes (`git push --force`).
- Requires a pull request before merging with automated approval dismissals on new commits.
- Enforces that the `Production Quality Gate` status check must pass cleanly before merge.
