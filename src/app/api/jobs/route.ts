import { NextRequest, NextResponse } from "next/server";
import { jobCreationSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { generateJobCode } from "@/lib/utils";
import { Job, JobDocument } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subcontractorId = searchParams.get("subcontractorId");

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("jobs")
      .select("*, job_documents(*)")
      .order("created_at", { ascending: false });

    if (subcontractorId) {
      query = query.eq("subcontractor_id", subcontractorId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const jobs: Job[] = data.map((j) => ({
        id: j.id,
        jobCode: j.job_code,
        title: j.title,
        description: j.description || "",
        siteAddress: j.site_address,
        city: j.city,
        state: j.state,
        pincode: j.pincode,
        gpsCoordinates: j.gps_lat && j.gps_lng ? { lat: j.gps_lat, lng: j.gps_lng } : undefined,
        capacityKwp: Number(j.capacity_kwp),
        systemType: j.system_type,
        status: j.status,
        subcontractorId: j.subcontractor_id || undefined,
        createdBy: j.created_by || "admin-dispatcher-01",
        scheduledStart: j.scheduled_start,
        scheduledEnd: j.scheduled_end,
        completedAt: j.completed_at || undefined,
        notes: j.notes || "",
        documents: (j.job_documents || []).map((d: Record<string, unknown>): JobDocument => ({
          id: String(d.id),
          jobId: String(d.job_id),
          documentType: d.document_type as JobDocument["documentType"],
          fileName: String(d.file_name),
          fileSize: Number(d.file_size),
          mimeType: String(d.mime_type),
          storagePath: String(d.storage_path),
          downloadUrl: d.download_url ? String(d.download_url) : undefined,
          uploadedBy: String(d.uploaded_by),
          uploaderRole: d.uploader_role as "ADMIN" | "SUBCONTRACTOR",
          createdAt: String(d.created_at),
          metadata: d.metadata as Record<string, unknown> | undefined,
        })),
        createdAt: j.created_at,
        updatedAt: j.updated_at,
      }));

      return NextResponse.json({ success: true, jobs });
    }

    // Graceful fallback to mock-db if database table not yet populated
    const fallbackJobs = subcontractorId
      ? db.getJobsBySubcontractor(subcontractorId)
      : db.getJobs();
    return NextResponse.json({ success: true, jobs: fallbackJobs });
  } catch (err: unknown) {
    console.error("[Get Jobs API Error]", err);
    return NextResponse.json({ success: true, jobs: db.getJobs() });
  }
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
    const jobCode = generateJobCode(jobFields.city);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        job_code: jobCode,
        title: jobFields.title,
        description: jobFields.description || "",
        site_address: jobFields.siteAddress,
        city: jobFields.city,
        state: jobFields.state,
        pincode: jobFields.pincode,
        gps_lat: gpsLat || null,
        gps_lng: gpsLng || null,
        capacity_kwp: jobFields.capacityKwp,
        system_type: jobFields.systemType,
        status: "assigned",
        subcontractor_id: jobFields.subcontractorId || null,
        created_by: "admin-dispatcher-01",
        scheduled_start: jobFields.scheduledStart,
        scheduled_end: jobFields.scheduledEnd,
        notes: jobFields.notes || "",
      })
      .select()
      .single();

    if (error) {
      console.warn("[Supabase Insert Job Warning, using fallback]", error.message);
      const fallbackJob = db.createJob({
        ...jobFields,
        description: jobFields.description || "",
        notes: jobFields.notes || "",
        status: "assigned",
        createdBy: "admin-dispatcher-01",
        gpsCoordinates: gpsLat && gpsLng ? { lat: gpsLat, lng: gpsLng } : undefined,
      });
      return NextResponse.json({ success: true, job: fallbackJob }, { status: 201 });
    }

    // Insert audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "JOB_DISPATCHED",
        actor_type: "ADMIN",
        actor_identifier: "dispatcher@369akruniverse.in",
        resource_id: data.id,
        resource_type: "jobs",
        metadata: {
          jobCode: data.job_code,
          capacityKwp: data.capacity_kwp,
          title: data.title,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Insert Warning]", auditErr);
    }

    const createdJob: Job = {
      id: data.id,
      jobCode: data.job_code,
      title: data.title,
      description: data.description || "",
      siteAddress: data.site_address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      gpsCoordinates: data.gps_lat && data.gps_lng ? { lat: data.gps_lat, lng: data.gps_lng } : undefined,
      capacityKwp: Number(data.capacity_kwp),
      systemType: data.system_type,
      status: data.status,
      subcontractorId: data.subcontractor_id || undefined,
      createdBy: data.created_by,
      scheduledStart: data.scheduled_start,
      scheduledEnd: data.scheduled_end,
      notes: data.notes || "",
      documents: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ success: true, job: createdJob }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Create Job API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to dispatch project job" },
      { status: 500 }
    );
  }
}
