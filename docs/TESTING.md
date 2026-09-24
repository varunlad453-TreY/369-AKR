# Testing & Verification Specification

**System**: 369 AKR UNIVERSE — Subcontractor Operations Portal (SOP)  
**Last Audited**: September 24, 2026  
**Status**: ACTIVE CANONICAL TESTING AUDIT  

---

## 1. Truth in Testing: Current Codebase Reality

> [!WARNING]
> **Technical Debt & Verification Gap**:  
> Previous handoff documents (Phase 1 and Phase 3) reported *"100% API Integration Tests Passing"*. A forensic inspection of the codebase reveals that **zero automated test files or test suites currently exist in the repository**.  
> The tests referenced in historical handoffs were executed as ephemeral CLI scratch scripts and were never committed to git or integrated into `package.json`.

### Current `package.json` Scripts
```json
"scripts": {
  "dev": "next dev --turbo",
  "dev:webpack": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```
There is **no** `test` script, and no testing framework (such as Vitest, Jest, Playwright, or Cypress) is currently installed in `dependencies` or `devDependencies`.

---

## 2. Active Quality Assurance Gates

While automated unit and end-to-end test runners are absent, the application currently relies on four robust compile-time and runtime validation gates:

### 2.1 Static Type Safety (`tsc --noEmit`)
- The workspace enforces strict TypeScript 5.7 compilation across all 26 App Router routes, server components, and API route handlers.
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
- **Current Result**: `Exit Code 0` (26/26 static and dynamic pages compile cleanly).

### 2.3 Runtime Zod Schema Guardrails (`src/lib/zod/schemas.ts`)
Every API endpoint and user-facing form validates payloads against strict Zod schemas before database execution:
- `vendorCodeVerificationSchema`: Enforces Base32/alphanumeric code format.
- `otpVerificationSchema`: Enforces exactly 6 numeric digits.
- `jobCreationSchema`: Enforces flat geodetic WGS84 GPS coordinates (`gpsLat`, `gpsLng`), 6-digit Indian PIN codes, and positive capacity values.
- `subcontractorProfileSchema`: Enforces 15-character Indian GSTIN format, 10-character PAN format, and 11-character IFSC codes.
- `billCreationSchema`: Enforces line item descriptions, HSN/SAC codes, positive quantities, and valid tax classifications (`INTRA_STATE` vs `INTER_STATE`).
- `adminBillUpdateSchema`: Restricts bill status transitions and caps retention/TDS percentages to valid 0-100 ranges.

### 2.4 Server-Side Mathematical Computation
- In the RA Billing pipeline (`/api/bills` and `/api/bills/[billId]`), client-submitted monetary totals are completely ignored.
- The server re-calculates all values from primary line items:
  $$\text{Subtotal} = \sum (\text{Quantity} \times \text{Rate})$$
  $$\text{CGST} = \text{Subtotal} \times 0.09, \quad \text{SGST} = \text{Subtotal} \times 0.09 \quad (\text{or } \text{IGST} = \text{Subtotal} \times 0.18)$$
  $$\text{Gross Total} = \text{Subtotal} + \text{Taxes}$$
  $$\text{Net Payable} = \text{Gross Total} - \left(\frac{\text{Subtotal} \times \text{Retention}\%}{100}\right) - \left(\frac{\text{Subtotal} \times \text{TDS}\%}{100}\right)$$

---

## 3. Manual Verification Workflows

Developers and evaluators can manually verify the platform's core workflows using the following procedures:

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
5. Navigate to `/admin/jobs/new` and dispatch a test solar project.
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

## 4. Blueprint for Automated Test Suite (Priority 1)

To transition this codebase to true enterprise maturity, the following automated testing harness should be implemented:

```bash
# Recommended dependencies to install
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom supertest
```

### Proposed Test File Structure
```text
tests/
├── unit/
│   ├── invoice-generator.test.ts    # Verify numberToIndianWords & PDF buffer generation
│   ├── zod-schemas.test.ts          # Test GPS coordinates, GSTIN, PAN, and phone validators
│   └── mock-db.test.ts              # Test in-memory singleton operations & rate limiter
├── integration/
│   ├── auth-vendor-gateway.test.ts  # Test rate limiting, OTP hashing, and session issuance
│   ├── auth-admin.test.ts           # Test admin login, session cookies, and logout
│   ├── jobs-lifecycle.test.ts       # Test job creation, status progression, and delete cascades
│   └── bills-pipeline.test.ts       # Test bill submission, tax math, and status approval
└── e2e/
    └── portal-flow.spec.ts          # Playwright browser flow for PWA & offline vault
```
