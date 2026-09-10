import crypto from "crypto";

export interface OtpSessionData {
  otp: string;
  otpHash: string;
  expiresAt: number; // Unix timestamp in ms
  attempts: number;
  phoneNumber: string;
  subcontractorId: string;
  vendorCode: string;
}

// In-memory fallback map for resilience during DB schema migrations
// Keyed by uppercase vendor code
const globalForOtp = globalThis as unknown as {
  __akr_otp_sessions?: Map<string, OtpSessionData>;
};

const memorySessions = globalForOtp.__akr_otp_sessions ?? new Map<string, OtpSessionData>();
if (process.env.NODE_ENV !== "production") {
  globalForOtp.__akr_otp_sessions = memorySessions;
}

/**
 * Generates a cryptographically secure 6-digit OTP string.
 */
export function generateCryptographicOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes SHA-256 hash of an OTP string.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Set an in-memory fallback session.
 */
export function setFallbackOtpSession(vendorCode: string, session: OtpSessionData) {
  memorySessions.set(vendorCode.toUpperCase().trim(), session);
}

/**
 * Retrieve an in-memory fallback session.
 */
export function getFallbackOtpSession(vendorCode: string): OtpSessionData | undefined {
  return memorySessions.get(vendorCode.toUpperCase().trim());
}

/**
 * Remove an in-memory fallback session.
 */
export function deleteFallbackOtpSession(vendorCode: string) {
  memorySessions.delete(vendorCode.toUpperCase().trim());
}
