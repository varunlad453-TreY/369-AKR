import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateSecureVendorCode } from "@/lib/utils";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const newCode = generateSecureVendorCode();
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("subcontractors")
      .update({ vendor_code: newCode })
      .eq("id", id)
      .select("id, vendor_code, company_name")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Subcontractor not found or update failed" },
        { status: 404 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        action: "VENDOR_CODE_REGENERATED",
        actor_type: "ADMIN",
        actor_identifier: "dispatcher@369akruniverse.in",
        resource_id: id,
        resource_type: "subcontractors",
        metadata: { newVendorCode: newCode, companyName: data.company_name },
      });
    } catch (auditErr) {
      console.warn("[Regenerate Code] Audit log warning:", auditErr);
    }

    return NextResponse.json({ success: true, newVendorCode: newCode, vendorCode: newCode });
  } catch (err: unknown) {
    console.error("[Regenerate Vendor Code Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate vendor code" },
      { status: 500 }
    );
  }
}
