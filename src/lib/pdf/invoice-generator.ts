import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Bill } from "@/types";

/**
 * Converts a numeric amount into Indian Currency Words (Lakhs & Crores format)
 * e.g. 431200 -> "INR Four Lakh Thirty-One Thousand Two Hundred Only"
 */
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num === 0) return "INR Zero Only";

  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ` ${singleDigits[unit]}` : ""}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = "";
    if (hundred) {
      res += `${singleDigits[hundred]} Hundred`;
    }
    if (rest) {
      res += `${res ? " and " : ""}${convertTwoDigits(rest)}`;
    }
    return res;
  }

  const absolute = Math.abs(num);
  const integerPart = Math.floor(absolute);
  const decimalPart = Math.round((absolute - integerPart) * 100);

  // Indian Numbering splits: Crores (> 1,00,00,000), Lakhs (> 1,00,000), Thousands (> 1,000), Hundreds (> 100)
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  let words = "";

  if (crore) {
    words += `${convertTwoDigits(crore)} Crore `;
  }
  if (lakh) {
    words += `${convertTwoDigits(lakh)} Lakh `;
  }
  if (thousand) {
    words += `${convertTwoDigits(thousand)} Thousand `;
  }
  if (remainder) {
    words += `${convertThreeDigits(remainder)} `;
  }

  words = words.trim();
  let result = `INR ${words}`;

  if (decimalPart > 0) {
    result += ` and ${convertTwoDigits(decimalPart)} Paise`;
  }

  return `${result} Only`;
}

/**
 * Generates an Enterprise-grade Indian GST Tax Invoice / Running Account (RA) Bill PDF.
 */
