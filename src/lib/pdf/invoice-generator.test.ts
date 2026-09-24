import { describe, it, expect } from "vitest";
import {
  numberToIndianWords,
  calculateInvoiceTaxes,
  calculateInvoiceDeductions,
  generateInvoicePDF,
} from "./invoice-generator";
import { Bill } from "@/types";

describe("Invoice Generator - Tax Calculations (CGST 9%, SGST 9%, IGST 18%)", () => {
  it("computes exact intra-state GST (9% CGST + 9% SGST = 18%) for round amounts", () => {
    const subtotal = 100000.0;
    const taxes = calculateInvoiceTaxes(subtotal, "INTRA_STATE");

    expect(taxes.cgstRate).toBe(9.0);
    expect(taxes.sgstRate).toBe(9.0);
    expect(taxes.igstRate).toBe(0);

    expect(taxes.cgstAmount).toBe(9000.0);
    expect(taxes.sgstAmount).toBe(9000.0);
    expect(taxes.igstAmount).toBe(0);
    expect(taxes.grossTotal).toBe(118000.0);
  });

  it("computes exact inter-state GST (18% IGST) for round amounts", () => {
    const subtotal = 100000.0;
    const taxes = calculateInvoiceTaxes(subtotal, "INTER_STATE");

    expect(taxes.cgstRate).toBe(0);
    expect(taxes.sgstRate).toBe(0);
    expect(taxes.igstRate).toBe(18.0);

    expect(taxes.cgstAmount).toBe(0);
    expect(taxes.sgstAmount).toBe(0);
    expect(taxes.igstAmount).toBe(18000.0);
    expect(taxes.grossTotal).toBe(118000.0);
  });

  it("calculates realistic solar installation milestone amounts accurately", () => {
    // Typical rooftop C&I installation milestone: ₹ 4,31,200.00
    const subtotal = 431200.0;
    const intra = calculateInvoiceTaxes(subtotal, "INTRA_STATE");

    expect(intra.cgstAmount).toBe(38808.0);
    expect(intra.sgstAmount).toBe(38808.0);
    expect(intra.grossTotal).toBe(508816.0);

    const inter = calculateInvoiceTaxes(subtotal, "INTER_STATE");
    expect(inter.igstAmount).toBe(77616.0);
    expect(inter.grossTotal).toBe(508816.0);
  });

  it("correctly rounds tax amounts with fractional paise to 2 decimal places", () => {
    // ₹ 12,345.67 * 0.09 = 1111.1103 -> 1111.11
    const subtotal = 12345.67;
    const taxes = calculateInvoiceTaxes(subtotal, "INTRA_STATE");

    expect(taxes.cgstAmount).toBe(1111.11);
    expect(taxes.sgstAmount).toBe(1111.11);
    expect(taxes.grossTotal).toBe(14567.89);

    const inter = calculateInvoiceTaxes(subtotal, "INTER_STATE");
    // ₹ 12,345.67 * 0.18 = 2222.2206 -> 2222.22
    expect(inter.igstAmount).toBe(2222.22);
    expect(inter.grossTotal).toBe(14567.89);
  });

  it("handles zero subtotal gracefully", () => {
    const taxes = calculateInvoiceTaxes(0, "INTRA_STATE");
    expect(taxes.cgstAmount).toBe(0);
    expect(taxes.sgstAmount).toBe(0);
    expect(taxes.grossTotal).toBe(0);
  });
});

