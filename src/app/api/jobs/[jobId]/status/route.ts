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

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (err: unknown) {
    console.error("[Update Job Status Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
