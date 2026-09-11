import { cookies } from "next/headers";

export interface SubcontractorSession {
  id: string;
  vendorCode: string;
  company: string;
  phone: string;
}

/**
 * Reads and parses the akr_sub_session cookie on the server. Never trust
 * client-supplied identity (e.g. query params) — this is the single source
 * of truth for "who is the logged-in subcontractor" in Server Components.
 */
export async function getSubcontractorSession(): Promise<SubcontractorSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("akr_sub_session")?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed as SubcontractorSession;
  } catch {
    return null;
  }
}
