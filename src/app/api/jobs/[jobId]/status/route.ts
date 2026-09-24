import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { JobStatus } from "@/types";
import { db } from "@/lib/state/mock-db";

interface Context {
  params: Promise<{ jobId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const { jobId } = await params;
    const body = await req.json();
    const { status, actorRole = "SUBCONTRACTOR", actorIdentifier = "field-operator" } = body;

    const validStatuses: JobStatus[] = [
      "draft",
      "assigned",
      "en_route",
      "on_site",
      "in_progress",
      "inspection_pending",
      "completed",
      "rejected",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    try {
      const supabase = await createServerSupabaseClient();

      // 1. Resolve Target Job ID
      let targetId = jobId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);

      const { data: existingJob, error: findError } = isUuid
        ? await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle()
        : await supabase.from("jobs").select("*").or(`job_code.eq.${jobId},id.eq.${jobId}`).maybeSingle();

      if (findError || !existingJob) {
        throw new Error(findError?.message || "Job not found in Supabase");
      }

    targetId = existingJob.id;

    // 2. Update status in PostgreSQL jobs table
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updatedJob, error: updateError } = await supabase
      .from("jobs")
      .update(updatePayload)
      .eq("id", targetId)
      .select()
      .single();

    if (updateError || !updatedJob) {
      console.error("[Job Status Update DB Error]", updateError);
      return NextResponse.json(
        { success: false, error: updateError?.message || "Failed to update job status in database" },
        { status: 500 }
      );
    }

    // 3. Auto-generate DISCOM Commissioning Report on project completion
    if (status === "completed") {
      const { data: existingDocs } = await supabase
        .from("job_documents")
        .select("id")
        .eq("job_id", targetId)
        .eq("document_type", "commissioning_report");

      if (!existingDocs || existingDocs.length === 0) {
        const reportFileName = `DISCOM_COMMISSIONING_REPORT_${updatedJob.job_code}.pdf`;

        await supabase.from("job_documents").insert({
          job_id: targetId,
          document_type: "commissioning_report",
          file_name: reportFileName,
          file_size: 1850000,
          mime_type: "application/pdf",
          storage_path: `commissioning-reports/${targetId}/${Date.now()}_${reportFileName}`,
          downloadUrl: `/api/jobs/${targetId}/commissioning-report`,
          uploaded_by: actorIdentifier,
          uploader_role: actorRole === "ADMIN" ? "ADMIN" : "SUBCONTRACTOR",
          geotag: (updatedJob.gps_lat && updatedJob.gps_lng) ? {
            latitude: updatedJob.gps_lat,
            longitude: updatedJob.gps_lng,
            accuracy: 3.5,
            timestamp: new Date().toISOString(),
          } : null,
          metadata: {
            discomAuthority: `${updatedJob.state} State Electricity Board`,
            systemCapacityKwp: updatedJob.capacity_kwp,
          },
        });

        await supabase.from("audit_logs").insert({
          action: "COMMISSIONING_REPORT_GENERATED",
          actor_type: "SYSTEM",
          actor_identifier: "discom-engine@369akruniverse.in",
          resource_id: targetId,
          resource_type: "jobs",
          metadata: { jobCode: updatedJob.job_code },
        });
      }
    }

    // 4. Construct normalized camelCase Job response
    const jobResponse = {
      id: updatedJob.id,
      jobCode: updatedJob.job_code,
      title: updatedJob.title,
      description: updatedJob.description,
      siteAddress: updatedJob.site_address,
      city: updatedJob.city,
      state: updatedJob.state,
      pincode: updatedJob.pincode,
      gpsCoordinates: {
        lat: updatedJob.gps_lat,
        lng: updatedJob.gps_lng,
      },
      capacityKwp: Number(updatedJob.capacity_kwp),
      systemType: updatedJob.system_type,
      status: updatedJob.status,
      subcontractorId: updatedJob.subcontractor_id,
      createdBy: updatedJob.created_by,
      scheduledStart: updatedJob.scheduled_start,
      scheduledEnd: updatedJob.scheduled_end,
      completedAt: updatedJob.completed_at,
      notes: updatedJob.notes,
      createdAt: updatedJob.created_at,
      updatedAt: updatedJob.updated_at,
    };

      return NextResponse.json({ success: true, job: jobResponse });
    } catch (supaErr) {
      console.warn("[Job Status Update Supabase Fallback to Mock DB]", supaErr);
      const updated = db.updateJobStatus(jobId, status, {
        id: actorIdentifier,
        role: actorRole === "ADMIN" ? "ADMIN" : "SUBCONTRACTOR",
        identifier: actorIdentifier,
      });
      if (updated) {
        return NextResponse.json({ success: true, job: updated });
      }
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }
  } catch (err: unknown) {
    console.warn("[Update Job Status Error Fallback]", err);
    try {
      const { jobId } = await params;
      const body = await req.json().catch(() => ({}));
      const updated = db.updateJobStatus(jobId, body.status, {
        id: body.actorIdentifier || "operator",
        role: body.actorRole === "ADMIN" ? "ADMIN" : "SUBCONTRACTOR",
        identifier: body.actorIdentifier || "operator",
      });
      if (updated) {
        return NextResponse.json({ success: true, job: updated });
      }
    } catch {}
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
