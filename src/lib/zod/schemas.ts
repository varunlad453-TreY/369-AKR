import { z } from "zod";

// Vendor Code Verification Step 1
export const vendorCodeVerificationSchema = z.object({
  vendorCode: z
    .string()
    .min(6, "Vendor Code must be at least 6 characters")
    .max(30, "Vendor Code cannot exceed 30 characters")
    .regex(/^[A-Za-z0-9\-_]+$/, "Vendor Code format is invalid (letters, numbers, hyphens only)")
    .transform((val) => val.trim().toUpperCase()),
});

export type VendorCodeVerificationInput = z.infer<typeof vendorCodeVerificationSchema>;

// SMS OTP Verification Step 2
export const otpVerificationSchema = z.object({
  vendorCode: z.string().min(1, "Vendor Code is required"),
  otp: z
    .string()
    .length(6, "One-Time Password must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain digits only"),
});

export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;

// Job Creation Schema (Admin)
export const jobCreationSchema = z.object({
  title: z.string().min(5, "Project title must be at least 5 characters"),
  description: z.string().optional(),
  siteAddress: z.string().min(5, "Site address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Region is required"),
  pincode: z.string().regex(/^\d{6}$/, "Must be a valid 6-digit Indian PIN code"),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  capacityKwp: z.number().positive("Capacity must be greater than 0"),
  systemType: z.string().min(3, "System type is required"),
  subcontractorId: z.string().min(1, "Please select a registered subcontractor"),
  scheduledStart: z.string().min(1, "Scheduled start date is required"),
  scheduledEnd: z.string().min(1, "Scheduled end date is required"),
  notes: z.string().optional(),
});

export type JobCreationInput = z.infer<typeof jobCreationSchema>;

// Subcontractor Onboarding Schema (Admin)
export const subcontractorOnboardingSchema = z.object({
  companyName: z.string().min(3, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, "Please enter a valid Indian mobile number (+91 or 10 digits starting with 6-9)"),
  licenseNumber: z.string().optional(),
  stateRegion: z.string().min(2, "State/Region is required"),
  vendorCode: z
    .string()
    .min(6, "Vendor Code must be at least 6 characters (e.g. AKR-1114)")
    .optional(),
});

export type SubcontractorOnboardingInput = z.infer<typeof subcontractorOnboardingSchema>;

// Proof of Work Geotagged Upload Schema
export const proofOfWorkUploadSchema = z.object({
  jobId: z.string().min(1, "Invalid Job ID"),
  documentType: z.enum([
    "cad_blueprint",
    "structural_permit",
    "single_line_diagram",
    "safety_checklist",
    "proof_of_work",
    "commissioning_report",
  ]),
  fileName: z.string().min(1, "Filename is required"),
  fileSize: z.number().max(50 * 1024 * 1024, "File size must not exceed 50MB"),
  mimeType: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracy: z.number().optional(),
  notes: z.string().optional(),
});

export type ProofOfWorkUploadInput = z.infer<typeof proofOfWorkUploadSchema>;

// Subcontractor Statutory Profile Schema (GST, PAN, Banking)
export const subcontractorProfileSchema = z.object({
  gstNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Please enter a valid 15-character Indian GSTIN (e.g. 27ENRPM7534P1ZV)"
    )
    .optional()
    .or(z.literal("")),
  panNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Please enter a valid 10-character Indian PAN (e.g. ENRPM7534P)")
    .optional()
    .or(z.literal("")),
  bankName: z.string().trim().min(2, "Bank name is required").optional().or(z.literal("")),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{9,18}$/, "Bank account number must be between 9 and 18 numeric digits")
    .optional()
    .or(z.literal("")),
  bankIfsc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please enter a valid 11-character Indian IFSC code (e.g. HDFC0001991)")
    .optional()
    .or(z.literal("")),
  bankBranch: z.string().trim().optional().or(z.literal("")),
});

export type SubcontractorProfileInput = z.infer<typeof subcontractorProfileSchema>;

// Line Item Schema for Bill Creation
export const billItemSchema = z.object({
  itemCode: z.string().optional(),
  description: z.string().min(2, "Description must be at least 2 characters"),
  hsnSac: z.string().min(2, "HSN/SAC code is required"),
  uom: z.string().min(1, "Unit of measure is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate cannot be negative"),
});

export type BillItemInput = z.infer<typeof billItemSchema>;

// Bill Creation Schema (Subcontractor Portal)
export const billCreationSchema = z.object({
  jobId: z.string().min(1, "Project / Work Order selection is required"),
  subcontractorId: z.string().min(1, "Subcontractor identity is required"),
  invoiceNo: z
    .string()
    .trim()
    .min(3, "Invoice Number must be at least 3 characters")
    .transform((val) => val.toUpperCase()),
  invoiceDate: z.string().min(1, "Invoice Date is required"),
  taxType: z.enum(["INTRA_STATE", "INTER_STATE"]).default("INTRA_STATE"),
  items: z.array(billItemSchema).min(1, "Please provide at least one line item"),
  notes: z.string().optional(),
});

export type BillCreationInput = z.infer<typeof billCreationSchema>;

// Admin Bill Review & Update Schema (TDS & Retention adjustment)
export const adminBillUpdateSchema = z.object({
  status: z.enum(["draft", "submitted", "verified", "approved", "paid", "rejected"]),
  retentionPercentage: z.coerce.number().min(0).max(100).default(0),
  tdsPercentage: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

export type AdminBillUpdateInput = z.infer<typeof adminBillUpdateSchema>;

