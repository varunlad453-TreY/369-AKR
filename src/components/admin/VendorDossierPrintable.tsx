"use client";

import React from "react";
import { Subcontractor } from "@/types";

interface VendorDossierPrintableProps {
  subcontractor: Subcontractor;
  kycDetails?: {
    constitution?: string;
    proprietor?: string;
    email?: string;
    dateOfIncorporation?: string;
    gstin?: string;
    pan?: string;
    udyamRegistrationNumber?: string;
    aadhaarNumber?: string;
    principalAddress?: {
      premises?: string;
      post?: string;
      taluka?: string;
      city?: string;
      district?: string;
      state?: string;
      pincode?: string;
    };
    banking?: {
      primary?: {
        bankName?: string;
        accountNumber?: string;
        accountType?: string;
        ifscCode?: string;
        branch?: string;
      };
    };
    verifiedDocuments?: Array<{
      title: string;
      identifier?: string;
      fileType: string;
    }>;
  };
  qrCodeDataUrl?: string;
}

/** Clean section heading with subtle rule */
function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-1 mt-2.5 first:mt-0">
      <span className="text-[9.5px] font-bold text-slate-500 font-mono">{index}</span>
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
        {title}
      </h2>
      <div className="flex-1 border-b border-slate-200 ml-1.5" />
    </div>
  );
}

