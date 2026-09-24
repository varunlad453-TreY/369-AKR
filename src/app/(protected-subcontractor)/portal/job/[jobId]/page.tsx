import { redirect, notFound } from "next/navigation";
import { getSubcontractorSession } from "@/lib/auth/subcontractor-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { Job, JobDocument } from "@/types";
import JobDetailClient from "./job-detail-client";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params;

  // Identity comes exclusively from the server-verified session cookie — never from the URL.
  const session = await getSubcontractorSession();
  if (!session) {
    redirect("/gateway");
  }

  let job: Job | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: j, error } = await supabase
      .from("jobs")
      .select("*, job_documents(*)")
      .eq("id", jobId)
      .maybeSingle();

    if (j && !error) {
      job = {
        id: j.id,
        jobCode: j.job_code,
        title: j.title,
        description: j.description,
        siteAddress: j.site_address,
        city: j.city,
        state: j.state,
        pincode: j.pincode,
        gpsCoordinates: { lat: j.gps_lat, lng: j.gps_lng },
        capacityKwp: Number(j.capacity_kwp),
        systemType: j.system_type,
        status: j.status,
        subcontractorId: j.subcontractor_id,
        createdBy: j.created_by,
        scheduledStart: j.scheduled_start,
        scheduledEnd: j.scheduled_end,
        completedAt: j.completed_at,
        notes: j.notes,
        documents: (j.job_documents || []).map((d: Record<string, unknown>) => ({
          id: String(d.id),
          jobId: String(d.job_id),
          documentType: d.document_type as JobDocument["documentType"],
          fileName: String(d.file_name),
          fileSize: Number(d.file_size),
          mimeType: String(d.mime_type),
          storagePath: String(d.storage_path),
          downloadUrl: d.download_url as string | undefined,
          uploadedBy: String(d.uploaded_by),
          uploaderRole: d.uploader_role as "ADMIN" | "SUBCONTRACTOR",
          createdAt: String(d.created_at),
          metadata: d.metadata as Record<string, unknown> | undefined,
        })),
        createdAt: j.created_at,
        updatedAt: j.updated_at,
      };
    }
  } catch {}

  if (!job) {
    const mockJob = db.getJobById(jobId) || db.getJobs().find(j => j.id === jobId || j.jobCode === jobId);
    if (mockJob) {
      job = mockJob;
    }
  }

  if (!job) {
    notFound();
  }

  // A subcontractor may only ever view their own assigned projects.
  if (job.subcontractorId !== session.id) {
    redirect("/portal");
  }

  return <JobDetailClient initialJob={job} subId={session.id} />;
}
