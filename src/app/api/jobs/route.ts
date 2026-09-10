import { NextRequest, NextResponse } from "next/server";
import { jobCreationSchema } from "@/lib/zod/schemas";
import { db } from "@/lib/state/mock-db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subcontractorId = searchParams.get("subcontractorId");

  if (subcontractorId) {
    const jobs = db.getJobsBySubcontractor(subcontractorId);
    return NextResponse.json({ success: true, jobs });
  }

  const jobs = db.getJobs();
  return NextResponse.json({ success: true, jobs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = jobCreationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { gpsLat, gpsLng, ...jobFields } = parseResult.data;

    const newJob = db.createJob({
      ...jobFields,
      description: jobFields.description || "",
      notes: jobFields.notes || "",
      status: "assigned",
      createdBy: "admin-dispatcher-01",
      gpsCoordinates: gpsLat && gpsLng ? {
        lat: gpsLat,
        lng: gpsLng,
      } : undefined,
    });

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Create Job API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch project job" },
      { status: 500 }
    );
  }
}
