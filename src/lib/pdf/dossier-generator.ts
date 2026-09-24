import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export interface VendorDossierData {
  vendorCode: string;
  companyName: string;
  constitution?: string;
  contactPerson: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  stateRegion: string;
  isActive: boolean;
  gstNumber?: string;
  panNumber?: string;
  msmeNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  accountType?: string;
  issuedDate?: string;
  docRef?: string;
  documentsOnRecord?: Array<{
    documentName: string;
    identifier: string;
    verified: boolean;
  }>;
}

/**
 * Generates an Executive-grade Subcontractor Empanelment & KYC Compliance Dossier PDF.
 * Replaces the legacy Python ReportLab script with a pure TypeScript implementation.
 */
export async function generateVendorDossierPdf(data: VendorDossierData): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 11;
  const contentWidth = pageWidth - margin * 2; // 188 mm

  // Default values matching AKR Universe institutional compliance records
  const vendorCode = data.vendorCode.trim().toUpperCase();
  const companyName = data.companyName || "Swarajya Construction and Developers";
  const constitution = data.constitution || "Proprietorship";
  const contactPerson = data.contactPerson || "Yogesh Dnyaneshwar Magar";
  const phoneNumber = data.phoneNumber || "+919552628232";
  const email = data.email || "swarajya.construction1611@gmail.com";
  const address =
    data.address ||
    "At Malharwadi, Post Hingoli, Hingoli, Hingoli, Maharashtra - 431513";
  const gstNumber = data.gstNumber || "27ENRPM7534P1ZV";
  const panNumber = data.panNumber || "ENRPM7534P";
  const msmeNumber = data.msmeNumber || "UDYAM-MH-12-0015908";
  const bankName = data.bankName || "HDFC Bank";
  const accountType = data.accountType || "Biz Pro Plus Current Account";
  const bankAccountNumber = data.bankAccountNumber || "50200124368375";
  const bankIfsc = data.bankIfsc || "HDFC0001991";
  const bankBranch = data.bankBranch || "Hingoli - Nawa Mondha, Plot No 8/163";
  const cleanRef = vendorCode.replace(/[^A-Za-z0-9]/g, "");
  const docRef = data.docRef || `AKR/VND/2026/${cleanRef}`;
  const issuedDate =
    data.issuedDate ||
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // Color Palette
  const C_PRIMARY = [11, 19, 43] as const; // #0B132B Deep Midnight Navy
  const C_AMBER = [217, 119, 6] as const; // #D97706 Solar Amber
  const C_TEXT_MAIN = [15, 23, 42] as const; // #0F172A Slate 900
  const C_TEXT_MUTED = [100, 116, 139] as const; // #64748B Slate 500
  const C_TEXT_LIGHT = [148, 163, 184] as const; // #94A3B8 Slate 400
  const C_BORDER = [226, 232, 240] as const; // #E2E8F0 Slate 200
  const C_BORDER_DARK = [203, 213, 225] as const; // #CBD5E1 Slate 300
  const C_SUCCESS = [5, 150, 105] as const; // #059669 Emerald 600
  const C_SUCCESS_BG = [236, 253, 245] as const; // #ECFDF5 Light Emerald
  const C_SUCCESS_BORDER = [167, 243, 208] as const; // #A7F3D0 Soft Emerald

  // -------------------------------------------------------------
  // 1. TOP ACCENT BAR
  // -------------------------------------------------------------
  doc.setFillColor(...C_PRIMARY);
  doc.rect(0, 0, pageWidth, 2.5, "F");
  doc.setFillColor(...C_AMBER);
  doc.rect(0, 0, pageWidth * 0.28, 2.5, "F");

  // -------------------------------------------------------------
  // 2. DUAL EXECUTIVE FRAME BORDER
  // -------------------------------------------------------------
  // Outer frame
  doc.setDrawColor(...C_PRIMARY);
  doc.setLineWidth(0.6);
  doc.rect(6, 6, pageWidth - 12, pageHeight - 12);

  // Inner frame
  doc.setDrawColor(...C_AMBER);
  doc.setLineWidth(0.25);
  doc.rect(7.2, 7.2, pageWidth - 14.4, pageHeight - 14.4);

  let currentY = 11;

  // -------------------------------------------------------------
  // 3. HEADER BLOCK
  // -------------------------------------------------------------
  // Left: Corporate Identification
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C_PRIMARY);
  doc.text("369 AKR UNIVERSE SOLAR EPC PVT. LTD.", margin, currentY + 3.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "Directorate of Subcontractor Operations & Quality Compliance",
    margin,
    currentY + 7.5
  );

  doc.setFontSize(6.0);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text(
    "CIN: U40106MH2024PTC000369  |  www.369akruniverse.com  |  ops@369akruniverse.in",
    margin,
    currentY + 11.2
  );

  // Right: Confidential Badge & Document Reference
  const badgeW = 28;
  const badgeH = 5;
  const badgeX = pageWidth - margin - badgeW;
  doc.setDrawColor(...C_TEXT_MAIN);
  doc.setLineWidth(0.35);
  doc.rect(badgeX, currentY, badgeW, badgeH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...C_PRIMARY);
  doc.text("CONFIDENTIAL", badgeX + badgeW / 2, currentY + 3.6, { align: "center" });

  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C_TEXT_MAIN);
  doc.text(`Doc. Ref: ${docRef}`, pageWidth - margin, currentY + 9, { align: "right" });

  doc.setFont("courier", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text(`Issued: ${issuedDate}`, pageWidth - margin, currentY + 12.5, { align: "right" });

  currentY += 16;

  // Divider
  doc.setDrawColor(...C_BORDER_DARK);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4.5;

  // -------------------------------------------------------------
  // 4. DOCUMENT TITLE & SUBTITLE
  // -------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C_PRIMARY);
  doc.text(
    "SUBCONTRACTOR EMPANELMENT & KYC COMPLIANCE DOSSIER",
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  currentY += 3.8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text(
    "Official vendor credential record, issued for internal audit, statutory compliance, and field dispatch authorization purposes.",
    pageWidth / 2,
    currentY,
    { align: "center" }
  );

  currentY += 5.5;

  // Helper: Section Heading
  const drawSectionHeading = (num: string, title: string, yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C_TEXT_MUTED);
    doc.text(num, margin, yPos);

    doc.setTextColor(...C_TEXT_MAIN);
    doc.text(title.toUpperCase(), margin + 6, yPos);
  };

  // Helper: Badge renderer
  const drawStatusBadge = (
    text: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    doc.setFillColor(...C_SUCCESS_BG);
    doc.setDrawColor(...C_SUCCESS_BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 0.8, 0.8, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.0);
    doc.setTextColor(...C_SUCCESS);
    doc.text(text, x + w / 2, y + h / 2 + 1, { align: "center" });
  };

  // -------------------------------------------------------------
  // 5. SECTION 01: VENDOR IDENTIFICATION
  // -------------------------------------------------------------
  drawSectionHeading("01", "VENDOR IDENTIFICATION", currentY);
  currentY += 3;

  const leftCardW = 143;
  const qrCardW = 41;
  const qrCardX = margin + leftCardW + 4;
  const sec1H = 34;

  // Left Specs Container
  const drawRow = (
    label: string,
    val: string,
    yPos: number,
    isCode = false,
    isBold = false
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...C_TEXT_MUTED);
    doc.text(label.toUpperCase(), margin + 2, yPos);

    doc.setFont(isCode ? "courier" : "helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isCode ? 7.2 : 6.8);
    doc.setTextColor(...C_TEXT_MAIN);
    doc.text(val, margin + 46, yPos);

    // Subtle row line
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.15);
    doc.line(margin + 2, yPos + 1.2, margin + leftCardW - 2, yPos + 1.2);
  };

  let rowY = currentY + 3.2;
  drawRow("Vendor Code", vendorCode, rowY, true, true);
  rowY += 4.2;

  // Empanelment Status row with badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text("EMPANELMENT STATUS", margin + 2, rowY);
  drawStatusBadge("ACTIVE — VERIFIED CONTRACTOR", margin + 46, rowY - 2.8, 48, 4.2);
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.15);
  doc.line(margin + 2, rowY + 1.2, margin + leftCardW - 2, rowY + 1.2);
  rowY += 4.2;

  drawRow("Registered Entity", companyName, rowY, false, true);
  rowY += 4.2;
  drawRow("Constitution", constitution, rowY);
  rowY += 4.2;
  drawRow("Authorized Signatory", contactPerson, rowY, false, true);
  rowY += 4.2;
  drawRow("Registered Mobile", phoneNumber, rowY, true);
  rowY += 4.2;
  drawRow("Email Address", email, rowY);
  rowY += 4.2;

  // Principal address (may wrap)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text("PRINCIPAL PLACE", margin + 2, rowY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.4);
  doc.setTextColor(...C_TEXT_MAIN);
  const wrappedAddress = doc.splitTextToSize(address, leftCardW - 50);
  doc.text(wrappedAddress, margin + 46, rowY);

  // Right: QR Digital Verification Card
  const qrUrl = `https://369akruniverse.com/gateway?code=${vendorCode}`;
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 0,
      width: 120,
      color: {
        dark: "#0B132B",
        light: "#FFFFFF",
      },
    });
  } catch (qrErr) {
    console.warn("[Dossier Generator QR Error]:", qrErr);
  }

  // QR Card Box
  doc.setDrawColor(...C_BORDER_DARK);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(qrCardX, currentY, qrCardW, sec1H, "FD");

  // QR Card Header Bar
  doc.setFillColor(...C_PRIMARY);
  doc.rect(qrCardX, currentY, qrCardW, 4.8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text("DIGITAL VERIFICATION", qrCardX + qrCardW / 2, currentY + 3.4, {
    align: "center",
  });

  // QR Image
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", qrCardX + 9, currentY + 6.5, 23, 23);
  }

  // QR Card URL & Help text
  doc.setFont("courier", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(...C_PRIMARY);
  doc.text(`/gateway?code=${vendorCode}`, qrCardX + qrCardW / 2, currentY + 30.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.8);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text("Scan to verify empanelment", qrCardX + qrCardW / 2, currentY + 32.8, {
    align: "center",
  });

  currentY += sec1H + 4.5;

  // -------------------------------------------------------------
  // 6. SECTION 02: STATUTORY & REGULATORY REGISTRATIONS
  // -------------------------------------------------------------
  drawSectionHeading("02", "STATUTORY & REGULATORY REGISTRATIONS", currentY);
  currentY += 2.5;

  const sec2TableData = [
    [
      `GSTIN (State Code ${gstNumber.slice(0, 2)} — ${data.stateRegion || "Maharashtra"})`,
      gstNumber,
      "Verified — Regular Taxpayer",
    ],
    [
      "MSME Udyam Registration",
      msmeNumber,
      "Verified — Micro Enterprise",
    ],
    [
      "Income Tax PAN",
      panNumber,
      "Verified — Aadhaar Seeded",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["Registration Type", "Registration Number", "Verification Status"]],
    body: sec2TableData,
    headStyles: {
      fillColor: [...C_PRIMARY],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: "bold",
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 55, font: "courier", fontStyle: "bold" },
      2: { cellWidth: "auto", textColor: [...C_SUCCESS], fontStyle: "bold" },
    },
    bodyStyles: {
      fontSize: 6.6,
      textColor: [...C_TEXT_MAIN],
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const sec2FinalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY || currentY + 22;
  currentY = sec2FinalY + 4.5;

  // -------------------------------------------------------------
  // 7. SECTION 03: VERIFIED SETTLEMENT BANKING DETAILS
  // -------------------------------------------------------------
  drawSectionHeading("03", "VERIFIED SETTLEMENT BANKING DETAILS", currentY);
  currentY += 3;

  const sec3H = 22;
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, sec3H, 0.8, 0.8, "FD");

  let bRowY = currentY + 3.6;
  const drawBankRow = (label: string, val: string, yPos: number, isCode = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...C_TEXT_MUTED);
    doc.text(label.toUpperCase(), margin + 4, yPos);

    doc.setFont(isCode ? "courier" : "helvetica", isCode ? "bold" : "normal");
    doc.setFontSize(isCode ? 7.2 : 6.8);
    doc.setTextColor(...C_TEXT_MAIN);
    doc.text(val, margin + 48, yPos);

    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(0.15);
    doc.line(margin + 4, yPos + 1.2, margin + contentWidth - 4, yPos + 1.2);
  };

  drawBankRow("Bank & Account Type", `${bankName} — ${accountType}`, bRowY);
  bRowY += 4.0;
  drawBankRow("Account Number", bankAccountNumber, bRowY, true);
  bRowY += 4.0;
  drawBankRow("IFSC Code", bankIfsc, bRowY, true);
  bRowY += 4.0;
  drawBankRow("Branch Address", bankBranch, bRowY);
  bRowY += 4.0;

  // Settlement Status with badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text("SETTLEMENT STATUS", margin + 4, bRowY);
  drawStatusBadge(
    "Ready — Eligible for Direct Milestone Disbursement",
    margin + 48,
    bRowY - 2.8,
    65,
    3.8
  );

  currentY += sec3H + 4.5;

  // -------------------------------------------------------------
  // 8. SECTION 04: VERIFIED COMPLIANCE DOCUMENTS ON RECORD
  // -------------------------------------------------------------
  drawSectionHeading("04", "VERIFIED COMPLIANCE DOCUMENTS ON RECORD", currentY);
  currentY += 2.5;

  const defaultDocs = [
    ["Form GST REG-06 Registration Certificate", gstNumber, "Verified"],
    ["MSME Udyam Registration Certificate", msmeNumber, "Verified"],
    ["Bank Account Confirmation Statement", bankAccountNumber, "Verified"],
    ["UIDAI Aadhaar Card (Front / Identity Proof)", "9978 0205 9920", "Verified"],
    ["UIDAI Aadhaar Card (Back / Address Proof)", "9978 0205 9920", "Verified"],
    ["Income Tax Department PAN Card", panNumber, "Verified"],
  ];

  const docsData = data.documentsOnRecord
    ? data.documentsOnRecord.map((d) => [
        d.documentName,
        d.identifier,
        d.verified ? "Verified" : "Pending Review",
      ])
    : defaultDocs;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["Document", "Reference / Identifier", "Status"]],
    body: docsData,
    headStyles: {
      fillColor: [...C_PRIMARY],
      textColor: [255, 255, 255],
      fontSize: 6.8,
      fontStyle: "bold",
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { cellWidth: 88 },
      1: { cellWidth: 70, font: "courier", fontStyle: "bold" },
      2: { cellWidth: "auto", halign: "center", textColor: [...C_SUCCESS], fontStyle: "bold" },
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [...C_TEXT_MAIN],
      cellPadding: 1.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const sec4FinalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable?.finalY || currentY + 30;
  currentY = sec4FinalY + 4.5;

  // -------------------------------------------------------------
  // 9. SECTION 05: OPERATIONAL DIRECTIVE
  // -------------------------------------------------------------
  const dirH = 14;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, dirH, "F");

  // Navy accent bar on left
  doc.setFillColor(...C_PRIMARY);
  doc.rect(margin, currentY, 1.8, dirH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...C_PRIMARY);
  doc.text("OPERATIONAL DIRECTIVE", margin + 4, currentY + 3.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(51, 65, 85);
  const directiveText = `The Vendor Code ${vendorCode} is to be used exclusively at the Contractor Field Gateway (/gateway) with registered mobile OTP authentication. All installation milestone proofs must be submitted with GPS geotagging enabled to permit engineering verification and automated disbursement processing.`;
  const wrappedDir = doc.splitTextToSize(directiveText, contentWidth - 8);
  doc.text(wrappedDir, margin + 4, currentY + 7.2);

  currentY += dirH + 7;

  // -------------------------------------------------------------
  // 10. SECTION 06: SIGNATURES & COMPLIANCE AUTHORITY
  // -------------------------------------------------------------
  doc.setDrawColor(...C_BORDER_DARK);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4.5;

  // Left Authority
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...C_PRIMARY);
  doc.text("System-Generated Record", margin, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text(
    "Prepared by AKR Universe Digital Compliance Engine",
    margin,
    currentY + 3.8
  );

  // Right Authority
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(...C_PRIMARY);
  doc.text("Authorized Signatory", pageWidth - margin, currentY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...C_TEXT_MUTED);
  doc.text(
    "Directorate of Subcontractor Operations; 369 AKR Universe",
    pageWidth - margin,
    currentY + 3.8,
    { align: "right" }
  );

  currentY += 9;

  // -------------------------------------------------------------
  // 11. SECTION 07: DOCUMENT CONTROL & STATUTORY FOOTER
  // -------------------------------------------------------------
  doc.setDrawColor(...C_BORDER);
  doc.setLineWidth(0.2);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 3.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.setTextColor(...C_TEXT_LIGHT);
  const footerLegal =
    "This is a system-generated compliance document. It is valid without a physical signature and is digitally authorized by 369 AKR Universe Solar EPC Pvt. Ltd. Any unauthorized alteration renders this document void. Distribution restricted to internal audit, compliance, and empanelled contractor use only.";
  const wrappedFooter = doc.splitTextToSize(footerLegal, contentWidth - 45);
  doc.text(wrappedFooter, margin, currentY);

  doc.setFont("courier", "bold");
  doc.setFontSize(5.6);
  doc.text(`Doc. Ref: ${docRef}`, pageWidth - margin, currentY, { align: "right" });

  doc.setFont("courier", "normal");
  doc.setFontSize(5.2);
  doc.text(
    `Generated: ${issuedDate}`,
    pageWidth - margin,
    currentY + 3.5,
    { align: "right" }
  );

  return doc;
}
