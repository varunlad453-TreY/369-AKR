import { NextRequest, NextResponse } from "next/server";
import { subcontractorProfileSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: subcontractorId } = await params;
    const body = await req.json();

    const parseResult = subcontractorProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0]?.message || "Invalid statutory profile data" },
        { status: 400 }
      );
    }

    const {
      gstNumber,
      panNumber,
      bankName,
      bankAccountNumber,
      bankIfsc,
      bankBranch,
    } = parseResult.data;

    const supabase = await createServerSupabaseClient();

    const { data: updatedSub, error } = await supabase
      .from("subcontractors")
      .update({
        gst_number: gstNumber?.trim().toUpperCase() || null,
        pan_number: panNumber?.trim().toUpperCase() || null,
        bank_name: bankName?.trim() || null,
        bank_account_number: bankAccountNumber?.trim() || null,
        bank_ifsc: bankIfsc?.trim().toUpperCase() || null,
        bank_branch: bankBranch?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subcontractorId)
      .select()
      .single();

    if (error) {
      console.warn("[Update Subcontractor Profile Fallback to Mock DB]", error.message);
      const updated = db.updateSubcontractorProfile(subcontractorId, {
        gstNumber: gstNumber?.trim().toUpperCase(),
        panNumber: panNumber?.trim().toUpperCase(),
        bankName: bankName?.trim(),
        bankAccountNumber: bankAccountNumber?.trim(),
        bankIfsc: bankIfsc?.trim().toUpperCase(),
        bankBranch: bankBranch?.trim(),
      });
      if (updated) {
        return NextResponse.json({
          success: true,
          subcontractor: {
            id: updated.id,
            companyName: updated.companyName,
            phoneNumber: updated.phoneNumber,
            vendorCode: updated.vendorCode,
            gstNumber: updated.gstNumber,
            panNumber: updated.panNumber,
            bankName: updated.bankName,
            bankAccountNumber: updated.bankAccountNumber,
            bankIfsc: updated.bankIfsc,
            bankBranch: updated.bankBranch,
          },
        });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Insert audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "SUBCONTRACTOR_PROFILE_UPDATED",
        actor_type: "SUBCONTRACTOR",
        actor_identifier: updatedSub.phone_number,
        resource_id: subcontractorId,
        resource_type: "subcontractors",
        metadata: {
          gstNumber: updatedSub.gst_number,
          panNumber: updatedSub.pan_number,
          bankName: updatedSub.bank_name,
          bankIfsc: updatedSub.bank_ifsc,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Insert Warning]", auditErr);
    }

    return NextResponse.json({
      success: true,
      subcontractor: {
        id: updatedSub.id,
        companyName: updatedSub.company_name,
        phoneNumber: updatedSub.phone_number,
        vendorCode: updatedSub.vendor_code,
        gstNumber: updatedSub.gst_number,
        panNumber: updatedSub.pan_number,
        bankName: updatedSub.bank_name,
        bankAccountNumber: updatedSub.bank_account_number,
        bankIfsc: updatedSub.bank_ifsc,
        bankBranch: updatedSub.bank_branch,
      },
    });
  } catch (err: unknown) {
    console.warn("[Subcontractor Profile API Fallback to Mock DB]", err);
    try {
      const { id: subcontractorId } = await params;
      const body = await req.json();
      const updated = db.updateSubcontractorProfile(subcontractorId, {
        gstNumber: body?.gstNumber?.trim().toUpperCase(),
        panNumber: body?.panNumber?.trim().toUpperCase(),
        bankName: body?.bankName?.trim(),
        bankAccountNumber: body?.bankAccountNumber?.trim(),
        bankIfsc: body?.bankIfsc?.trim().toUpperCase(),
        bankBranch: body?.bankBranch?.trim(),
      });
      if (updated) {
        return NextResponse.json({
          success: true,
          subcontractor: {
            id: updated.id,
            companyName: updated.companyName,
            phoneNumber: updated.phoneNumber,
            vendorCode: updated.vendorCode,
            gstNumber: updated.gstNumber,
            panNumber: updated.panNumber,
            bankName: updated.bankName,
            bankAccountNumber: updated.bankAccountNumber,
            bankIfsc: updated.bankIfsc,
            bankBranch: updated.bankBranch,
          },
        });
      }
    } catch {}

    return NextResponse.json(
      { success: false, error: "Failed to update statutory profile" },
      { status: 500 }
    );
  }
}