describe("Invoice Generator - Statutory Deductions (TDS 1% & 2%, Retention)", () => {
  const subtotal = 100000.0;
  const grossTotal = 118000.0; // including 18% GST

  it("correctly subtracts 1% TDS for individual/proprietor subcontractors", () => {
    const deductions = calculateInvoiceDeductions(subtotal, grossTotal, 0, 1.0);

    expect(deductions.tdsPercentage).toBe(1.0);
    expect(deductions.tdsAmount).toBe(1000.0);
    expect(deductions.retentionAmount).toBe(0);
    // Net = 118,000 - 1,000 = 117,000
    expect(deductions.netPayable).toBe(117000.0);
  });

  it("correctly subtracts 2% TDS for corporate/partnership entities", () => {
    const deductions = calculateInvoiceDeductions(subtotal, grossTotal, 0, 2.0);

    expect(deductions.tdsPercentage).toBe(2.0);
    expect(deductions.tdsAmount).toBe(2000.0);
    expect(deductions.retentionAmount).toBe(0);
    // Net = 118,000 - 2,000 = 116,000
    expect(deductions.netPayable).toBe(116000.0);
  });

  it("handles combined Retention (5%) and TDS (1%) on ₹ 4,31,200 milestone", () => {
    const sub = 431200.0;
    const gross = 508816.0; // 431200 + 77616 GST
    const deductions = calculateInvoiceDeductions(sub, gross, 5.0, 1.0);

    // Retention: 5% of 431,200 = 21,560
    expect(deductions.retentionAmount).toBe(21560.0);
    // TDS: 1% of 431,200 = 4,312
    expect(deductions.tdsAmount).toBe(4312.0);
    // Net: 508,816 - 21,560 - 4,312 = 482,944
    expect(deductions.netPayable).toBe(482944.0);
  });

  it("handles combined Retention (10%) and TDS (2%) on ₹ 4,31,200 milestone", () => {
    const sub = 431200.0;
    const gross = 508816.0;
    const deductions = calculateInvoiceDeductions(sub, gross, 10.0, 2.0);

    // Retention: 10% of 431,200 = 43,120
    expect(deductions.retentionAmount).toBe(43120.0);
    // TDS: 2% of 431,200 = 8,624
    expect(deductions.tdsAmount).toBe(8624.0);
    // Net: 508,816 - 43,120 - 8,624 = 457,072
    expect(deductions.netPayable).toBe(457072.0);
  });

  it("handles fractional decimal deductions with accurate rounding", () => {
    const sub = 123456.78;
    const gross = 145678.99;
    const deductions = calculateInvoiceDeductions(sub, gross, 5.0, 2.0);

    // 5% of 123456.78 = 6172.839 -> 6172.84
    expect(deductions.retentionAmount).toBe(6172.84);
    // 2% of 123456.78 = 2469.1356 -> 2469.14
    expect(deductions.tdsAmount).toBe(2469.14);
    // Net = 145678.99 - 6172.84 - 2469.14 = 137037.01
    expect(deductions.netPayable).toBe(137037.01);
  });
});

describe("Invoice Generator - Indian Number-to-Words Converter", () => {
  it("handles zero properly", () => {
    expect(numberToIndianWords(0)).toBe("INR Zero Only");
    expect(numberToIndianWords(NaN)).toBe("INR Zero Only");
  });

  it("converts basic units, teens, and tens", () => {
    expect(numberToIndianWords(5)).toBe("INR Five Only");
    expect(numberToIndianWords(14)).toBe("INR Fourteen Only");
    expect(numberToIndianWords(45)).toBe("INR Forty-Five Only");
    expect(numberToIndianWords(99)).toBe("INR Ninety-Nine Only");
  });

  it("converts hundreds and thousands", () => {
    expect(numberToIndianWords(200)).toBe("INR Two Hundred Only");
    expect(numberToIndianWords(350)).toBe("INR Three Hundred and Fifty Only");
    expect(numberToIndianWords(1000)).toBe("INR One Thousand Only");
    expect(numberToIndianWords(15000)).toBe("INR Fifteen Thousand Only");
    expect(numberToIndianWords(75420)).toBe(
      "INR Seventy-Five Thousand Four Hundred and Twenty Only"
    );
  });

  it("correctly converts Indian Lakhs (1,00,000 to 99,99,999)", () => {
    expect(numberToIndianWords(100000)).toBe("INR One Lakh Only");
    expect(numberToIndianWords(431200)).toBe(
      "INR Four Lakh Thirty-One Thousand Two Hundred Only"
    );
    expect(numberToIndianWords(508816)).toBe(
      "INR Five Lakh Eight Thousand Eight Hundred and Sixteen Only"
    );
    expect(numberToIndianWords(9999999)).toBe(
      "INR Ninety-Nine Lakh Ninety-Nine Thousand Nine Hundred and Ninety-Nine Only"
    );
  });

  it("correctly converts Indian Crores (>= 1,00,00,000)", () => {
    expect(numberToIndianWords(10000000)).toBe("INR One Crore Only");
    expect(numberToIndianWords(15000000)).toBe("INR One Crore Fifty Lakh Only");
    expect(numberToIndianWords(125034500)).toBe(
      "INR Twelve Crore Fifty Lakh Thirty-Four Thousand Five Hundred Only"
    );
    expect(numberToIndianWords(100000000)).toBe("INR Ten Crore Only");
  });

  it("correctly handles decimal edge cases (Paise)", () => {
    // 50 Paise
    expect(numberToIndianWords(431200.5)).toBe(
      "INR Four Lakh Thirty-One Thousand Two Hundred and Fifty Paise Only"
    );
    // 05 Paise (single digit)
    expect(numberToIndianWords(100.05)).toBe(
      "INR One Hundred and Five Paise Only"
    );
    // Decimal only
    expect(numberToIndianWords(0.75)).toBe("INR Zero and Seventy-Five Paise Only");
    expect(numberToIndianWords(0.05)).toBe("INR Zero and Five Paise Only");
    // 99 Paise
    expect(numberToIndianWords(999.99)).toBe(
      "INR Nine Hundred and Ninety-Nine and Ninety-Nine Paise Only"
    );
  });
});

