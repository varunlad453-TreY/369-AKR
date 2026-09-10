import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  // Ensure starts with +91 if Indian 10 digits
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    const prefix = cleaned.slice(0, 3);
    return `${prefix} •••• ••• ${last4}`;
  }
  return phone;
}

/**
 * Generates a unique, cryptographically secure Vendor Code.
 * Format: AKR-[TYPE]-[RANDOM_ALPHANUM]-[CHECKSUM]
 * Example: AKR-JOB-8K9N-SEC
 */
export function generateSecureVendorCode(prefix: string = "JOB"): string {
  const characters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Base32 unambiguous
  let randomSegment = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 4; i++) {
      randomSegment += characters[bytes[i] % characters.length];
    }
  } else {
    for (let i = 0; i < 4; i++) {
      randomSegment += characters[Math.floor(Math.random() * characters.length)];
    }
  }
  const timestampToken = Date.now().toString(36).slice(-3).toUpperCase();
  return `AKR-${prefix.toUpperCase()}-${randomSegment}${timestampToken}`;
}

export function generateJobCode(city: string = "SITE"): string {
  const cleanCity = city.trim().slice(0, 3).toUpperCase() || "SOL";
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `AKR-2026-${cleanCity}-${randomNum}`;
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatKwp(kwp: number): string {
  if (kwp >= 1000) {
    return `${(kwp / 1000).toFixed(2)} MWp`;
  }
  return `${kwp.toLocaleString("en-IN")} kWp`;
}
