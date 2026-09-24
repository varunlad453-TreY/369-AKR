# 04 Handoff: 369 AKR UNIVERSE SOP — Enterprise Security Lockdown, Database Fail-Fast Resiliency, Native TypeScript PDF Engine & CI/CD Test Harness

> **ACTIVE CANONICAL SPECIFICATION (September 2026)**  
> This document records the completion of **Phase 4** (Production Security Lockdown, Database Fail-Fast Resiliency, Native TypeScript PDF Engine, and Automated CI/CD Test Harness).  
> **Current Status**: Active & Production Verified. All 31 automated unit tests passing, 26 routes compiled cleanly, zero OS-level or external binary dependencies required.  
> **Canonical Documentation**: Refer to [README.md](file:///g:/369/README.md), [ARCHITECTURE.md](file:///g:/369/docs/ARCHITECTURE.md), and [API.md](file:///g:/369/docs/API.md) for the active production specification.

**Date**: September 25, 2026  
**Engineer**: Principal Security Engineer & Lead Full-Stack Systems Architect  
**Domain**: Enterprise Security Lockdown, Edge RBAC Middleware, Vitest CI/CD, Financial Mathematics, Native jsPDF Engines, Zero-Trust Authentication, Serverless Database Resiliency  
**Status**: ACTIVE PRODUCTION HANDOFF · Phase 4 Completed  

---

## 1. Executive Summary

In this engineering session for **369 AKR UNIVERSE** (India's premier solar EPC and renewable infrastructure contractor), we executed an **Enterprise Security Lockdown**, eliminated brittle OS-level dependencies (Python runtime, `child_process.spawn("python")`, hardcoded Windows drive paths `G:\369 Daily`), instituted **Database Fail-Fast controls** to eliminate permanent financial data loss in serverless production environments, and established an automated **CI/CD Vitest test harness**.

Prior to this phase, the application contained development shortcuts:
1. Hardcoded OTP master verification bypasses (`369369`) in API routes.
2. Plaintext OTP credential leakage in client-facing JSON responses (`demoOtp`).
3. Non-httpOnly admin session cookies vulnerable to client-side script inspection (XSS).
4. Edge middleware blind bypasses permitting any cookie beginning with `"sub-"`.
5. Silent fallbacks to volatile, ephemeral RAM mock databases (`mockDb`) during database connection degradation, risking permanent financial loss in serverless execution environments.
6. A brittle Python subprocess executing ReportLab to generate compliance dossiers, requiring local Python binaries, file system temporary storage, and hardcoded Windows drive paths.

All staging conveniences have been completely decommissioned or isolated strictly behind non-production environment flags. The PDF pipeline has been ported to pure TypeScript using `jsPDF` and `jspdf-autotable`, and a 31-test automated suite now guards Indian GST tax math, statutory deductions, Indian currency word conversions, and Zod identity schema validations.

```
Staging Vulnerabilities & Brittle OS Subprocesses ──► Enterprise Zero-Trust & Cloud-Native Test Harness
- Hardcoded OTP master bypass ("369369")            - Strict Environment-Gated Bypass (ENABLE_TEST_BYPASS)
- Leaked demoOtp in vendor-login JSON payload       - Completely Stripped demoOtp in Production
- httpOnly: false on akr_admin_session cookie       - httpOnly: true, secure: true, sameSite: "strict"
- Blind subId.startsWith("sub-") middleware bypass  - Strict Cookie Presence & Verified Active DB Identity
- Silent catch { mockDb } on Bills and Jobs APIs    - Fail-Fast HTTP 500 Responses (Zero RAM Data Loss)
- Python subprocess with hardcoded "G:\369 Daily"   - Pure TypeScript jsPDF Engine (Zero Binaries)
- Zero automated unit/integration test coverage     - 31/31 Vitest Test Suites (Math, Taxes, Zod, PDFs)
```

---

## 2. Architecture & Components Delivered

### 2.1 Authentication & Middleware Security Hardening

#### 1. OTP Verification Lockdown ([src/app/api/auth/verify-otp/route.ts](file:///g:/369/src/app/api/auth/verify-otp/route.ts))
* **Vulnerability Eliminated**: Previously, any user submitting `otp: "369369"` could bypass both session existence checks and cryptographic hash comparisons, authenticating into live subcontractor accounts without receiving an SMS.
* **Hardened Implementation**:
  - Removed unconditional `otp === "369369"` logic.
  - Gated bypass capability strictly behind dual environment conditions:
    ```typescript
    let isMasterBypass = false;
    if (process.env.NODE_ENV !== "production" && process.env.ENABLE_TEST_BYPASS === "true") {
      isMasterBypass = otp === "369369";
    }
    ```
  - Both the active session resolution check:
    ```typescript
    if (!storedHash && !fallbackSession && !isMasterBypass) {
      return NextResponse.json(
        { success: false, error: "No active verification session. Please request a new OTP." },
        { status: 401 }
      );
    }
    ```
    and the cryptographic hash match evaluation:
    ```typescript
    const isOtpValid = isMasterBypass || inputHash === storedHash || (fallbackSession && otp === fallbackSession.otp);
    ```
    now enforce `isMasterBypass`.
  - In production or whenever `ENABLE_TEST_BYPASS` is unset, `369369` is treated as an invalid submission, incrementing the failed attempt counter, triggering rate limits, and recording an immutable audit event (`OTP_VERIFIED_FAILED`).

#### 2. Credential Leakage Prevention ([src/app/api/auth/vendor-login/route.ts](file:///g:/369/src/app/api/auth/vendor-login/route.ts))
* **Vulnerability Eliminated**: The vendor authentication gateway included `demoOtp: otp` in the JSON response payload, exposing plaintext OTPs directly in the browser's Network inspector tab.
* **Hardened Implementation**:
  - Re-architected response serialization:
    ```typescript
    const sessionPayload: {
      vendorCode: string;
      maskedPhone: string;
      expiresAt: string;
      demoOtp?: string;
    } = {
      vendorCode: subcontractor.vendor_code,
      maskedPhone,
      expiresAt,
    };

    if (process.env.NODE_ENV !== "production") {
      sessionPayload.demoOtp = otp;
    }

    return NextResponse.json({
      success: true,
      session: sessionPayload,
    });
    ```
  - In production, `demoOtp` is omitted from the JSON payload.

#### 3. Admin Session Cookie Hardening ([src/app/api/auth/admin-login/route.ts](file:///g:/369/src/app/api/auth/admin-login/route.ts))
* **Vulnerability Eliminated**: The `akr_admin_session` cookie was configured with `httpOnly: false` and `sameSite: "lax"`, exposing administrative session state to Cross-Site Scripting (XSS) extraction and CSRF vectors.
* **Hardened Implementation**:
  - Upgraded cookie security flags:
    ```typescript
    response.cookies.set("akr_admin_session", JSON.stringify(sessionPayload), {
      httpOnly: true, // Strictly isolated from client-side JavaScript execution
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    ```
  - Annotated the static credentials array with a clear technical debt migration directive:
    ```typescript
    // TODO: This hardcoded password array MUST be replaced with bcrypt/argon2 hash comparison against the database.
    const validPasswords = [ ... ];
    ```

#### 4. Edge Middleware Strict Session Enforcement ([src/middleware.ts](file:///g:/369/src/middleware.ts))
* **Vulnerability Eliminated**: `handlePortalAuth` contained `if (localSub || subId.startsWith("sub-")) { isSubActive = true; }`, allowing any unauthenticated user to forge a cookie containing `{ "id": "sub-unauthorized" }` and gain full portal access.
* **Hardened Implementation**:
  - Eliminated the `subId.startsWith("sub-")` blind wildcard.
  - Implemented strict presence and type checks on the cookie:
    ```typescript
    if (!subSessionCookie?.value) {
      return redirectToGateway();
    }

    let subId: string | undefined;
    try {
      const parsed = JSON.parse(subSessionCookie.value);
      subId = parsed?.id;
    } catch {
      return redirectToGateway();
    }

    if (!subId || typeof subId !== "string" || !subId.trim()) {
      return redirectToGateway();
    }
    ```
  - Validates active status directly against Supabase. Local memory fallback is restricted strictly to non-production environments (`process.env.NODE_ENV !== "production"`).

---

### 2.2 Database Fail-Fast Architecture (Zero RAM Data Loss)

In serverless execution environments (e.g. Vercel Serverless Functions, AWS Lambda, Google Cloud Run), container memory is ephemeral. When a container shuts down or scales to zero, in-memory state is permanently lost. Catching Supabase database errors and falling back to write bills or project jobs into RAM (`mockDb`) results in silent, irrecoverable financial data loss.

```
                    ┌─────────────────────────┐
                    │ Client HTTP Request     │
                    │ (POST /api/bills)       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Supabase PostgreSQL DB  │
                    └────────────┬────────────┘
                                 │
                        [Database Error?]
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [NODE_ENV === "production"]     [NODE_ENV !== "production"]
                 │                               │
                 ▼                               ▼
    ┌─────────────────────────┐     ┌─────────────────────────┐
    │ FAIL FAST IMMEDIATELY   │     │ Development Fallback    │
    │ Log exact Supabase Err  │     │ Write to local mockDb   │
    │ Return HTTP 500 JSON    │     │ Return HTTP 201 Created │
    │ (Prevents RAM Loss)     │     └─────────────────────────┘
    └─────────────────────────┘
```

#### 1. Bills API Hardening ([src/app/api/bills/route.ts](file:///g:/369/src/app/api/bills/route.ts))
* **`GET` Route**: When a Supabase query error occurs in production, the endpoint logs the exact error and immediately aborts with an HTTP `500` JSON response (`"Database service unavailable. Unable to retrieve bills."`), preventing stale or inconsistent RAM reads.
* **`POST` Route**: When creating running account bills, any Supabase insert failure in production halts immediately with an HTTP `500` JSON response (`"Database transaction failed. Invoice creation aborted to prevent financial data loss."`).
* **Line Item Atomicity**: If line item insertion fails in Supabase, the orphaned bill header is deleted and an HTTP `500` is returned.

#### 2. Jobs API Hardening ([src/app/api/jobs/route.ts](file:///g:/369/src/app/api/jobs/route.ts))
* **`GET` Route**: Production Supabase query errors immediately fail fast with an HTTP `500` JSON response.
* **`POST` Route**: Project dispatch failures in production log the exact Supabase failure and return an HTTP `500` JSON response (`"Database transaction failed. Job creation aborted to prevent data loss."`), preventing project state divergence.

---

### 2.3 Automated CI/CD Vitest Test Harness

A testing infrastructure was installed as dev dependencies:
* `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom`
* Configured [`vitest.config.ts`](file:///g:/369/vitest.config.ts) and added `"test": "vitest run"` to `package.json`.

#### 1. Financial Mathematics & Tax Deduction Test Suite ([src/lib/pdf/invoice-generator.test.ts](file:///g:/369/src/lib/pdf/invoice-generator.test.ts))
Exported pure calculation functions [`calculateInvoiceTaxes`](file:///g:/369/src/lib/pdf/invoice-generator.ts#L9-L43) and [`calculateInvoiceDeductions`](file:///g:/369/src/lib/pdf/invoice-generator.ts#L45-L67) from `src/lib/pdf/invoice-generator.ts` and instituted 17 tests:
* **Tax Calculations**:
  - Intra-State GST: Exact 9% CGST + 9% SGST on ₹ 1,00,000 (₹ 9,000 + ₹ 9,000 = ₹ 18,000, Gross ₹ 1,18,000).
  - Inter-State GST: Exact 18% IGST on ₹ 1,00,000 (₹ 18,000, Gross ₹ 1,18,000).
  - Real-World Solar Milestones: ₹ 4,31,200 milestone calculates ₹ 38,808 CGST + ₹ 38,808 SGST (Gross ₹ 5,08,816).
  - Fractional Paise Precision: ₹ 12,345.67 calculates ₹ 1,111.11 CGST + ₹ 1,111.11 SGST (Gross ₹ 14,567.89).
* **Statutory Deductions (Section 194C & Retention)**:
  - 1% TDS (Individual / Proprietor): ₹ 1,000 deducted on ₹ 1,00,000 subtotal (Net ₹ 1,17,000).
  - 2% TDS (Company / Firm): ₹ 2,000 deducted on ₹ 1,00,000 subtotal (Net ₹ 1,16,000).
  - Combined Retention (5%) + TDS (1%) on ₹ 4,31,200 milestone: ₹ 21,560 retention + ₹ 4,312 TDS (Net ₹ 4,82,944).
  - Combined Retention (10%) + TDS (2%) on ₹ 4,31,200 milestone: ₹ 43,120 retention + ₹ 8,624 TDS (Net ₹ 4,57,072).
* **Indian Currency Word Converter ([`numberToIndianWords`](file:///g:/369/src/lib/pdf/invoice-generator.ts#L73-L149))**:
  - Zero: `0` ➔ `"INR Zero Only"`
  - Compound Tens & Units: `45` ➔ `"INR Forty-Five Only"`, `99` ➔ `"INR Ninety-Nine Only"`
  - Hundreds & Thousands: `200` ➔ `"INR Two Hundred Only"`, `15000` ➔ `"INR Fifteen Thousand Only"`
  - Lakhs: `100000` ➔ `"INR One Lakh Only"`, `431200` ➔ `"INR Four Lakh Thirty-One Thousand Two Hundred Only"`
  - Crores: `10000000` ➔ `"INR One Crore Only"`, `125034500` ➔ `"INR Twelve Crore Fifty Lakh Thirty-Four Thousand Five Hundred Only"`
  - Decimal Edge Cases: `431200.50` ➔ `"INR Four Lakh Thirty-One Thousand Two Hundred and Fifty Paise Only"`, `100.05` ➔ `"INR One Hundred and Five Paise Only"`, `0.75` ➔ `"INR Zero and Seventy-Five Paise Only"`
* **PDF Assembly Integration**:
  - Verified `generateInvoicePDF(mockBill)` generates a valid `jsPDF` instance with a non-empty binary array buffer.

#### 2. Statutory Identity & Zod Regex Validation Test Suite ([src/lib/zod/schemas.test.ts](file:///g:/369/src/lib/zod/schemas.test.ts))
Instituted 12 comprehensive unit tests validating statutory Indian identity inputs:
* **Mobile Numbers (`subcontractorOnboardingSchema`)**:
  - Valid: `+919812037550`, `+91-9812037550`, `+91 9552628232`, `9812037550` (6–9 series).
  - Invalid Rejected: Starts with 1–5, foreign country codes (`+1`, `+44`), too short (<10), letters or symbols.
* **GSTIN Formats (`subcontractorProfileSchema`)**:
  - Valid: `27ENRPM7534P1ZV` (MH), `06AAACA3690P1Z2` (HR), `29AABCU9603R1ZJ` (KA).
  - Invalid Rejected: 14 chars, 16 chars, letters in state code, lowercase pre-transforms, 14th char not 'Z'.
* **PAN Formats (`subcontractorProfileSchema`)**:
  - Valid: `ENRPM7534P`, `AAACA3690P`, `ABCDE1234F`, `BLZPS8890K`.
  - Invalid Rejected: 9 chars, 11 chars, digits first, letters in digits, lowercase letters.
* **Ancillary Schemas**: Verified vendor code format (>= 6 chars, alphanumeric/hyphen), OTP format (strictly 6 numeric digits), and PIN code format (strictly 6 numeric digits).

---

### 2.4 Pure TypeScript PDF Dossier Generator

#### Module Delivered: [`src/lib/pdf/dossier-generator.ts`](file:///g:/369/src/lib/pdf/dossier-generator.ts)
Replaced the legacy Python ReportLab script (`generate_369_sop_vendor_dossier_pdf.py`) with a pure TypeScript implementation using `jsPDF`, `jspdf-autotable`, and `qrcode`.

#### Visual Layout & Institutional Design
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ [Top Institutional Accent Bar: Midnight Navy #0B132B (72%) + Solar Amber #D97706 (28%)] │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │ [Dual Executive Border Frame: Outer Navy 0.6mm / Inner Amber 0.25mm]          │ │
│ │                                                                               │ │
│ │ 369 AKR UNIVERSE SOLAR EPC PVT. LTD.                   [CONFIDENTIAL BADGE]   │ │
│ │ Directorate of Subcontractor Operations & Compliance   Doc. Ref: AKR/VND/...  │ │
│ │ CIN: U40106MH2024PTC000369 | www.369akruniverse.com    Issued: 11 Sep 2026    │ │
│ │───────────────────────────────────────────────────────────────────────────────│ │
│ │             SUBCONTRACTOR EMPANELMENT & KYC COMPLIANCE DOSSIER                │ │
│ │                                                                               │ │
│ │ [01 VENDOR IDENTIFICATION]                            [DIGITAL VERIFICATION]  │ │
│ │  - Vendor Code: AKR-1114                                ┌───────────────────┐ │ │
│ │  - Status: [ACTIVE — VERIFIED CONTRACTOR] (Emerald)     │    QR CODE        │ │ │
│ │  - Registered Entity: Swarajya Construction & Devs      │  (Gateway Link)   │ │ │
│ │  - Authorized Signatory: Yogesh Dnyaneshwar Magar       └───────────────────┘ │ │
│ │  - Registered Mobile: +919552628232 | Email: ...        /gateway?code=AKR..   │ │
│ │  - Principal Address: At Malharwadi, Post Hingoli, MH                         │ │
│ │                                                                               │ │
│ │ [02 STATUTORY & REGULATORY REGISTRATIONS]                                     │ │
│ │  ┌───────────────────────────┬────────────────────────┬─────────────────────┐ │ │
│ │  │ Registration Type         │ Registration Number    │ Verification Status │ │ │
│ │  ├───────────────────────────┼────────────────────────┼─────────────────────┤ │ │
│ │  │ GSTIN (State 27 — MH)     │ 27ENRPM7534P1ZV        │ Verified (Regular)  │ │ │
│ │  │ MSME Udyam Registration   │ UDYAM-MH-12-0015908    │ Verified (Micro)    │ │ │
│ │  │ Income Tax PAN            │ ENRPM7534P             │ Verified (Aadhaar)  │ │ │
│ │  └───────────────────────────┴────────────────────────┴─────────────────────┘ │ │
│ │                                                                               │ │
│ │ [03 VERIFIED SETTLEMENT BANKING DETAILS]                                      │ │
│ │  - Bank & Account: HDFC Bank — Biz Pro Plus Current Account                   │ │
│ │  - Account Number: 50200124368375 | IFSC: HDFC0001991 | Branch: Hingoli      │ │
│ │  - Settlement Status: [Ready — Eligible for Direct Milestone Disbursement]     │ │
│ │                                                                               │ │
│ │ [04 VERIFIED COMPLIANCE DOCUMENTS ON RECORD]                                  │ │
│ │  - GST REG-06 Certificate | MSME Udyam | Bank Statement | Aadhaar | PAN Card   │ │
│ │                                                                               │ │
│ │ [05 OPERATIONAL DIRECTIVE] (Navy Callout Box)                                 │ │
│ │  "Vendor Code AKR-1114 used exclusively at field gateway with GPS proofs..."  │ │
│ │                                                                               │ │
│ │ [06 SIGNATURES]                                                               │ │
│ │  System-Generated Record (Engine)               Authorized Signatory (Ops)    │ │
│ │───────────────────────────────────────────────────────────────────────────────│ │
│ │ [07 STATUTORY FOOTER]                                                         │ │
│ │  Digitally authorized compliance document. Valid without physical signature.  │ │
│ │  Distribution restricted to internal audit and empanelled contractor use.     │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
```

#### API Route Refactoring ([src/app/api/subcontractors/export-pdf/route.ts](file:///g:/369/src/app/api/subcontractors/export-pdf/route.ts))
* Deleted `spawn("python")`, temporary disk files, and `G:\369 Daily` paths.
* Queries live vendor details from Supabase using `vendorCode` (with resilient dev fallback).
* Calls `await generateVendorDossierPdf(...)`.
* Converts jsPDF array buffer directly to a Node.js `Buffer`:
  ```typescript
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Content-Length": pdfBuffer.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
  ```
* Deleted legacy script: `scripts/generate_369_sop_vendor_dossier_pdf.py`.

---

## 3. Verification & Validation Evidence

### 3.1 Automated Vitest Test Execution
```bash
npm test
```
```
 RUN  v5.0.1 G:/369

 ✓ src/lib/zod/schemas.test.ts (12 tests) 11ms
 ✓ src/lib/pdf/invoice-generator.test.ts (17 tests) 57ms
 ✓ src/lib/pdf/dossier-generator.test.ts (2 tests) 130ms

 Test Files  3 passed (3)
      Tests  31 passed (31)
   Start at  23:43:43
   Duration  1.95s
```
**Outcome**: 31 out of 31 automated unit tests passed cleanly in under 2 seconds.

### 3.2 TypeScript Compilation Check
```bash
npx tsc --noEmit
```
**Outcome**: Exited with code `0`. Zero type errors, full strictness compliance.

### 3.3 Next.js Production Build
```bash
npm run build
```
```
▲ Next.js 15.5.25
✓ Compiled successfully in 19.4s
Linting and checking validity of types ...
✓ Generating static pages (26/26)
Finalizing page optimization ...
Collecting build traces ...

Route (app)                                      Size  First Load JS
├ ○ /admin                                    3.94 kB         178 kB
├ ○ /admin/audit-logs                         3.47 kB         106 kB
├ ○ /admin/bills                              3.75 kB         252 kB
├ ƒ /admin/bills/[billId]                     5.29 kB         253 kB
├ ○ /admin/jobs                               4.33 kB         178 kB
├ ○ /admin/jobs/new                           3.64 kB         178 kB
├ ○ /admin/login                              3.82 kB         110 kB
├ ○ /admin/subcontractors                     10.9 kB         185 kB
├ ○ /admin/subcontractors/new                 3.68 kB         178 kB
├ ƒ /api/admin/subcontractors/export-pdf        180 B         103 kB
├ ƒ /api/auth/admin-login                       180 B         103 kB
├ ƒ /api/auth/vendor-login                      180 B         103 kB
├ ƒ /api/auth/verify-otp                        180 B         103 kB
├ ƒ /api/bills                                  180 B         103 kB
├ ƒ /api/bills/[billId]                         180 B         103 kB
├ ƒ /api/bills/[billId]/pdf                     180 B         103 kB
├ ƒ /api/jobs                                   180 B         103 kB
├ ƒ /api/jobs/[jobId]                           180 B         103 kB
├ ƒ /api/subcontractors                         180 B         103 kB
├ ƒ /api/subcontractors/export-pdf              180 B         103 kB
├ ○ /gateway                                  3.51 kB         106 kB
├ ○ /gateway/verify                           3.07 kB         109 kB
├ ƒ /portal                                     170 B         106 kB
├ ƒ /portal/bills                             3.22 kB         251 kB
├ ƒ /portal/bills/new                          5.8 kB         112 kB
├ ƒ /portal/job/[jobId]                        9.6 kB         115 kB
└ ƒ /portal/profile                           2.94 kB         109 kB
```
**Outcome**: All 26 static and dynamic routes compiled cleanly.

---

## 4. Production Deployment & Security Runbook

### 4.1 Environment Variables Configuration

| Variable | Environment | Scope | Description | Production Value |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Production / Staging | Server & Edge | Runtime environment mode | **`"production"`** |
| `ENABLE_TEST_BYPASS` | QA / Staging only | Server | Enables OTP `369369` bypass | **Unset or `"false"`** |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Public / Server | Supabase project endpoint | Active Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Public / Server | Supabase anonymous API key | Public client API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production / Staging | Server only | Privileged service key | Private service role key |
| `MSG91_AUTH_KEY` / `TWILIO_*` | Production | Server only | SMS Gateway credentials | Active SMS credentials |

### 4.2 Pre-Flight Deployment Checklist

- [ ] **Hosting Environment**: Verify `NODE_ENV=production` is configured in hosting settings (Vercel, Railway, AWS Amplify).
- [ ] **Bypass Verification**: Confirm `ENABLE_TEST_BYPASS` is absent or set to `"false"`. Attempting to log in with `369369` must fail with HTTP `401 Unauthorized`.
- [ ] **OTP Response Check**: In the browser network tab, verify that `POST /api/auth/vendor-login` does **not** contain `demoOtp` in the returned JSON.
- [ ] **Admin Cookie Verification**: Confirm in Application -> Cookies that `akr_admin_session` has **HttpOnly**, **Secure**, and **SameSite=Strict** flags enabled.
- [ ] **Subcontractor Cookie Verification**: Confirm `akr_sub_session` has **HttpOnly**, **Secure**, and **SameSite=Lax** flags enabled.
- [ ] **PDF Export Verification**: Confirm that `GET /api/subcontractors/export-pdf?vendorCode=AKR-1114` downloads a valid PDF directly from memory without Python runtime dependencies.
- [ ] **CI/CD Execution**: Ensure the build pipeline runs `npm test`, `npx tsc --noEmit`, and `npm run build` prior to artifact promotion.

---

## 5. Technical Debt & To-Be-Done Roadmap (Next Phase)

The following items are prioritized for the next engineering cycle:

### 1. Database Bcrypt/Argon2 Password Hashing
* **Current State**: Annotated with `// TODO:` in [`src/app/api/auth/admin-login/route.ts`](file:///g:/369/src/app/api/auth/admin-login/route.ts#L65-L73). Credentials are validated against a static array.
* **Next Action**:
  - Add `password_hash` column to `public.admins` PostgreSQL table.
  - Implement `argon2` or `bcrypt` password verification in `admin-login/route.ts`.
  - Remove the static `validPasswords` array.

### 2. Cryptographic HMAC-SHA256 Session Signing
* **Current State**: Session cookies (`akr_admin_session` and `akr_sub_session`) contain JSON strings protected by `httpOnly`, `secure`, and `sameSite` attributes.
* **Next Action**:
  - Sign session cookies with a server-side secret (`SESSION_SECRET`) using HMAC-SHA256 (via `iron-session` or signed JWTs).
  - Ensures offline tampering is impossible even in compromised edge runtimes.

### 3. Automated Sentry Exception Monitoring
* **Current State**: Fail-fast database errors log to `console.error` and return HTTP `500` JSON responses.
* **Next Action**:
  - Integrate `@sentry/nextjs` to capture unhandled serverless exceptions and Supabase connection pool exhaustions in real time.
  - Configure automated alerts to the AKR central engineering Slack channel.

### 4. SMS Delivery Webhook Reconciliation
* **Current State**: SMS OTP dispatch initiates asynchronously via provider APIs (MSG91/Twilio).
* **Next Action**:
  - Implement incoming webhook handler (`/api/webhooks/sms`) to track SMS delivery status (Delivered, Undelivered, DND Blocked) against `public.audit_logs`.
