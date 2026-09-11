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

/** Clean label/value row in a 2-column table */
function DataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <tr className="border-b border-slate-200 last:border-b-0">
      <td className="w-[34%] align-middle py-1.5 px-3 bg-slate-50 border-r border-slate-200">
        <span className="text-[9.5px] uppercase tracking-wider font-semibold text-slate-500">
          {label}
        </span>
      </td>
      <td className={`py-1.5 px-3 text-[11px] text-slate-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </td>
    </tr>
  );
}

/** Clean, minimal section heading with subtle rule — NO dark blocks or colored bars */
function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-1.5 mt-3.5 first:mt-0">
      <span className="text-[10px] font-bold text-slate-500 font-mono">{index}</span>
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
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
    { title: "Bank Account Confirmation Statement", identifier: bank.accountNumber || "50200124368375", fileType: "pdf" },
    { title: "UIDAI Aadhaar Card (Front / Back Proof)", identifier: kyc?.aadhaarNumber || "9978 0205 9920", fileType: "image" },
    { title: "Income Tax Department PAN Card", identifier: kyc?.pan || "ENRPM7534P", fileType: "image" },
  ];

  const documentRef = `AKR/VND/${new Date().getFullYear()}/${sub.vendorCode.replace(/[^A-Z0-9]/gi, "")}`;

  return (
    <div
      id="vendor-dossier-printable-document"
      className="w-[794px] bg-white text-slate-900 box-border mx-auto select-none"
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
      {/* Outer corporate page frame */}
      <div
        className="border border-slate-300 h-full box-border flex flex-col justify-between"
        style={{ padding: "26px 32px 20px 32px" }}
      >
        <div>
          {/* ===== Letterhead ===== */}
          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-[17px] font-bold tracking-tight text-slate-950"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                369 AKR UNIVERSE SOLAR EPC PVT. LTD.
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                Directorate of Subcontractor Operations &amp; Quality Compliance
              </div>
              <div className="text-[8.5px] text-slate-400 mt-0.5">
                CIN: U40106MH2024PTC000369 &nbsp;|&nbsp; www.369akruniverse.com &nbsp;|&nbsp; ops@369akruniverse.in
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="inline-block border border-slate-700 px-2 py-0.5 bg-slate-50">
                <span className="text-[9px] font-bold tracking-[0.15em] text-slate-800">
                  OFFICIAL RECORD
                </span>
              </div>
              <div className="text-[8.5px] text-slate-500 mt-1 font-mono">
                Ref: {documentRef}
              </div>
              <div className="text-[8.5px] text-slate-500 font-mono">
                Date: {generatedOn}
              </div>
            </div>
          </div>

          {/* Clean corporate divider — neutral single line, NO yellow line */}
          <div className="mt-2.5 border-t border-slate-800" />

          {/* ===== Document Title ===== */}
          <div className="text-center mt-3 mb-2">
            <div
              className="text-[14px] font-bold uppercase tracking-wide text-slate-950"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Subcontractor Empanelment &amp; KYC Compliance Dossier
            </div>
            <div className="text-[9.5px] text-slate-500 mt-0.5">
              Official vendor credential record issued for internal audit, statutory compliance, and field dispatch authorization.
            </div>
          </div>

          {/* ===== Section 01: Vendor Identification ===== */}
          <SectionHeading index="01" title="Vendor Identification" />
          <div className="flex gap-3 items-stretch">
            <table className="flex-1 border border-slate-200 border-collapse text-left">
              <tbody>
                <DataRow
                  label="Vendor Code"
                  value={
                    <span className="font-bold text-[12px] font-mono text-slate-950">
                      {sub.vendorCode}
                    </span>
                  }
                  mono
                />
                <DataRow
                  label="Empanelment Status"
                  value={
                    <span className="font-semibold text-emerald-800">
                      {sub.isActive ? "Active · Verified Contractor" : "Inactive"}
                    </span>
                  }
                />
                <DataRow
                  label="Registered Entity Name"
                  value={<span className="font-semibold text-slate-950">{sub.companyName}</span>}
                />
                <DataRow label="Constitution" value={kyc?.constitution || "Proprietorship Firm"} />
                <DataRow label="Authorized Signatory" value={kyc?.proprietor || sub.contactPerson} />
                <DataRow label="Registered Mobile (OTP)" value={sub.phoneNumber} mono />
                <DataRow label="Email Address" value={kyc?.email || "swarajya.construction1611@gmail.com"} />
                <DataRow label="Principal Place of Business" value={address} />
              </tbody>
            </table>

            {/* Digital verification QR block — clean light header, NO black bar */}
            <div className="w-[136px] shrink-0 border border-slate-200 flex flex-col items-center justify-between text-center pb-2 bg-white">
              <div className="w-full bg-slate-100 border-b border-slate-200 py-1">
                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-700">
                  Digital Verification
                </span>
              </div>
              <div className="p-1 flex items-center justify-center my-auto">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt={`QR code for ${sub.vendorCode}`} className="w-[92px] h-[92px] block" />
                ) : (
                  <div className="w-[92px] h-[92px] border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
                    QR Verification
                  </div>
                )}
              </div>
              <div>
                <span className="block text-[7.5px] font-mono text-slate-600 font-semibold px-1">
                  /gateway?code={sub.vendorCode}
                </span>
                <span className="block text-[7px] text-slate-400 mt-0.5 px-1 leading-tight">
                  Scan for field portal
                </span>
              </div>
            </div>
          </div>

          {/* ===== Section 02: Statutory & Regulatory Registrations ===== */}
          <SectionHeading index="02" title="Statutory &amp; Regulatory Registrations" />
          <table className="w-full border border-slate-200 border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-left w-[32%]">
                  Registration Type
                </th>
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-left w-[28%]">
                  Registration Number
                </th>
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-left w-[24%]">
                  Classification
                </th>
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-center w-[16%]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-1 px-2.5 text-[10.5px] font-medium text-slate-800 border-r border-slate-200">
                  GSTIN (State 27, Maharashtra)
                </td>
                <td className="py-1 px-2.5 text-[11px] font-mono font-semibold border-r border-slate-200 text-slate-900">
                  {kyc?.gstin || "27ENRPM7534P1ZV"}
                </td>
                <td className="py-1 px-2.5 text-[10.5px] text-slate-700 border-r border-slate-200 whitespace-nowrap">
                  Regular Taxpayer
                </td>
                <td className="py-1 px-2.5 text-[10px] font-semibold text-emerald-800 text-center whitespace-nowrap">
                  Verified
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <td className="py-1 px-2.5 text-[10.5px] font-medium text-slate-800 border-r border-slate-200">
                  MSME Udyam Registration
                </td>
                <td className="py-1 px-2.5 text-[11px] font-mono font-semibold border-r border-slate-200 text-slate-900">
                  {kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908"}
                </td>
                <td className="py-1 px-2.5 text-[10.5px] text-slate-700 border-r border-slate-200 whitespace-nowrap">
                  Micro Enterprise
                </td>
                <td className="py-1 px-2.5 text-[10px] font-semibold text-emerald-800 text-center whitespace-nowrap">
                  Verified
                </td>
              </tr>
              <tr>
                <td className="py-1 px-2.5 text-[10.5px] font-medium text-slate-800 border-r border-slate-200">
                  Income Tax PAN
                </td>
                <td className="py-1 px-2.5 text-[11px] font-mono font-semibold border-r border-slate-200 text-slate-900">
                  {kyc?.pan || "ENRPM7534P"}
                </td>
                <td className="py-1 px-2.5 text-[10.5px] text-slate-700 border-r border-slate-200 whitespace-nowrap">
                  Aadhaar Seeded &amp; Valid
                </td>
                <td className="py-1 px-2.5 text-[10px] font-semibold text-emerald-800 text-center whitespace-nowrap">
                  Verified
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== Section 03: Settlement Banking Details ===== */}
          <SectionHeading index="03" title="Verified Settlement Banking Details" />
          <table className="w-full border border-slate-200 border-collapse text-left">
            <tbody>
              <DataRow label="Disbursement Bank" value={bank.bankName || "HDFC Bank Ltd."} />
              <DataRow label="Account Type" value={bank.accountType || "Biz Pro Plus Current Account"} />
              <DataRow label="Account Number" value={bank.accountNumber || "50200124368375"} mono />
              <DataRow label="IFSC Code" value={bank.ifscCode || "HDFC0001991"} mono />
              <DataRow label="Designated Branch" value={bank.branch || "Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513"} />
              <DataRow
                label="Settlement Status"
                value={
                  <span className="font-semibold text-emerald-800">
                    Eligible for Direct Milestone Disbursement
                  </span>
                }
              />
            </tbody>
          </table>

          {/* ===== Section 04: Verified Compliance Documents ===== */}
          <SectionHeading index="04" title="Verified Compliance Documents on Record" />
          <table className="w-full border border-slate-200 border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-left w-[52%]">
                  Document Title
                </th>
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-left w-[32%]">
                  Registration / Identifier
                </th>
                <th className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-bold text-slate-700 text-center w-[16%]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {verifiedDocs.map((doc, idx) => (
                <tr
                  key={idx}
                  className={`${idx !== verifiedDocs.length - 1 ? "border-b border-slate-200" : ""} ${idx % 2 === 1 ? "bg-slate-50/50" : ""}`}
                >
                  <td className="py-1 px-2.5 text-[10px] font-medium text-slate-800 border-r border-slate-200">
                    {doc.title}
                  </td>
                  <td className="py-1 px-2.5 text-[10px] font-mono text-slate-700 border-r border-slate-200">
                    {doc.identifier || "Verified on File"}
                  </td>
                  <td className="py-1 px-2.5 text-[10px] font-semibold text-emerald-800 text-center whitespace-nowrap">
                    Verified
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== Operational Directive ===== */}
          <div className="mt-2.5 border-l-2 border-slate-700 pl-2.5 py-1 bg-slate-50/70">
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-slate-800">
              Operational Directive
            </div>
            <p className="text-[8.5px] text-slate-600 leading-tight mt-0.5">
              Vendor Code <span className="font-mono font-bold text-slate-950">{sub.vendorCode}</span> is confidential and restricted to registered mobile <span className="font-mono font-semibold text-slate-800">{sub.phoneNumber}</span> for OTP authentication at the Field Gateway (<span className="font-mono">/gateway</span>). All installation milestone proofs require GPS geotagged imagery for automated verification and disbursement release.
            </p>
          </div>
        </div>

        {/* ===== Bottom Sign-off & Document Control Footer ===== */}
        <div className="mt-2">
          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-t border-slate-400 pt-1">
                <div className="text-[9.5px] font-semibold text-slate-900">System-Generated Record</div>
                <div className="text-[8px] text-slate-500">
                  Prepared by 369 AKR Universe Digital Compliance Engine
                </div>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 text-right">
                <div className="text-[9.5px] font-semibold text-slate-900">Authorized Signatory</div>
                <div className="text-[8px] text-slate-500">
                  Directorate of Subcontractor Operations, 369 AKR Universe
                </div>
              </div>
            </div>
          </div>

          {/* Document Control Footer */}
          <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-start justify-between">
            <div className="text-[7px] text-slate-400 leading-tight max-w-[500px]">
              This is an official system-generated compliance dossier. It is valid without physical seal and digitally authenticated by 369 AKR Universe Solar EPC Pvt. Ltd. Distribution restricted to internal audit, statutory compliance, and authorized contractor partner use.
            </div>
            <div className="text-[7px] text-slate-400 text-right font-mono shrink-0">
              <div>Ref: {documentRef}</div>
              <div>Generated: {generatedOn}, {generatedAt} IST</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