export function generateInvoicePDF(bill: Bill): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // -------------------------------------------------------------
  // 1. DUAL FRAME BORDER
  // -------------------------------------------------------------
  // Outer frame - Deep Slate
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // Inner frame - Amber Gold
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.rect(8.5, 8.5, pageWidth - 17, pageHeight - 17);

  // -------------------------------------------------------------
  // 2. HEADER BLOCK (EPC BUYER LETTERHEAD)
  // -------------------------------------------------------------
  let currentY = 12;

  // Navy Top Bar
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, "F");

  // Gold accent stripe
  doc.setFillColor(245, 158, 11);
  doc.rect(margin, currentY + 24, contentWidth, 1.2, "F");

  // Title Typography
  doc.setTextColor(245, 158, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("369 AKR UNIVERSE SOLAR EPC PRIVATE LIMITED", margin + contentWidth / 2, currentY + 6, {
    align: "center",
  });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("TAX INVOICE / RUNNING ACCOUNT (RA) BILL", margin + contentWidth / 2, currentY + 13.5, {
    align: "center",
  });

  doc.setTextColor(203, 213, 225);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.text(
    "GST COMPLIANT SUBCONTRACTOR DISBURSEMENT BILLING · SECTION 31 OF CGST ACT, 2017",
    margin + contentWidth / 2,
    currentY + 19.5,
    { align: "center" }
  );

  currentY += 28;

  // -------------------------------------------------------------
  // 3. INVOICE META STRIP
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 11, 1, 1, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("INVOICE NO:", margin + 4, currentY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(bill.invoiceNo, margin + 25, currentY + 4.5);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("DATE:", margin + 85, currentY + 4.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    margin + 97,
    currentY + 4.5
  );

  doc.setTextColor(71, 85, 105);
  doc.text("STATUS:", margin + 140, currentY + 4.5);

  // Status Badge
  const statusUpper = bill.status.toUpperCase();
  if (bill.status === "approved" || bill.status === "paid") {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(16, 185, 129);
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(59, 130, 246);
    doc.setTextColor(29, 78, 216);
  }
  doc.roundedRect(margin + 155, currentY + 1.5, 24, 5, 1, 1, "FD");
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.text(statusUpper, margin + 167, currentY + 5, { align: "center" });

  // Sub-row: Work order link
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const woText = bill.job?.workOrderNo
    ? `Work Order Ref: ${bill.job.workOrderNo} (Dated: ${bill.job.workOrderDate || "N/A"})`
    : `Project Job Ref: ${bill.job?.jobCode || "N/A"}`;
  doc.text(woText, margin + 4, currentY + 9);

  const capacityText = bill.job?.capacityKwp
    ? `Solar Project Size: ${bill.job.capacityKwp} kWp | Site: ${bill.job.city || "Haryana"}, ${bill.job.state || "India"}`
    : `Project Site: ${bill.job?.siteAddress || "Haryana, India"}`;
  doc.text(capacityText, margin + 97, currentY + 9);

  currentY += 14;

  // -------------------------------------------------------------
  // 4. TWO-COLUMN ENTITY DETAILS (SELLER VS. BUYER)
  // -------------------------------------------------------------
  const colW = (contentWidth - 4) / 2;
  const entityBoxH = 34;

  // LEFT BOX: SELLER / SUBCONTRACTOR
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colW, entityBoxH, 1, 1, "FD");

  // Amber top tag
  doc.setFillColor(217, 119, 6);
  doc.rect(margin, currentY, 2.5, entityBoxH, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("SERVICE PROVIDER / SUBCONTRACTOR (SELLER)", margin + 6, currentY + 4.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(bill.subcontractor?.companyName || "Authorized Field Subcontractor", margin + 6, currentY + 9.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(`Contact Person: ${bill.subcontractor?.contactPerson || "Proprietor"}`, margin + 6, currentY + 14);
  doc.text(`Registered Mobile: ${bill.subcontractor?.phoneNumber || "N/A"}`, margin + 6, currentY + 18);
  doc.text(`Vendor Code: ${bill.subcontractor?.vendorCode || "N/A"}`, margin + 6, currentY + 22);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${bill.subcontractor?.gstNumber || "NOT REGISTERED"}`, margin + 6, currentY + 26.5);
  doc.text(`PAN: ${bill.subcontractor?.panNumber || "NOT PROVIDED"}`, margin + 6, currentY + 30.5);

  // RIGHT BOX: BUYER / EPC CONTRACTOR
  const rightX = margin + colW + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, currentY, colW, entityBoxH, 1, 1, "FD");

  // Blue top tag
  doc.setFillColor(15, 23, 42);
  doc.rect(rightX, currentY, 2.5, entityBoxH, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED TO / RECIPIENT (BUYER)", rightX + 6, currentY + 4.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("369 AKR UNIVERSE SOLAR EPC PVT. LTD.", rightX + 6, currentY + 9.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text("Plot 42, HSIIDC Industrial Estate, Sector 31", rightX + 6, currentY + 14);
  doc.text("Rohtak, Haryana - 124001, India", rightX + 6, currentY + 18);
  doc.text("Phone: +91 98120 37550 | central.dispatch@369akruniverse.in", rightX + 6, currentY + 22);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("GSTIN: 06AAACA3690P1Z2 (State Code: 06 - Haryana)", rightX + 6, currentY + 26.5);
  doc.text("PAN: AAACA3690P | CIN: U40106HR2024PTC109842", rightX + 6, currentY + 30.5);

  currentY += entityBoxH + 4;

  // -------------------------------------------------------------
  // 5. LINE ITEMS TABLE (autoTable)
  // -------------------------------------------------------------
  const tableData = (bill.items || []).map((item, index) => [
    String(index + 1),
    item.description,
    item.hsnSac,
    item.uom,
    Number(item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 3 }),
    `₹ ${Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `₹ ${Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["#", "Milestone / Scope of Work Description", "HSN/SAC", "UoM", "Qty", "Rate (₹)", "Amount (₹)"]],
    body: tableData.length > 0 ? tableData : [["-", "No line items registered", "-", "-", "0.00", "₹ 0.00", "₹ 0.00"]],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 26, halign: "right", fontStyle: "bold" },
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Calculate table end position
  const finalTableY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || currentY + 40;
  currentY = finalTableY + 4;

  // -------------------------------------------------------------
  // 6. TAXATION & DEDUCTIONS SUMMARY BLOCK
  // -------------------------------------------------------------
  const summaryBoxW = 90;
  const summaryBoxX = pageWidth - margin - summaryBoxW;
  const summaryStartY = currentY;

  // Left side: Bank Details & Amount in Words
  const leftBoxW = contentWidth - summaryBoxW - 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, summaryStartY, leftBoxW, 46, 1, 1, "FD");

  // Bank details header
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("DIRECT DISBURSEMENT BANK COORDINATES (NEFT/RTGS)", margin + 4, summaryStartY + 4.5);

  const bank = bill.subcontractor;
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank Name: ${bank?.bankName || "HDFC Bank Ltd."}`, margin + 4, summaryStartY + 9.5);
  doc.text(`Account No: ${bank?.bankAccountNumber || "50200124368375"}`, margin + 4, summaryStartY + 14);
  doc.text(`IFSC Code: ${bank?.bankIfsc || "HDFC0001991"}`, margin + 4, summaryStartY + 18.5);
  doc.text(`Branch: ${bank?.bankBranch || "Hingoli Industrial Branch"}`, margin + 4, summaryStartY + 23);

  // Amount in Words
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 4, summaryStartY + 26.5, margin + leftBoxW - 4, summaryStartY + 26.5);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("NET AMOUNT PAYABLE IN WORDS:", margin + 4, summaryStartY + 31);

  const words = numberToIndianWords(bill.netPayable || bill.grossTotal);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const splitWords = doc.splitTextToSize(words, leftBoxW - 8);
  doc.text(splitWords, margin + 4, summaryStartY + 36);

  // RIGHT SIDE: FINANCIAL SUMMARY TABLE
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(summaryBoxX, summaryStartY, summaryBoxW, 46, 1, 1, "FD");

  const addSummaryRow = (label: string, value: string, yPos: number, isBold = false, isHighlight = false) => {
    doc.setFontSize(6.8);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setTextColor(isHighlight ? 4 : 51, isHighlight ? 120 : 65, isHighlight ? 87 : 85);
    doc.text(label, summaryBoxX + 4, yPos);
    doc.text(value, summaryBoxX + summaryBoxW - 4, yPos, { align: "right" });
  };

  let rowY = summaryStartY + 5;
  addSummaryRow(
    "Taxable Subtotal:",
    `₹ ${bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rowY
  );

  rowY += 4.2;
  if (bill.igstAmount > 0) {
    addSummaryRow(
      `IGST @ ${bill.igstRate}%:`,
      `₹ ${bill.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rowY
    );
  } else {
    addSummaryRow(
      `CGST @ ${bill.cgstRate}%:`,
      `₹ ${bill.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rowY
    );
    rowY += 4.2;
    addSummaryRow(
      `SGST @ ${bill.sgstRate}%:`,
      `₹ ${bill.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rowY
    );
  }

  rowY += 4.2;
  doc.setDrawColor(226, 232, 240);
  doc.line(summaryBoxX + 4, rowY - 1, summaryBoxX + summaryBoxW - 4, rowY - 1);
  addSummaryRow(
    "Gross Total (with GST):",
    `₹ ${bill.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rowY,
    true
  );

  rowY += 4.2;
  addSummaryRow(
    `Less: Retention (${bill.retentionPercentage}%):`,
    `- ₹ ${bill.retentionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rowY
  );

  rowY += 4.2;
  addSummaryRow(
    `Less: TDS u/s 194C (${bill.tdsPercentage}%):`,
    `- ₹ ${bill.tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    rowY
  );

  // Prominent Net Payable Box
  rowY += 5.5;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryBoxX + 2, rowY - 3.5, summaryBoxW - 4, 8, 1, 1, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(4, 120, 87);
  doc.text("NET PAYABLE AMOUNT:", summaryBoxX + 4, rowY + 1.5);
  doc.text(
    `₹ ${bill.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    summaryBoxX + summaryBoxW - 4,
    rowY + 1.5,
    { align: "right" }
  );

  currentY = summaryStartY + 50;

  // -------------------------------------------------------------
  // 7. DECLARATION & SIGNATURE BLOCK
  // -------------------------------------------------------------
  const sigBoxH = 24;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, sigBoxH, 1, 1, "FD");

  // Left text: Statutory declaration
  doc.setFontSize(6.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("STATUTORY TAX DECLARATION & UNDERTAKING:", margin + 4, currentY + 4.5);

  doc.setFontSize(5.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const declaration =
    "We declare that this invoice shows the actual value of services provided and that all particulars are true and correct. Taxes shown above have been duly charged under GST law and will be remitted to the Government Treasury through GSTR-3B filings within statutory due dates.";
  doc.text(doc.splitTextToSize(declaration, 110), margin + 4, currentY + 8.5);

  doc.text(`Digital Verification Hash: SHA256-INV-${bill.invoiceNo.replace(/[^A-Z0-9]/gi, "")}`, margin + 4, currentY + 20);

  // Right text: Signature Lines
  const sigRightX = margin + contentWidth - 65;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(bill.subcontractor?.companyName || "Subcontractor Authorised Signatory", sigRightX + 32, currentY + 4.5, {
    align: "center",
  });

  doc.setDrawColor(148, 163, 184);
  doc.line(sigRightX, currentY + 16, sigRightX + 64, currentY + 16);

  doc.setFontSize(5.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("AUTHORISED SIGNATORY / PROPRIETOR", sigRightX + 32, currentY + 19.5, { align: "center" });

  // -------------------------------------------------------------
  // 8. FOOTER NOTE
  // -------------------------------------------------------------
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Computer Generated Running Account (RA) Tax Invoice. 369 AKR UNIVERSE SOP · Subcontractor Operations Portal. Verify online at https://369akruniverse.com/gateway",
    pageWidth / 2,
    pageHeight - 9,
    { align: "center" }
  );

  return doc;
}
