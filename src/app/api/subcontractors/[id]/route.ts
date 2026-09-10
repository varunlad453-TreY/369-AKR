import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    const { id } = await params;

    // Admin-only — verify session cookie
    const adminSession = req.cookies.get("akr_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch the subcontractor first so we can log what was deleted
    const { data: sub, error: fetchError } = await supabase
      .from("subcontractors")
      .select("id, company_name, vendor_code, phone_number")
      .eq("id", id)
      .single();

    if (fetchError || !sub) {
      return NextResponse.json(
        { success: false, error: "Contractor not found" },
        { status: 404 }
      );
    }

    // Check if they have active jobs — block deletion if so
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select("id, status")
      .eq("subcontractor_id", id)
      .in("status", ["assigned", "en_route", "on_site", "in_progress"]);

    if (activeJobs && activeJobs.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: ${sub.company_name} has ${activeJobs.length} active project(s) in progress. Reassign or complete those jobs first.`,
        },
        { status: 409 }
      );
    }

    // Perform deletion
    const { error: deleteError } = await supabase
      .from("subcontractors")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Delete Subcontractor Error]", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to remove contractor from directory." },
        { status: 500 }
      );
    }

    // Audit log
    try {
      let adminEmail = "dispatcher@369akruniverse.in";
      try {
        const parsed = JSON.parse(adminSession);
        adminEmail = parsed.email || adminEmail;
      } catch {}

      await supabase.from("audit_logs").insert({
        action: "SUBCONTRACTOR_DELETED",
        actor_type: "ADMIN",
        actor_identifier: adminEmail,
        resource_id: id,
        resource_type: "subcontractors",
        metadata: {
          companyName: sub.company_name,
          vendorCode: sub.vendor_code,
          phone: sub.phone_number,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Warning]", auditErr);
    }

    return NextResponse.json({ success: true, deletedCompany: sub.company_name });
  } catch (err: unknown) {
    console.error("[Delete Subcontractor API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
