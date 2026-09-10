import { NextRequest, NextResponse } from "next/server";
import { subcontractorOnboardingSchema } from "@/lib/zod/schemas";
import { generateSecureVendorCode } from "@/lib/utils";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("subcontractors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase Fetch Subcontractors Error]", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Map database snake_case to application camelCase
    const subcontractors = (data || []).map((sub) => ({
      id: sub.id,
      authUserId: sub.auth_user_id,
      companyName: sub.company_name,
      phoneNumber: sub.phone_number,
      vendorCode: sub.vendor_code,
      contactPerson: sub.contact_person,
      licenseNumber: sub.license_number,
      stateRegion: sub.state_region,
      isActive: sub.is_active,
      rating: Number(sub.rating) || 5.0,
      assignedJobsCount: sub.assigned_jobs_count || 0,
      completedJobsCount: sub.completed_jobs_count || 0,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
    }));

    return NextResponse.json({ success: true, subcontractors });
  } catch (err: unknown) {
    console.error("[Get Subcontractors Error]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = subcontractorOnboardingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { companyName, contactPerson, phoneNumber, licenseNumber, stateRegion } = parseResult.data;
    const vendorCode = generateSecureVendorCode("VND");

    const supabase = await createServerSupabaseClient();

    // 1. Direct Supabase INSERT into subcontractors table
    const { data, error } = await supabase
      .from("subcontractors")
      .insert({
        company_name: companyName,
        contact_person: contactPerson,
        phone_number: phoneNumber,
        license_number: licenseNumber || null,
        state_region: stateRegion,
        vendor_code: vendorCode,
        is_active: true,
        rating: 5.00,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase Insert Subcontractor Error]", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 2. Insert immutable audit log for compliance
    try {
      await supabase.from("audit_logs").insert({
        action: "SUBCONTRACTOR_ONBOARDED",
        actor_type: "ADMIN",
        actor_identifier: "dispatcher@369akruniverse.in",
        resource_id: data.id,
        resource_type: "subcontractors",
        metadata: {
          vendorCode,
          companyName,
          phoneNumber,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Insert Warning]", auditErr);
    }

    const newSubcontractor = {
      id: data.id,
      companyName: data.company_name,
      phoneNumber: data.phone_number,
      vendorCode: data.vendor_code,
      contactPerson: data.contact_person,
      licenseNumber: data.license_number,
      stateRegion: data.state_region,
      isActive: data.is_active,
      rating: Number(data.rating) || 5.0,
      assignedJobsCount: 0,
      completedJobsCount: 0,
      createdAt: data.created_at,
    };

    return NextResponse.json(
      { success: true, subcontractor: newSubcontractor },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[Onboard Subcontractor Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to onboard subcontractor" },
      { status: 500 }
    );
  }
}
