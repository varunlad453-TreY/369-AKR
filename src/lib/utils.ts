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
 * Generates a unique Vendor Code matching the client specification:
 * Format: AKR-XXXX (7 alphanumeric characters: 'AKR' prefix + 4 numeric digits, e.g. AKR-1114)
 * @param customNumber Optional specific number or code override
 */
export function generateSecureVendorCode(customNumber?: number | string): string {
  if (typeof customNumber === "string") {
    const trimmed = customNumber.trim().toUpperCase();
    if (trimmed.startsWith("AKR-")) return trimmed;
    if (/^\d{4}$/.test(trimmed)) return `AKR-${trimmed}`;
  }
  if (typeof customNumber === "number") {
    return `AKR-${customNumber.toString().padStart(4, "0")}`;
  }

  // Generate 4-digit code (1000 - 9999)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint16Array(1);
    crypto.getRandomValues(arr);
    const num = 1000 + (arr[0] % 9000);
    return `AKR-${num}`;
  }
  const num = Math.floor(1000 + Math.random() * 9000);
  return `AKR-${num}`;
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
