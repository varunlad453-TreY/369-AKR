import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/state/mock-db";
import { JobStatus } from "@/types";

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

    const updatedJob = db.updateJobStatus(jobId, status, {
      id: actorIdentifier,
      role: actorRole,
      identifier: actorIdentifier,
    });

    if (!updatedJob) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Auto-generate DISCOM Commissioning Report on project completion
    if (status === "completed") {
      const existingDocs = db.getJobById(jobId)?.documents || [];
      const hasReport = existingDocs.some((d) => d.documentType === "commissioning_report");
      if (!hasReport) {
        const reportFileName = `DISCOM_COMMISSIONING_REPORT_${updatedJob.jobCode}.pdf`;
        db.addDocument({
          jobId,
          documentType: "commissioning_report",
          fileName: reportFileName,
          fileSize: 1850000,
          mimeType: "application/pdf",
          storagePath: `commissioning-reports/${jobId}/${Date.now()}_${reportFileName}`,
          downloadUrl: `/api/jobs/${jobId}/commissioning-report`,
          uploadedBy: actorIdentifier,
          uploaderRole: actorRole,
          geotag: updatedJob.gpsCoordinates
            ? {
                latitude: updatedJob.gpsCoordinates.lat,
                longitude: updatedJob.gpsCoordinates.lng,
                accuracy: 3.5,
                timestamp: new Date().toISOString(),
              }
            : undefined,
          metadata: {
            discomAuthority: `${updatedJob.state} State Electricity Board`,
            systemCapacityKwp: updatedJob.capacityKwp,
          },
        });

        db.log({
          action: "COMMISSIONING_REPORT_GENERATED",
          actorType: "SYSTEM",
          actorIdentifier: "discom-engine@369akruniverse.in",
          resourceId: jobId,
          resourceType: "job_documents",
          metadata: { jobCode: updatedJob.jobCode },
        });
      }
    }

    const finalJob = db.getJobById(jobId) || updatedJob;
    return NextResponse.json({ success: true, job: finalJob });

  } catch (err: unknown) {
    console.error("[Update Job Status Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
