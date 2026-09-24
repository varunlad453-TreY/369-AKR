import { describe, it, expect } from "vitest";
import { generateVendorDossierPdf } from "./dossier-generator";

describe("Dossier Generator - Pure TypeScript PDF Implementation", () => {
  it("generates an official vendor compliance dossier PDF without OS dependencies", async () => {
    const doc = await generateVendorDossierPdf({
      vendorCode: "AKR-1114",
      companyName: "Swarajya Construction and Developers",
      constitution: "Proprietorship",
      contactPerson: "Yogesh Dnyaneshwar Magar",
      phoneNumber: "+919552628232",
      email: "swarajya.construction1611@gmail.com",
      address: "At Malharwadi, Post Hingoli, Hingoli, Hingoli, Maharashtra - 431513",
      stateRegion: "Maharashtra",
      isActive: true,
      gstNumber: "27ENRPM7534P1ZV",
      panNumber: "ENRPM7534P",
      msmeNumber: "UDYAM-MH-12-0015908",
      bankName: "HDFC Bank",
      bankAccountNumber: "50200124368375",
      bankIfsc: "HDFC0001991",
      bankBranch: "Hingoli - Nawa Mondha, Plot No 8/163",
    });

    expect(doc).toBeDefined();

    // Verify document page count
    const pageCount = doc.getNumberOfPages();
    expect(pageCount).toBe(1);

    // Verify binary output buffer
    const arrayBuffer = doc.output("arraybuffer");
    expect(arrayBuffer).toBeDefined();
    expect(arrayBuffer.byteLength).toBeGreaterThan(5000);

    // Verify PDF header magic bytes (%PDF)
    const uint8 = new Uint8Array(arrayBuffer);
    const pdfMagic = String.fromCharCode(uint8[0], uint8[1], uint8[2], uint8[3]);
    expect(pdfMagic).toBe("%PDF");
  });

  it("handles custom or minimal vendor data gracefully with institutional defaults", async () => {
    const doc = await generateVendorDossierPdf({
      vendorCode: "AKR-9999",
      companyName: "SunTech Solar Services",
      contactPerson: "Rajesh Kumar",
      phoneNumber: "+919812037550",
      stateRegion: "Haryana",
      isActive: true,
    });

    expect(doc).toBeDefined();
    const arrayBuffer = doc.output("arraybuffer");
    expect(arrayBuffer.byteLength).toBeGreaterThan(4000);
  });
});
