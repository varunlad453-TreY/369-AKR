import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Context {
  params: Promise<{ jobId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    const { jobId } = await params;

    // Only callable from admin — verify the session cookie is present
    const adminSession = req.cookies.get("akr_admin_session")?.value;
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin session required" },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Fetch the job first so we can log what was deleted
    const { data: job, error: fetchError } = await supabase
      .from("jobs")
      .select("id, job_code, title, status, subcontractor_id")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete associated documents first (FK cascade may handle this, but explicit is safer)
    await supabase.from("job_documents").delete().eq("job_id", jobId);

    // Delete the job
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (deleteError) {
      console.error("[Delete Job Error]", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete project. It may have dependencies." },
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
        action: "JOB_DELETED",
        actor_type: "ADMIN",
        actor_identifier: adminEmail,
        resource_id: jobId,
        resource_type: "jobs",
        metadata: {
          jobCode: job.job_code,
          title: job.title,
          status: job.status,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Warning]", auditErr);
    }

    return NextResponse.json({ success: true, deletedJobCode: job.job_code });
  } catch (err: unknown) {
    console.error("[Delete Job API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
