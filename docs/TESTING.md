# Testing & Quality Verification Specification

> **System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
> **Last Audited**: September 27, 2026  
> **Status**: ACTIVE CANONICAL TESTING SPECIFICATION (Vitest 5 · 4 Committed Test Suites · 36 Tests · CI/CD Enforced)  

---

## 1. Automated Testing Architecture & Harness

The repository enforces enterprise-grade automated testing using **Vitest 5** (`vitest.config.ts`), `@testing-library/react`, and `@testing-library/jest-dom`. All tests execute locally via `npm test` and are strictly verified in cloud continuous integration via GitHub Actions ([`.github/workflows/production-gate.yml`](file:///g:/369/.github/workflows/production-gate.yml)).

### Current `package.json` Test Scripts
```json
"scripts": {
  "dev": "next dev --turbo",
  "dev:webpack": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "test": "vitest run"
}
```

### Committed Test Suites & Coverage Inventory

| Test Suite File | Domain / Subsystem | Test Count | Scope of Verification |
| :--- | :--- | :---: | :--- |
| [`src/lib/zod/schemas.test.ts`](file:///g:/369/src/lib/zod/schemas.test.ts) | Runtime Data Contracts | **12** | Validates Indian mobile numbers (`+91` and 10-digit), 15-char GSTINs, 10-char PANs, Vendor Codes (`AKR-xxxx`), 6-digit OTP, and 6-digit PIN codes. |
| [`src/lib/pdf/invoice-generator.test.ts`](file:///g:/369/src/lib/pdf/invoice-generator.test.ts) | Financial & Statutory Math | **17** | Validates Intra-state (9% CGST + 9% SGST) vs Inter-state (18% IGST), Section 194C TDS (1% vs 2%), Retention (5% and 10%), fractional paise rounding, Lakhs & Crores currency in words, and `jsPDF` binary buffer generation. |
| [`src/lib/pdf/dossier-generator.test.ts`](file:///g:/369/src/lib/pdf/dossier-generator.test.ts) | Vendor KYC Dossier | **2** | Validates pure in-memory `jsPDF` rendering of institutional vendor dossiers, banking tables, and fallback defaults without Python/OS runtime dependencies. |
| [`src/lib/auth/admin-auth.test.ts`](file:///g:/369/src/lib/auth/admin-auth.test.ts) | Cryptographic Authentication | **5** | Validates `bcryptjs` password hashing (salt rounds: 10/12), SuperAdmin credential verification, constant-time dummy hash execution for non-existent users (timing attack mitigation), and session cookie structure. |
| **Total Automated Tests** | | **36** | **100% Passing in Node.js 22.x LTS** |

---

## 2. Compile-Time & Runtime Quality Assurance Gates

Beyond automated test suites, the codebase is guarded by four layered verification mechanisms:

### 2.1 Static Type Safety (`tsc --noEmit`)
- Strict TypeScript 5.7 compilation across all App Router routes, server components, and API route handlers.
- **Verification Command**:
  ```bash
  npx tsc --noEmit
  ```
- **Current Result**: `Exit Code 0` (0 type errors across the entire codebase).

### 2.2 Next.js Production Compilation (`npm run build`)
- Next.js evaluates all route parameters, dynamic data fetches, client/server component boundaries, and edge middleware bundles.
- **Verification Command**:
  ```bash
  npm run build
  ```
- **Current Result**: `Exit Code 0` (All 26 static and dynamic pages compile cleanly).

### 2.3 Runtime Zod Schema Guardrails (`src/lib/zod/schemas.ts`)
Every API endpoint and user-facing form validates payloads against strict Zod schemas before database execution:
- `vendorCodeVerificationSchema`: Enforces alphanumeric format and minimum length.
- `otpVerificationSchema`: Enforces strictly 6 numeric digits.
- `jobCreationSchema`: Enforces geodetic WGS84 GPS coordinates (`gpsLat`, `gpsLng`), 6-digit Indian PIN codes, and positive capacity values.
- `subcontractorProfileSchema`: Enforces 15-character Indian GSTIN format, 10-character PAN format, and 11-character IFSC codes.
- `billCreationSchema`: Enforces line item descriptions, HSN/SAC codes, positive quantities, and valid tax classifications (`INTRA_STATE` vs `INTER_STATE`).
- `adminBillUpdateSchema`: Restricts bill status transitions and caps retention/TDS percentages to valid 0–100 ranges.

### 2.4 Server-Side Mathematical Computation
- In the RA Billing pipeline ([`/api/bills`](file:///g:/369/src/app/api/bills/route.ts) and [`/api/bills/[billId]`](file:///g:/369/src/app/api/bills/[billId]/route.ts)), client-submitted monetary totals are completely ignored.
- The server re-calculates all values from primary line items:
  $$\text{Subtotal} = \sum (\text{Quantity} \times \text{Rate})$$
  $$\text{CGST} = \text{Subtotal} \times 0.09, \quad \text{SGST} = \text{Subtotal} \times 0.09 \quad (\text{or } \text{IGST} = \text{Subtotal} \times 0.18)$$
  $$\text{Gross Total} = \text{Subtotal} + \text{Taxes}$$
  $$\text{Net Payable} = \text{Gross Total} - \left(\frac{\text{Subtotal} \times \text{Retention}\%}{100}\right) - \left(\frac{\text{Subtotal} \times \text{TDS}\%}{100}\right)$$

---

## 3. Manual Verification Workflows

Developers and field auditors can manually verify the platform's core workflows using the following procedures:

### Test Suite 1: Subcontractor Gateway & Session Verification
1. Open `http://localhost:3000/gateway`.
2. Input Vendor Code: `AKR-1114` (Swarajya Construction).
3. System responds with masked phone: `+91 95526 •••••` and advances to `/gateway/verify`.
4. Input OTP: `369369` (Bypass token) or the dynamic OTP displayed in the server terminal.
5. System sets `akr_sub_session` cookie and redirects to `/portal`.
6. **Pass Criteria**: Subcontractor portal loads with Swarajya Construction's assigned 350 kWp Hingoli project.

### Test Suite 2: Admin Edge RBAC & Dispatch Lifecycle
1. Open `http://localhost:3000/admin` in an incognito window without an active session.
2. **Pass Criteria**: Edge middleware intercepts and redirects (HTTP 307) to `/admin/login?redirectedFrom=%2Fadmin`.
3. Click "Auto-Fill" and submit credentials (`dispatcher@369akruniverse.in` / `Admin@369AKR!`).
4. **Pass Criteria**: Successfully navigates to `/admin` with `akr_admin_session` cookie set.
5. Navigate to `/admin/jobs/new` and dispatch a test infrastructure project (Solar, Railways, or BSNL OFC).
6. Verify the job appears immediately in `/admin/jobs` and in `/admin/audit-logs`.

### Test Suite 3: RA Billing & Tax Invoice PDF Generation
1. Log into `/portal` and navigate to **RA Invoices** (`/portal/bills`).
2. Click **Create New RA Bill** (`/portal/bills/new`).
3. Fill in invoice number (e.g., `TEST/2026/01`), select tax type (`INTRA_STATE`), and enter two line items.
4. Submit bill and verify it appears with status `submitted`.
5. Switch to Admin portal (`/admin/bills`) and click **Review & Verify**.
6. Set Retention to `5%` and TDS u/s 194C to `2%`. Click **Approve Invoice & Authorize Payout**.
7. In the Subcontractor Portal or Admin view, click **Download GST Tax Invoice PDF**.
8. **Pass Criteria**: PDF downloads cleanly, opens in Adobe Acrobat / browser, and displays exact dual borders, Indian currency in words, line items table, and correct deduction subtotals.

---

## 4. Continuous Integration & Quality Gate Enforcement

Every pull request and push to the `main` branch is evaluated against the following strict automated sequence in GitHub Actions ([`.github/workflows/production-gate.yml`](file:///g:/369/.github/workflows/production-gate.yml)):

```
[PR / Push to main]
        │
        ▼
Gate 1: ESLint Static Analysis (`npm run lint`)
        │
        ▼
Gate 2: Strict Type-Check (`npx tsc --noEmit`)
        │
        ▼
Gate 3: Vitest Automated Test Harness (`npm test` — 36 Tests)
        │
        ▼
Gate 4: Next.js Production Route Compilation (`npm run build`)
        │
        ▼
[Merge Permitted / Code Deployed]
```
If any stage fails, merging is blocked automatically by branch rulesets.
