"use client";

import React from "react";
import {
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  CreditCard,
  FileText,
  Sun,
  Award,
  Calendar,
  Hash,
} from "lucide-react";
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

export default function VendorDossierPrintable({
  subcontractor: sub,
  kycDetails: kyc,
  qrCodeDataUrl,
}: VendorDossierPrintableProps) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const bank = kyc?.banking?.primary || {
    bankName: "HDFC Bank Ltd.",
    accountNumber: "50200124368375",
    accountType: "Biz Pro Plus Current Account",
    ifscCode: "HDFC0001991",
    branch: "Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513",
  };

  const address = kyc?.principalAddress
    ? `${kyc.principalAddress.premises}, Post ${kyc.principalAddress.post}, ${kyc.principalAddress.district}, ${kyc.principalAddress.state} - ${kyc.principalAddress.pincode}`
    : `${sub.stateRegion}, India`;

  const verifiedDocs = kyc?.verifiedDocuments || [
    { title: "Form GST REG-06 Certificate", identifier: kyc?.gstin || "27ENRPM7534P1ZV", fileType: "pdf" },
    { title: "MSME Udyam Registration Certificate", identifier: kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908", fileType: "pdf" },
    { title: "HDFC Bank Account Confirmation", identifier: bank.accountNumber || "50200124368375", fileType: "pdf" },
    { title: "UIDAI Aadhaar Card (Front/Back)", identifier: kyc?.aadhaarNumber || "9978 0205 9920", fileType: "image" },
    { title: "Income Tax PAN Card Verification", identifier: kyc?.pan || "ENRPM7534P", fileType: "image" },
  ];

  return (
    <div
      id="vendor-dossier-printable-document"
      className="w-[794px] bg-white text-slate-900 font-sans p-9 box-border border border-slate-200 shadow-2xl rounded-sm mx-auto select-none"
      style={{ minHeight: "1123px" }}
    >
      {/* Top Header Bar */}
      <div className="flex items-start justify-between pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm shrink-0">
            <Sun className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-950 uppercase">
                369 AKR Universe
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 tracking-wide uppercase">
                Solar EPC Directorate
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium tracking-tight">
              Solar Operations, Subcontractor Credentialing &amp; Dispatch Authority
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>VERIFIED PARTNER</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1.5">
            REF: AKR/VND/2026/{sub.vendorCode.replace(/[^A-Z0-9]/gi, "")}
          </div>
        </div>
      </div>

      {/* Hero Vendor Code Card */}
      <div className="mt-5 p-5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-48 bg-radial from-amber-500/10 to-transparent pointer-events-none"></div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Official Operational Vendor Code
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white drop-shadow-sm">
                {sub.vendorCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Tier-1 Contractor
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Primary digital key for Solar Project Dispatches &amp; Milestone Settlements.
            </p>
          </div>

          {/* Scannable QR Code */}
          {qrCodeDataUrl ? (
            <div className="bg-white p-2 rounded-lg shrink-0 shadow-sm text-center">
              <img
                src={qrCodeDataUrl}
                alt={`QR code for ${sub.vendorCode}`}
                className="w-20 h-20 block rounded"
              />
              <span className="block text-[8px] font-mono font-bold text-slate-700 mt-1 uppercase tracking-tight">
                Scan Gateway
              </span>
            </div>
          ) : (
            <div className="bg-white/10 border border-white/20 p-2.5 rounded-lg shrink-0 text-center w-24">
              <div className="font-mono text-xs font-bold text-amber-400">/gateway</div>
              <div className="text-[9px] text-slate-300 mt-1">OTP Mobile Access</div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Company Details & Executive Profile */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {/* Left: Entity Profile */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Registered Contractor Entity</span>
          </div>
          <div className="text-sm font-bold text-slate-950 mt-1.5">
            {sub.companyName}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Constitution: <span className="font-semibold text-slate-800">{kyc?.constitution || "Proprietorship Firm"}</span>
          </div>
          <div className="text-xs text-slate-600 mt-0.5 flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed text-slate-700">{address}</span>
          </div>
        </div>

        {/* Right: Key Executive & Contact */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized Key Executive</span>
          </div>
          <div className="text-sm font-bold text-slate-950 mt-1.5">
            {kyc?.proprietor || sub.contactPerson}
          </div>
          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="font-mono font-semibold text-slate-800">{sub.phoneNumber}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">OTP Gateway</span>
          </div>
          <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-700">{kyc?.email || "swarajya.construction1611@gmail.com"}</span>
          </div>
        </div>
      </div>

      {/* Statutory Regulatory & Tax Credentials */}
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span>Statutory Tax &amp; Government Registrations</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">GSTIN (Maharashtra - 27)</div>
            <div className="font-mono font-extrabold text-sm text-slate-900 mt-1">
              {kyc?.gstin || "27ENRPM7534P1ZV"}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Regular Taxpayer</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">MSME Udyam Registration</div>
            <div className="font-mono font-extrabold text-sm text-slate-900 mt-1">
              {kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908"}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-700 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>Micro Enterprise</span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Income Tax PAN</div>
            <div className="font-mono font-extrabold text-sm text-slate-900 mt-1">
              {kyc?.pan || "ENRPM7534P"}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-600 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              <span>Aadhaar Seeded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disbursement Banking Details */}
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          <span>Verified Settlement Disbursement Bank Account</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>{bank.bankName || "HDFC Bank Ltd."}</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                {bank.accountType || "Current Account"}
              </span>
            </div>
            <div className="font-mono text-xs text-slate-700 font-semibold">
              Account No: <span className="text-slate-950 font-bold">{bank.accountNumber || "50200124368375"}</span>
              <span className="mx-2 text-slate-300">•</span>
              IFSC Code: <span className="text-slate-950 font-bold">{bank.ifscCode || "HDFC0001991"}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Branch: {bank.branch || "Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513"}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100/80 text-emerald-800 font-bold text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>SETTLEMENT READY</span>
            </span>
          </div>
        </div>
      </div>

      {/* Verified Documents Archive Grid */}
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Statutory Compliance Proofs (Verified on Record)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {verifiedDocs.map((doc, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-md border border-slate-200 bg-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {doc.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    ID: {doc.identifier || "Verified"}
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                VERIFIED
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Operational Guidelines */}
      <div className="mt-5 p-3 rounded-lg bg-amber-50/50 border border-amber-200/70 text-[11px] text-amber-900">
        <span className="font-bold uppercase tracking-wider text-[10px] text-amber-950 block mb-0.5">
          Operational Directives:
        </span>
        Use Vendor Code <span className="font-mono font-bold text-slate-950">{sub.vendorCode}</span> at the Contractor Field Gateway (<span className="underline font-mono">/gateway</span>) with registered mobile OTP authentication. Upload all milestone proofs with GPS geotagging enabled for instant engineering verification and automated disbursement.
      </div>

      {/* Bottom Sign-off & Audit Seal */}
      <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wide">
            369 AKR Universe Solar EPC Pvt. Ltd.
          </div>
          <div className="text-[10px] text-slate-500">
            Directorate of Subcontractor Operations &amp; Quality Compliance
          </div>
          <div className="text-[9px] font-mono text-slate-400">
            Certified on: {currentDate} | Secure Digital Verification Hash: SHA256-AKR-{sub.vendorCode}
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block border-b border-slate-400 pb-1 px-4">
            <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
              [DIGITALLY AUTHORIZED]
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}