describe("Invoice Generator - PDF Document Assembly", () => {
  const mockBill: Bill = {
    id: "bill-test-01",
    jobId: "job-test-01",
    subcontractorId: "sub-1114",
    invoiceNo: "INV-2026-001",
    invoiceDate: "2026-09-15",
    status: "approved",
    subtotal: 431200.0,
    cgstRate: 9.0,
    cgstAmount: 38808.0,
    sgstRate: 9.0,
    sgstAmount: 38808.0,
    igstRate: 0,
    igstAmount: 0,
    grossTotal: 508816.0,
    retentionPercentage: 5.0,
    retentionAmount: 21560.0,
    tdsPercentage: 1.0,
    tdsAmount: 4312.0,
    netPayable: 482944.0,
    notes: "Verified milestone disbursement for Phase 1 Module Mounting",
    createdAt: "2026-09-15T10:00:00Z",
    updatedAt: "2026-09-15T10:30:00Z",
    job: {
      id: "job-test-01",
      jobCode: "JOB-ROHTAK-2026-01",
      title: "150 kWp Industrial Rooftop Installation",
      description: "Module Mounting & Inverter Cabling",
      siteAddress: "Plot 42, HSIIDC Industrial Estate, Sector 31",
      city: "Rohtak",
      state: "Haryana",
      pincode: "124001",
      capacityKwp: 150,
      systemType: "Rooftop Commercial & Industrial",
      status: "in_progress",
      subcontractorId: "sub-1114",
      createdBy: "admin",
      scheduledStart: "2026-09-10",
      scheduledEnd: "2026-09-25",
      workOrderNo: "WO-AKR-2026-088",
      workOrderDate: "2026-09-08",
      createdAt: "2026-09-08T09:00:00Z",
      updatedAt: "2026-09-08T09:00:00Z",
    },
    subcontractor: {
      id: "sub-1114",
      companyName: "Swarajya Construction and Developers",
      phoneNumber: "+919552628232",
      vendorCode: "AKR-1114",
      contactPerson: "Yogesh Dnyaneshwar Magar",
      stateRegion: "Maharashtra",
      isActive: true,
      rating: 5.0,
      gstNumber: "27ENRPM7534P1ZV",
      panNumber: "ENRPM7534P",
      bankName: "HDFC Bank Ltd.",
      bankAccountNumber: "50200124368375",
      bankIfsc: "HDFC0001991",
      bankBranch: "Hingoli Industrial Branch",
      createdAt: "2026-09-01T00:00:00Z",
    },
    items: [
      {
        id: "item-1",
        billId: "bill-test-01",
        itemCode: "CIVIL-MM-01",
        description: "Installation of Module Mounting Structure (MMS)",
        hsnSac: "9954",
        uom: "kWp",
        quantity: 150,
        rate: 1800,
        amount: 270000,
      },
      {
        id: "item-2",
        billId: "bill-test-01",
        itemCode: "ELEC-DC-01",
        description: "DC Array Interconnection and Inverter Termination",
        hsnSac: "9954",
        uom: "kWp",
        quantity: 150,
        rate: 1074.67,
        amount: 161200,
      },
    ],
  };

  it("generates a valid jsPDF document instance with pages and binary buffer", () => {
    const doc = generateInvoicePDF(mockBill);
    expect(doc).toBeDefined();

    // Check page count
    const pageCount = doc.getNumberOfPages();
    expect(pageCount).toBeGreaterThanOrEqual(1);

    // Check binary arraybuffer output
    const buffer = doc.output("arraybuffer");
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
