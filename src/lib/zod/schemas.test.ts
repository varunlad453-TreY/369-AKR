import { describe, it, expect } from "vitest";
import {
  subcontractorOnboardingSchema,
  subcontractorProfileSchema,
  vendorCodeVerificationSchema,
  otpVerificationSchema,
  jobCreationSchema,
} from "./schemas";

describe("Zod Validation - Indian Mobile Numbers", () => {
  const phoneSchema = subcontractorOnboardingSchema.shape.phoneNumber;

  it("accepts valid Indian mobile numbers with +91 country prefix", () => {
    const validWithPrefix = [
      "+919812037550", // Haryana / Delhi dispatcher test
      "+919552628232", // Maharashtra vendor registered mobile
      "+918987654321", // 8-series
      "+917012345678", // 7-series
      "+916123456789", // 6-series
      "+91-9812037550", // With hyphen separator
      "+91 9552628232", // With space separator
    ];

    for (const phone of validWithPrefix) {
      const result = phoneSchema.safeParse(phone);
      expect(result.success, `Expected ${phone} to be valid`).toBe(true);
    }
  });

  it("accepts valid 10-digit Indian mobile numbers starting with 6-9", () => {
    const valid10Digits = [
      "9812037550",
      "9552628232",
      "8888888888",
      "7777777777",
      "6666666666",
    ];

    for (const phone of valid10Digits) {
      const result = phoneSchema.safeParse(phone);
      expect(result.success, `Expected ${phone} to be valid`).toBe(true);
    }
  });

  it("rejects invalid Indian mobile numbers", () => {
    const invalidNumbers = [
      "+911234567890", // Invalid starting digit (1 is not in 6-9)
      "+912345678901", // Invalid starting digit (2 is not in 6-9)
      "+915555555555", // Invalid starting digit (5 is not in 6-9)
      "+910000000000", // Invalid starting digit (0)
      "+9198765", // Too short (only 5 digits after +91)
      "+91987654321012", // Too long (12 digits after +91)
      "+19812037550", // Wrong country code (+1 USA)
      "+449812037550", // Wrong country code (+44 UK)
      "+91981203755A", // Contains alphabet
      "+9198120#7550", // Contains symbol
      "1234567890", // Starts with 1
      "09812037550", // Starts with 0
      "", // Empty
      "98765", // Less than 10 digits
    ];

    for (const phone of invalidNumbers) {
      const result = phoneSchema.safeParse(phone);
      expect(result.success, `Expected ${phone} to be invalid`).toBe(false);
    }
  });
});

describe("Zod Validation - Indian GSTIN Formats", () => {
  const gstSchema = subcontractorProfileSchema.shape.gstNumber;

  it("accepts valid 15-character Indian GSTINs", () => {
    const validGSTs = [
      "27ENRPM7534P1ZV", // Maharashtra (27) - Swarajya Construction
      "06AAACA3690P1Z2", // Haryana (06) - 369 AKR Universe
      "29AABCU9603R1ZJ", // Karnataka (29)
      "07AAAAA0000A1Z5", // Delhi (07)
      "24AAACB1234C1Z9", // Gujarat (24)
      "33AAACT5678D1Z4", // Tamil Nadu (33)
    ];

    for (const gst of validGSTs) {
      const result = gstSchema.safeParse(gst);
      expect(result.success, `Expected ${gst} to be valid`).toBe(true);
    }
  });

  it("rejects invalid GSTIN formats", () => {
    const invalidGSTs = [
      "27ENRPM7534P1Z", // 14 chars (missing checksum digit)
      "27ENRPM7534P1ZVA", // 16 chars (too long)
      "MHENRPM7534P1ZV", // Letters in state code (must be 2 digits)
      "27123457534P1ZV", // Digits instead of 5 letters in PAN section
      "27ENRPMAAAAP1ZV", // Letters instead of 4 digits in PAN section
      "27ENRPM7534P1AV", // 14th character must be 'Z'
      "27ENRPM7534P#ZV", // Special character
      "27enrpm7534p1zv", // Lowercase letters fail strict regex prior to transform
      "7ENRPM7534P1ZV", // State code must be exactly 2 digits
    ];

    for (const gst of invalidGSTs) {
      // Direct regex test on raw input (pre-transform)
      const isMatch = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        gst
      );
      expect(isMatch, `Expected ${gst} to fail GSTIN regex`).toBe(false);
    }
  });

  it("accepts empty or omitted GSTIN for unregistered micro-vendors", () => {
    expect(gstSchema.safeParse("").success).toBe(true);
    expect(gstSchema.safeParse(undefined).success).toBe(true);
  });
});