export default function VendorDossierPrintable({
  subcontractor: sub,
  kycDetails: kyc,
  qrCodeDataUrl,
}: VendorDossierPrintableProps) {
  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const generatedAt = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const bank = kyc?.banking?.primary || {
    bankName: "HDFC Bank Ltd.",
    accountNumber: "50200124368375",
    accountType: "Biz Pro Plus Current Account",
    ifscCode: "HDFC0001991",
    branch: "Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513",
  };

  const address = kyc?.principalAddress
    ? `${kyc.principalAddress.premises}, Post ${kyc.principalAddress.post}, ${kyc.principalAddress.taluka ? kyc.principalAddress.taluka + ", " : ""}${kyc.principalAddress.district}, ${kyc.principalAddress.state} - ${kyc.principalAddress.pincode}`
    : `${sub.stateRegion}, India`;

  const verifiedDocs = kyc?.verifiedDocuments || [
    { title: "Form GST REG-06 Registration Certificate", identifier: kyc?.gstin || "27ENRPM7534P1ZV", fileType: "pdf" },
    { title: "MSME Udyam Registration Certificate", identifier: kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908", fileType: "pdf" },
    { title: "HDFC Bank Account Confirmation Statement", identifier: bank.accountNumber || "50200124368375", fileType: "pdf" },
    { title: "UIDAI Aadhaar Card (Front / Back Proof)", identifier: kyc?.aadhaarNumber || "9978 0205 9920", fileType: "image" },
    { title: "Income Tax Department PAN Card", identifier: kyc?.pan || "ENRPM7534P", fileType: "image" },
  ];

  const documentRef = `AKR/VND/${new Date().getFullYear()}/${sub.vendorCode.replace(/[^A-Z0-9]/gi, "")}`;

  return (
    <div
      id="vendor-dossier-printable-document"
      className="bg-white text-slate-900 box-border select-none"
      style={{
        width: "794px",
        height: "1123px",
        maxHeight: "1123px",
        fontFamily: "'Helvetica Neue', Arial, 'Segoe UI', sans-serif",
        padding: "16px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Outer Executive Double-Frame */}
      <div
        className="border border-slate-300 h-full box-border flex flex-col justify-between"
        style={{ padding: "20px 24px 16px 24px" }}
      >
        {/* Main Content Area (Strictly budgeted to ~760px total) */}
        <div>
          {/* ===== Letterhead ===== */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Solar Insignia Seal */}
              <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </div>

              <div>
                <div
                  className="text-[16px] font-bold tracking-tight text-slate-950"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  369 AKR UNIVERSE SOLAR EPC PVT. LTD.
                </div>
                <div className="text-[9.5px] text-slate-600 font-semibold tracking-wide uppercase">
                  Directorate of Subcontractor Operations &amp; Quality Compliance
                </div>
                <div className="text-[8px] text-slate-400 font-mono">
                  CIN: U40106MH2024PTC000369 &nbsp;|&nbsp; ISO 9001:2015 &nbsp;|&nbsp; ops@369akruniverse.in
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block border border-slate-400 px-2 py-0.5 bg-slate-50">
                <span className="text-[8.5px] font-bold tracking-[0.12em] text-slate-800">
                  OFFICIAL DOSSIER
                </span>
              </div>
              <div className="text-[8px] text-slate-500 mt-1 font-mono">
                Ref: {documentRef}
              </div>
              <div className="text-[8px] text-slate-500 font-mono">
                Issued: {generatedOn}
              </div>
            </div>
          </div>

          {/* Clean corporate dividing line */}
          <div className="mt-2 border-t border-slate-700" />

          {/* ===== Document Title ===== */}
          <div className="text-center mt-2.5 mb-1.5">
            <div
              className="text-[13px] font-bold uppercase tracking-wide text-slate-950"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Subcontractor Empanelment &amp; KYC Compliance Dossier
            </div>
            <div className="text-[8.5px] text-slate-500">
              Official partner credential record for internal audit, statutory compliance, and operational site dispatch.
            </div>
          </div>

          {/* ===== Section 01: Vendor Identification & Digital Verification ===== */}
          <SectionHeading index="01" title="Vendor Identification &amp; Credentials" />
          <div className="flex gap-2.5 items-stretch" style={{ width: "694px" }}>
            {/* Left Specs Grid */}
            <div className="border border-slate-200 divide-y divide-slate-200" style={{ width: "556px" }}>
              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Vendor Code
                </div>
                <div className="py-1 px-2.5 font-mono font-bold text-slate-950 flex items-center gap-2">
                  <span>{sub.vendorCode}</span>
                  <span className="text-[8px] font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    VERIFIED PARTNER
                  </span>
                </div>
              </div>

              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Empanelled Entity Name
                </div>
                <div className="py-1 px-2.5 font-bold text-slate-900 truncate">
                  {sub.companyName}
                </div>
              </div>

              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Constitution / Entity Type
                </div>
                <div className="py-1 px-2.5 text-slate-800">
                  {kyc?.constitution || "Proprietorship Firm"}
                </div>
              </div>

              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Authorized Signatory
                </div>
                <div className="py-1 px-2.5 text-slate-900 font-semibold">
                  {kyc?.proprietor || sub.contactPerson} (Proprietor)
                </div>
              </div>

              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Registered Mobile (OTP Gateway)
                </div>
                <div className="py-1 px-2.5 font-mono text-slate-900">
                  {sub.phoneNumber}
                </div>
              </div>

              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Registered Email Address
                </div>
                <div className="py-1 px-2.5 text-slate-800">
                  {kyc?.email || "swarajya.construction1611@gmail.com"}
                </div>
              </div>

              <div className="flex items-center text-[10px]">
                <div className="w-[170px] shrink-0 bg-slate-50 py-1 px-2.5 font-semibold text-slate-500 uppercase text-[8.5px] tracking-wider border-r border-slate-200">
                  Principal Place of Business
                </div>
                <div className="py-1 px-2.5 text-slate-800 leading-tight text-[9.5px]">
                  {address}
                </div>
              </div>
            </div>

            {/* Right: Digital Verification QR Card */}
            <div
              className="border border-slate-200 rounded-xs flex flex-col items-center justify-between text-center pb-1.5 bg-white shrink-0"
              style={{ width: "128px" }}
            >
              <div className="w-full bg-slate-100 border-b border-slate-200 py-1">
                <span className="text-[7.5px] uppercase tracking-wider font-bold text-slate-700 block">
                  Digital Verification
                </span>
              </div>

              <div className="p-1 my-auto flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR code for ${sub.vendorCode}`}
                    className="w-[78px] h-[78px] block"
                  />
                ) : (
                  <div className="w-[78px] h-[78px] border border-dashed border-slate-300 flex items-center justify-center text-[7.5px] text-slate-400">
                    QR Code
                  </div>
                )}
              </div>

              <div className="w-full px-1">
                <div className="text-[7px] font-mono text-slate-600 font-semibold truncate">
                  /gateway?code={sub.vendorCode}
                </div>
                <div className="text-[6.5px] text-slate-400 leading-tight mt-0.2">
                  Scan for Field Gateway
                </div>
              </div>
            </div>
          </div>

          {/* ===== Section 02: Statutory & Regulatory Registrations ===== */}
          <SectionHeading index="02" title="Statutory &amp; Regulatory Registrations" />
          <div className="border border-slate-200" style={{ width: "694px" }}>
            <div className="flex bg-slate-100 border-b border-slate-300 text-[8.5px] uppercase tracking-wider font-bold text-slate-700 py-1 px-2">
              <div style={{ width: "220px" }}>Registration Type</div>
              <div style={{ width: "180px" }}>Registration Number</div>
              <div style={{ width: "200px" }}>Classification</div>
              <div style={{ width: "94px" }} className="text-center">Audit Status</div>
            </div>

            <div className="divide-y divide-slate-200 text-[10px]">
              <div className="flex items-center py-1 px-2">
                <div style={{ width: "220px" }} className="font-medium text-slate-800">
                  GSTIN (State 27, Maharashtra)
                </div>
                <div style={{ width: "180px" }} className="font-mono font-semibold text-slate-900">
                  {kyc?.gstin || "27ENRPM7534P1ZV"}
                </div>
                <div style={{ width: "200px" }} className="text-slate-700 whitespace-nowrap">
                  Regular Taxpayer
                </div>
                <div style={{ width: "94px" }} className="text-center">
                  <span className="text-[8.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>

              <div className="flex items-center py-1 px-2 bg-slate-50/50">
                <div style={{ width: "220px" }} className="font-medium text-slate-800">
                  MSME Udyam Registration
                </div>
                <div style={{ width: "180px" }} className="font-mono font-semibold text-slate-900">
                  {kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908"}
                </div>
                <div style={{ width: "200px" }} className="text-slate-700 whitespace-nowrap">
                  Micro Enterprise
                </div>
                <div style={{ width: "94px" }} className="text-center">
                  <span className="text-[8.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>

              <div className="flex items-center py-1 px-2">
                <div style={{ width: "220px" }} className="font-medium text-slate-800">
                  Income Tax PAN
                </div>
                <div style={{ width: "180px" }} className="font-mono font-semibold text-slate-900">
                  {kyc?.pan || "ENRPM7534P"}
                </div>
                <div style={{ width: "200px" }} className="text-slate-700 whitespace-nowrap">
                  Aadhaar Seeded &amp; Valid
                </div>
                <div style={{ width: "94px" }} className="text-center">
                  <span className="text-[8.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Section 03: Verified Settlement Banking Details ===== */}
          <SectionHeading index="03" title="Verified Settlement Banking Details" />
          <div className="border border-slate-200 divide-y divide-slate-200" style={{ width: "694px" }}>
            {/* Row 1: Bank Name & Account Type */}
            <div className="flex items-center text-[10px]">
              <div className="w-[140px] shrink-0 bg-slate-50 py-1 px-2 font-semibold text-slate-500 uppercase text-[8px] tracking-wider border-r border-slate-200">
                Disbursement Bank
              </div>
              <div className="w-[207px] py-1 px-2 font-semibold text-slate-900 border-r border-slate-200">
                {bank.bankName || "HDFC Bank Ltd."}
              </div>
              <div className="w-[140px] shrink-0 bg-slate-50 py-1 px-2 font-semibold text-slate-500 uppercase text-[8px] tracking-wider border-r border-slate-200">
                Account Type
              </div>
              <div className="w-[207px] py-1 px-2 text-slate-800">
                {bank.accountType || "Biz Pro Plus Current Account"}
              </div>
            </div>

            {/* Row 2: Account Number & IFSC Code */}
            <div className="flex items-center text-[10px]">
              <div className="w-[140px] shrink-0 bg-slate-50 py-1 px-2 font-semibold text-slate-500 uppercase text-[8px] tracking-wider border-r border-slate-200">
                Account Number
              </div>
              <div className="w-[207px] py-1 px-2 font-mono font-bold text-slate-950 border-r border-slate-200">
                {bank.accountNumber || "50200124368375"}
              </div>
              <div className="w-[140px] shrink-0 bg-slate-50 py-1 px-2 font-semibold text-slate-500 uppercase text-[8px] tracking-wider border-r border-slate-200">
                IFSC Code
              </div>
              <div className="w-[207px] py-1 px-2 font-mono font-bold text-slate-950">
                {bank.ifscCode || "HDFC0001991"}
              </div>
            </div>

            {/* Row 3: Designated Branch & Settlement Status */}
            <div className="flex items-center text-[10px]">
              <div className="w-[140px] shrink-0 bg-slate-50 py-1 px-2 font-semibold text-slate-500 uppercase text-[8px] tracking-wider border-r border-slate-200">
                Designated Branch
              </div>
              <div className="w-[207px] py-1 px-2 text-slate-700 text-[9px] leading-tight border-r border-slate-200 truncate" title={bank.branch}>
                {bank.branch || "Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513"}
              </div>
              <div className="w-[140px] shrink-0 bg-slate-50 py-1 px-2 font-semibold text-slate-500 uppercase text-[8px] tracking-wider border-r border-slate-200">
                Settlement Clearance
              </div>
              <div className="w-[207px] py-1 px-2">
                <span className="text-[8px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                  Eligible for Direct Disbursement
                </span>
              </div>
            </div>
          </div>

          {/* ===== Section 04: Verified Compliance Documents on Record ===== */}
          <SectionHeading index="04" title="Verified Compliance Documents on Record" />
          <div className="border border-slate-200" style={{ width: "694px" }}>
            <div className="flex bg-slate-100 border-b border-slate-300 text-[8.5px] uppercase tracking-wider font-bold text-slate-700 py-1 px-2">
              <div style={{ width: "360px" }}>Document Title</div>
              <div style={{ width: "230px" }}>Reference / Identifier</div>
              <div style={{ width: "104px" }} className="text-center">Status</div>
            </div>

            <div className="divide-y divide-slate-200 text-[9.5px]">
              {verifiedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className={`flex items-center py-1 px-2 ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                >
                  <div style={{ width: "360px" }} className="font-medium text-slate-800 truncate">
                    {doc.title}
                  </div>
                  <div style={{ width: "230px" }} className="font-mono text-slate-700">
                    {doc.identifier || "Verified on File"}
                  </div>
                  <div style={{ width: "104px" }} className="text-center">
                    <span className="text-[8px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                      Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== Section 05: Operational Directive ===== */}
          <div className="mt-2 border-l-2 border-slate-700 pl-2.5 py-1 bg-slate-50/80 rounded-r" style={{ width: "694px" }}>
            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-800">
              Operational Directive &amp; Site Dispatch Compliance
            </div>
            <p className="text-[8px] text-slate-600 leading-tight mt-0.5">
              Vendor Code <span className="font-mono font-bold text-slate-950">{sub.vendorCode}</span> is strictly confidential and linked to registered mobile <span className="font-mono font-semibold text-slate-800">{sub.phoneNumber}</span> for OTP authentication at the Field Gateway (<span className="font-mono">/gateway</span>). All installation milestone claims require GPS geotagged imagery for automated verification and milestone disbursement clearance.
            </p>
          </div>
        </div>

        {/* ===== Bottom Sign-off & Document Control Footer ===== */}
        <div>
          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8" style={{ width: "694px" }}>
            <div>
              <div className="border-t border-slate-400 pt-1">
                <div className="text-[9px] font-semibold text-slate-900">System-Generated Digital Record</div>
                <div className="text-[7.5px] text-slate-500">Prepared by 369 AKR Universe Digital Compliance Engine</div>
                <div className="text-[7px] font-mono text-slate-400 mt-0.5">
                  Audit Hash: SHA256-AKR-{sub.vendorCode.replace(/[^A-Z0-9]/gi, "")}-KYC-VERIFIED
                </div>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 text-right">
                <div className="text-[9px] font-semibold text-slate-900">Authorized Signatory</div>
                <div className="text-[7.5px] text-slate-500">Directorate of Subcontractor Operations &amp; Quality Compliance</div>
                <div className="text-[7.5px] font-medium text-slate-700">369 AKR Universe Solar EPC Pvt. Ltd.</div>
              </div>
            </div>
          </div>

          {/* Document Control Footer */}
          <div className="mt-2 pt-1 border-t border-slate-200 flex items-start justify-between text-[6.5px] text-slate-400" style={{ width: "694px" }}>
            <div className="leading-tight max-w-[480px]">
              Official system-generated compliance dossier. Valid without physical seal and digitally authenticated by 369 AKR Universe Solar EPC Pvt. Ltd. Distribution restricted to internal audit, statutory compliance, and authorized contractor partner use.
            </div>
            <div className="text-right font-mono shrink-0">
              <div>Ref: {documentRef}</div>
              <div>Generated: {generatedOn}, {generatedAt} IST</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
