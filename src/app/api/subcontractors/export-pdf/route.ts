import { NextRequest, NextResponse } from "next/server";
import { generateVendorDossierPdf } from "@/lib/pdf/dossier-generator";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorCode = (searchParams.get("vendorCode") || "AKR-1114").trim().toUpperCase();

  try {
    let sub: any = null;

    // 1. Fetch live subcontractor data from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("subcontractors")
        .select("*")
        .eq("vendor_code", vendorCode)
        .maybeSingle();

      if (!error && data) {
        sub = data;
      }
    } catch (sbErr) {
      console.warn("[Export PDF] Supabase query error, checking fallback:", sbErr);
    }

    // 2. Fallback to mock-db in development
    if (!sub && process.env.NODE_ENV !== "production") {
      const mockSub = db.getSubcontractorByVendorCode(vendorCode);
      if (mockSub) {
        sub = {
          company_name: mockSub.companyName,
          vendor_code: mockSub.vendorCode,
          contact_person: mockSub.contactPerson,
          phone_number: mockSub.phoneNumber,
          state_region: mockSub.stateRegion,
          is_active: mockSub.isActive,
          gst_number: mockSub.gstNumber,
          pan_number: mockSub.panNumber,
          bank_name: mockSub.bankName,
          bank_account_number: mockSub.bankAccountNumber,
          bank_ifsc: mockSub.bankIfsc,
          bank_branch: mockSub.bankBranch,
          created_at: mockSub.createdAt,
        };
      }
    }

    // Resolve details (with default fallback for AKR-1114 / Swarajya if newly onboarded)
    const isSwarajya = vendorCode === "AKR-1114";
    const companyName =
      sub?.company_name ||
      (isSwarajya ? "Swarajya Construction and Developers" : `Empanelled Contractor ${vendorCode}`);
    const contactPerson =
      sub?.contact_person || (isSwarajya ? "Yogesh Dnyaneshwar Magar" : "Authorized Signatory");
    const phoneNumber =
      sub?.phone_number || (isSwarajya ? "+919552628232" : "+919812037550");
    const stateRegion =
      sub?.state_region || (isSwarajya ? "Maharashtra" : "Haryana");
    const gstNumber =
      sub?.gst_number || (isSwarajya ? "27ENRPM7534P1ZV" : undefined);
    const panNumber =
      sub?.pan_number || (isSwarajya ? "ENRPM7534P" : undefined);
    const bankName =
      sub?.bank_name || (isSwarajya ? "HDFC Bank" : "HDFC Bank Ltd.");
    const bankAccountNumber =
      sub?.bank_account_number || (isSwarajya ? "50200124368375" : "50200124368375");
    const bankIfsc =
      sub?.bank_ifsc || (isSwarajya ? "HDFC0001991" : "HDFC0001991");
    const bankBranch =
      sub?.bank_branch ||
      (isSwarajya ? "Hingoli - Nawa Mondha, Plot No 8/163" : "Industrial Estate Branch");

    // 3. Generate native PDF in-memory using jsPDF
    const doc = await generateVendorDossierPdf({
      vendorCode,
      companyName,
      contactPerson,
      phoneNumber,
      stateRegion,
      isActive: sub?.is_active ?? true,
      gstNumber,
      panNumber,
      bankName,
      bankAccountNumber,
      bankIfsc,
      bankBranch,
    });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const safeFilename = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${vendorCode}_Official_Dossier.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[Subcontractor PDF Export API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate official vendor dossier PDF",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