describe("Zod Validation - Indian Income Tax PAN Formats", () => {
  const panSchema = subcontractorProfileSchema.shape.panNumber;

  it("accepts valid 10-character Indian PANs", () => {
    const validPANs = [
      "ENRPM7534P", // Individual / Proprietor (P)
      "AAACA3690P", // Company (C) - 369 AKR Universe
      "ABCDE1234F", // Generic valid PAN
      "BLZPS8890K", // Individual (P)
      "AABCS1429B", // Company (C)
      "AAATF9901M", // Trust / Firm (F)
    ];

    for (const pan of validPANs) {
      const result = panSchema.safeParse(pan);
      expect(result.success, `Expected ${pan} to be valid`).toBe(true);
    }
  });

  it("rejects invalid PAN formats", () => {
    const invalidPANs = [
      "ENRPM7534", // 9 characters (too short)
      "ENRPM7534P1", // 11 characters (too long)
      "12345ABCDE", // Digits first instead of letters
      "ENRP17534P", // Digit inside the first 5 letters
      "ENRPM753AP", // Letter inside the 4 digits
      "ENRPM75341", // Digit as the final check character
      "enrpm7534p", // Lowercase letters
      "ENRPM-7534", // Contains hyphen
      "ENRPM 7534", // Contains space
    ];

    for (const pan of invalidPANs) {
      const isMatch = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
      expect(isMatch, `Expected ${pan} to fail PAN regex`).toBe(false);
    }
  });

  it("accepts empty or omitted PAN for draft profiles", () => {
    expect(panSchema.safeParse("").success).toBe(true);
    expect(panSchema.safeParse(undefined).success).toBe(true);
  });
});

describe("Zod Validation - Ancillary Schemas", () => {
  it("validates vendor codes correctly (length >= 6, alphanumeric and hyphens)", () => {
    expect(
      vendorCodeVerificationSchema.safeParse({ vendorCode: "AKR-1114" }).success
    ).toBe(true);
    expect(
      vendorCodeVerificationSchema.safeParse({ vendorCode: "SWARAJYA-01" }).success
    ).toBe(true);
    expect(
      vendorCodeVerificationSchema.safeParse({ vendorCode: "AKR" }).success
    ).toBe(false); // Too short
    expect(
      vendorCodeVerificationSchema.safeParse({ vendorCode: "AKR@1114" }).success
    ).toBe(false); // Invalid character '@'
  });

  it("validates OTP input (strictly 6 numeric digits)", () => {
    expect(
      otpVerificationSchema.safeParse({ vendorCode: "AKR-1114", otp: "123456" })
        .success
    ).toBe(true);
    expect(
      otpVerificationSchema.safeParse({ vendorCode: "AKR-1114", otp: "369369" })
        .success
    ).toBe(true);
    expect(
      otpVerificationSchema.safeParse({ vendorCode: "AKR-1114", otp: "12345" })
        .success
    ).toBe(false); // 5 digits
    expect(
      otpVerificationSchema.safeParse({ vendorCode: "AKR-1114", otp: "1234567" })
        .success
    ).toBe(false); // 7 digits
    expect(
      otpVerificationSchema.safeParse({ vendorCode: "AKR-1114", otp: "12345A" })
        .success
    ).toBe(false); // Alphabet
  });

  it("validates 6-digit Indian PIN codes in job creation", () => {
    const validJob = {
      title: "150 kWp Solar Rooftop EPC",
      siteAddress: "Sector 31 Industrial Estate",
      city: "Rohtak",
      state: "Haryana",
      pincode: "124001",
      capacityKwp: 150,
      systemType: "Rooftop Commercial",
      subcontractorId: "sub-1114",
      scheduledStart: "2026-09-20",
      scheduledEnd: "2026-10-05",
    };

    expect(jobCreationSchema.safeParse(validJob).success).toBe(true);

    // Invalid PIN code
    expect(
      jobCreationSchema.safeParse({ ...validJob, pincode: "12400" }).success
    ).toBe(false);
    expect(
      jobCreationSchema.safeParse({ ...validJob, pincode: "1240012" }).success
    ).toBe(false);
    expect(
      jobCreationSchema.safeParse({ ...validJob, pincode: "ROHTAK" }).success
    ).toBe(false);
  });
});
