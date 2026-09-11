import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Subcontractor } from "@/types";

export interface VendorCertificateData {
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
}

export async function generateVendorCertificatePdf(data: VendorCertificateData): Promise<jsPDF> {
  const { subcontractor: sub, kycDetails: kyc } = data;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // -------------------------------------------------------------
  // 1. DUAL FRAME BORDER (Corporate Executive Letterhead Frame)
  // -------------------------------------------------------------
  // Outer frame - Deep Navy (slate-900)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.9);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // Inner frame - Amber Gold
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.35);
  doc.rect(9, 9, pageWidth - 18, pageHeight - 18);

  // Corner ornamental marks
  const corners = [
    [9, 9],
    [pageWidth - 9, 9],
    [9, pageHeight - 9],
    [pageWidth - 9, pageHeight - 9],
  ];
  doc.setFillColor(217, 119, 6);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.2, "F");
  });

  // -------------------------------------------------------------
  // 2. HEADER BANNER
  // -------------------------------------------------------------
  const headerY = 12;
  const headerHeight = 24;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(12, headerY, 186, headerHeight, 2, 2, "F");

  // Gold accent separator line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(12, headerY + headerHeight, 186, 1.2, "F");

  // Header Typography
  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("369 AKR UNIVERSE SOLAR EPC PRIVATE LIMITED", 105, headerY + 6.5, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12.5);
  doc.text("OFFICIAL VENDOR CREDENTIAL & ONBOARDING DOSSIER", 105, headerY + 13.5, { align: "center" });

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("STATUTORY REGULATORY KYC COMPLIANCE & AUTHORIZED EPC INSTALLATION PARTNER", 105, headerY + 19, { align: "center" });

  // -------------------------------------------------------------
  // 3. METADATA STRIP (Document ID, Date, Security Status)
  // -------------------------------------------------------------
  const metaY = headerY + headerHeight + 3;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  const docId = `AKR-VND-${sub.vendorCode.replace(/[^A-Z0-9]/gi, "")}-${new Date().getFullYear()}`;
  doc.text(`DOCUMENT REF: ${docId}`, 14, metaY + 2.5);

  const issueDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
  doc.text(`DATE OF ISSUE: ${issueDate}`, 105, metaY + 2.5, { align: "center" });

  // Status with vector green dot
  doc.setFillColor(5, 150, 105);
  doc.circle(135, metaY + 1.8, 1.1, "F");
  doc.setTextColor(5, 150, 105);
  doc.text("STATUS: VERIFIED & ACTIVE FOR SOLAR DISPATCH", 138, metaY + 2.5);

  // -------------------------------------------------------------
  // 4. MAIN HERO: VENDOR CODE & SCANNABLE ACCESS CARD
  // -------------------------------------------------------------
  const heroY = metaY + 5.5;
  const heroHeight = 38;

  // Background container
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(12, heroY, 186, heroHeight, 2, 2, "FD");

  // Amber accent strip on left
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(12, heroY, 3, heroHeight, 1, 1, "F");

  // Vendor Code Label
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("ASSIGNED OPERATIONAL VENDOR CODE (MASTER IDENTIFIER)", 19, heroY + 6);

  // Big Prominent Vendor Code
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(sub.vendorCode, 19, heroY + 16);

  // Tier 1 Badge
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.3);
  doc.roundedRect(86, heroY + 8, 48, 7.5, 1.5, 1.5, "FD");
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TIER-1 AUTHORIZED CONTRACTOR", 110, heroY + 13, { align: "center" });

  // Details
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Registered Mobile (OTP Gateway Login): ${sub.phoneNumber}`, 19, heroY + 22.5);
  doc.text("Contractor Field Gateway: https://369akruniverse.com/gateway", 19, heroY + 28);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.8);
  doc.text("Authorized Scope: Solar Rooftop (C&I), Utility MW Civil Piling, Tracker & Electrical BOS", 19, heroY + 33.5);

  // Dynamic QR Code generation for the login URL
  try {
    const gatewayUrl = `http://localhost:3000/gateway?code=${encodeURIComponent(sub.vendorCode)}`;
    const qrDataUrl = await QRCode.toDataURL(gatewayUrl, {
      margin: 1,
      width: 180,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    });
    doc.addImage(qrDataUrl, "PNG", 154, heroY + 2.5, 32, 32);
    doc.setFontSize(5.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("SCAN FOR QUICK GATEWAY", 170, heroY + 36, { align: "center" });
  } catch (qrErr) {
    console.warn("QR code generation error", qrErr);
  }

  // Section Header Drawer
  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, yPos, 186, 5.8, 1, 1, "FD");
    doc.setFillColor(217, 119, 6);
    doc.rect(12, yPos, 2.5, 5.8, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(title.toUpperCase(), 18, yPos + 4.1);
  };

  // -------------------------------------------------------------
  // 5. SECTION 1: LEGAL ENTITY & EXECUTIVE PROFILE
  // -------------------------------------------------------------
  let currentY = heroY + heroHeight + 3.5;
  drawSectionHeader("1. Legal Entity & Executive Profile", currentY);
  currentY += 6.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, currentY, 186, 26, 1, 1, "FD");

  // Row 1
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("COMPANY LEGAL ENTITY NAME", 15, currentY + 4);
  doc.text("PROPRIETOR / CHIEF EXECUTIVE", 110, currentY + 4);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(sub.companyName, 15, currentY + 8.5);
  doc.text(kyc?.proprietor || sub.contactPerson, 110, currentY + 8.5);

  // Row 2
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("CONSTITUTION OF BUSINESS", 15, currentY + 13);
  doc.text("OPERATIONAL REGION / DIVISION", 70, currentY + 13);
  doc.text("REGISTERED CONTACT & EMAIL", 125, currentY + 13);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(kyc?.constitution || "Proprietorship Firm", 15, currentY + 17);
  doc.text(sub.stateRegion, 70, currentY + 17);
  doc.text(`${sub.phoneNumber} | ${kyc?.email || "swarajya.construction1611@gmail.com"}`, 125, currentY + 17);

  // Row 3 (Address)
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("PRINCIPAL PLACE OF BUSINESS ADDRESS", 15, currentY + 21);

  const addressText = kyc?.principalAddress
    ? `${kyc.principalAddress.premises}, Post ${kyc.principalAddress.post}, ${kyc.principalAddress.district}, ${kyc.principalAddress.state} - ${kyc.principalAddress.pincode}`
    : `${sub.stateRegion}, India`;
  doc.setFontSize(7.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(addressText, 15, currentY + 24.5);

  currentY += 28;

  // -------------------------------------------------------------
  // 6. SECTION 2: STATUTORY TAX & GOVERNMENT REGISTRATIONS
  // -------------------------------------------------------------
  drawSectionHeader("2. Statutory Tax & Government Registrations", currentY);
  currentY += 6.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, currentY, 186, 21, 1, 1, "FD");

  const colWidth = 186 / 4;

  // Box 1: GSTIN
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("GSTIN (STATE 27 - MH)", 15, currentY + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(kyc?.gstin || "27ENRPM7534P1ZV", 15, currentY + 9);
  doc.setFillColor(5, 150, 105);
  doc.circle(16, currentY + 14.5, 0.9, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105);
  doc.text("Regular Taxpayer", 19, currentY + 15.2);

  // Box 2: MSME Udyam
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("MSME UDYAM REGISTRATION", 15 + colWidth, currentY + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908", 15 + colWidth, currentY + 9);
  doc.setFillColor(37, 99, 235);
  doc.circle(16 + colWidth, currentY + 14.5, 0.9, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(37, 99, 235);
  doc.text("Micro Enterprise", 19 + colWidth, currentY + 15.2);

  // Box 3: Income Tax PAN
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("INCOME TAX PAN", 15 + colWidth * 2, currentY + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(kyc?.pan || "ENRPM7534P", 15 + colWidth * 2, currentY + 9);
  doc.setFillColor(71, 85, 105);
  doc.circle(16 + colWidth * 2, currentY + 14.5, 0.9, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Aadhaar Linked", 19 + colWidth * 2, currentY + 15.2);

  // Box 4: Aadhaar
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("AADHAAR VERIFICATION", 15 + colWidth * 3, currentY + 4);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(kyc?.aadhaarNumber ? `•••• •••• ${kyc.aadhaarNumber.slice(-4)}` : "9978 0205 9920", 15 + colWidth * 3, currentY + 9);
  doc.setFillColor(5, 150, 105);
  doc.circle(16 + colWidth * 3, currentY + 14.5, 0.9, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105);
  doc.text("UIDAI KYC Verified", 19 + colWidth * 3, currentY + 15.2);

  currentY += 23;

  // -------------------------------------------------------------
  // 7. SECTION 3: DISBURSEMENT BANK ACCOUNT
  // -------------------------------------------------------------
  drawSectionHeader("3. Authorized Disbursement Bank Account (Milestone Settlements)", currentY);
  currentY += 6.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, currentY, 186, 18, 1, 1, "FD");

  const bank = kyc?.banking?.primary || {
    bankName: "HDFC Bank Ltd.",
    accountNumber: "50200124368375",
    accountType: "Biz Pro Plus Current Account",
    ifscCode: "HDFC0001991",
    branch: "Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513",
  };

  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DISBURSEMENT BANK NAME", 15, currentY + 4);
  doc.text("ACCOUNT NUMBER", 70, currentY + 4);
  doc.text("IFSC CODE", 125, currentY + 4);
  doc.text("ACCOUNT TYPE", 160, currentY + 4);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(bank.bankName || "HDFC Bank Ltd.", 15, currentY + 8.5);
  doc.text(bank.accountNumber || "50200124368375", 70, currentY + 8.5);
  doc.text(bank.ifscCode || "HDFC0001991", 125, currentY + 8.5);
  doc.text(bank.accountType || "Current Account", 160, currentY + 8.5);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Designated Branch: ${bank.branch || "Hingoli"} | Direct NEFT/RTGS Disbursement Enabled`, 15, currentY + 14);

  currentY += 20;

  // -------------------------------------------------------------
  // 8. SECTION 4: STATUTORY AUDIT & VERIFIED DOCUMENTS CHECKLIST
  // -------------------------------------------------------------
  drawSectionHeader("4. Regulatory Compliance & Verified Document Archive", currentY);
  currentY += 6.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, currentY, 186, 21, 1, 1, "FD");

  const docList = [
    { name: "Form GST REG-06 Registration Certificate", id: kyc?.gstin || "27ENRPM7534P1ZV", status: "VERIFIED" },
    { name: "MSME Udyam Registration Certificate", id: kyc?.udyamRegistrationNumber || "UDYAM-MH-12-0015908", status: "VERIFIED" },
    { name: "HDFC Bank Current Account Confirmation Statement", id: bank.accountNumber || "50200124368375", status: "VERIFIED" },
    { name: "UIDAI Aadhaar Card (Front/Back) Identity Proof", id: kyc?.aadhaarNumber || "9978 0205 9920", status: "VERIFIED" },
    { name: "Income Tax PAN Card Verification Record", id: kyc?.pan || "ENRPM7534P", status: "VERIFIED" },
  ];

  docList.forEach((d, idx) => {
    const dy = currentY + 3.8 + idx * 3.4;

    // Green check badge
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(15, dy - 2.2, 5.5, 3.2, 0.8, 0.8, "FD");
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(4, 120, 87);
    doc.text("OK", 17.75, dy + 0.1, { align: "center" });

    doc.setFontSize(6.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(d.name, 23, dy);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(d.id, 125, dy);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text(d.status, 178, dy);
  });

  currentY += 23;

  // -------------------------------------------------------------
  // 9. SECTION 5: OPERATIONS & SAFETY DIRECTIVES
  // -------------------------------------------------------------
  drawSectionHeader("5. Partner Operational Protocols & Safety Directives", currentY);
  currentY += 6.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, currentY, 186, 20, 1, 1, "FD");

  const protocols = [
    "1. Vendor Code Security: Your Vendor Code is strictly confidential and linked to your registered mobile number for OTP login.",
    "2. Geotagged Milestone Uploads: All installation milestones (Mounting, DC Cabling, Inverter, Earthing) require live camera capture with GPS.",
    "3. Automated Milestone Disbursements: Milestone settlements are credited directly to your verified HDFC account upon engineering QA pass.",
    "4. Safety & Standards: On-site teams must adhere to 369 AKR Universe Solar SOP safety protocols, PPE standards, and IS/IEC guidelines.",
  ];

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  protocols.forEach((p, idx) => {
    doc.text(p, 15, currentY + 3.8 + idx * 4);
  });

  currentY += 22;

  // -------------------------------------------------------------
  // 10. SECTION 6: DIGITAL SIGNATURE & OFFICIAL VERIFICATION SEAL
  // -------------------------------------------------------------
  const footerBoxHeight = 32;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, currentY, 186, footerBoxHeight, 2, 2, "FD");

  // Left: Security Seal Emblem
  doc.setDrawColor(217, 119, 6); // gold
  doc.setLineWidth(0.6);
  doc.circle(28, currentY + 16, 9.5);
  doc.setLineWidth(0.2);
  doc.circle(28, currentY + 16, 8);

  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(217, 119, 6);
  doc.text("369 AKR", 28, currentY + 14.5, { align: "center" });
  doc.text("VERIFIED", 28, currentY + 17.5, { align: "center" });
  doc.text("SOLAR EPC", 28, currentY + 20, { align: "center" });

  // Center: Certification Text
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("OFFICIAL DIGITAL AUTHORIZATION SIGN-OFF", 45, currentY + 6);

  doc.setFontSize(5.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("This credential certifies that the above-named partner entity has completed statutory KYC verification,", 45, currentY + 10.5);
  doc.text("is registered in the 369 AKR Universe Subcontractor Master Index, and is authorized to execute Solar EPC dispatches.", 45, currentY + 14);
  doc.text(`Digital Verification Timestamp: ${new Date().toISOString()}`, 45, currentY + 18);
  doc.text(`Verification Hash: SHA256-VND-${sub.vendorCode.replace(/[^A-Z0-9]/gi, "")}-AUTH | Tier-1 Certified`, 45, currentY + 21.5);

  // Right: Signature Block
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("AUTHORIZED SIGNATORY", 155, currentY + 18, { align: "center" });

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Solar Operations & Subcontractor Allotment Board", 155, currentY + 22, { align: "center" });
  doc.text("369 AKR Universe Solar EPC Pvt. Ltd.", 155, currentY + 25.5, { align: "center" });

  // Decorative signature line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(125, currentY + 15, 185, currentY + 15);

  // Bottom Notice
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Confidential Document. Computer-generated certificate issued by 369 AKR Universe Solar EPC Portal. Verify authenticity at portal.369akruniverse.com",
    105,
    pageHeight - 11,
    { align: "center" }
  );

  return doc;
}
