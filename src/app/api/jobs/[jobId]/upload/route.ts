import { NextRequest, NextResponse } from "next/server";
import { proofOfWorkUploadSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";

interface Context {
  params: Promise<{ jobId: string }>;
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { jobId } = await params;
    const body = await req.json();

    const parseResult = proofOfWorkUploadSchema.safeParse({
      ...body,
      jobId,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      documentType,
      fileName,
      fileSize,
      mimeType,
      latitude,
      longitude,
      accuracy,
      notes,
    } = parseResult.data;

    let targetJobId = jobId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);

    try {
      const supabase = await createServerSupabaseClient();

      if (!isUuid) {
        const { data: jobRecord } = await supabase
          .from("jobs")
          .select("id, job_code")
          .eq("job_code", jobId)
          .maybeSingle();

        if (jobRecord) {
          targetJobId = jobRecord.id;
        }
      }

    // 2. Decode and convert base64 image payload from PWA into a binary Buffer
    let fileBuffer: Buffer | null = null;
    let detectedMimeType = mimeType || "image/jpeg";
    const imagePayload = body.previewUrl || body.base64Data;

    if (imagePayload && typeof imagePayload === "string") {
      const dataUriMatch = imagePayload.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (dataUriMatch) {
        detectedMimeType = dataUriMatch[1];
        fileBuffer = Buffer.from(dataUriMatch[2], "base64");
      } else if (!imagePayload.startsWith("http://") && !imagePayload.startsWith("https://")) {
        try {
          fileBuffer = Buffer.from(imagePayload, "base64");
        } catch {
          console.warn("[Upload Proof] Failed to parse payload as raw base64");
        }
      }
    }

    // 3. Upload to Supabase Storage Bucket ('job-documents')
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `proof-of-work/${targetJobId}/${Date.now()}_${sanitizedFileName}`;
    let downloadUrl = body.previewUrl || "";

    if (fileBuffer) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("job-documents")
        .upload(storagePath, fileBuffer, {
          contentType: detectedMimeType,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("job-documents")
          .getPublicUrl(storagePath);

        downloadUrl = publicUrlData.publicUrl;
      } else if (uploadError) {
        console.warn(
          "[Upload Proof] Supabase Storage upload note (Bucket configuration may be pending):",
          uploadError.message
        );
      }
    }

    // 4. Construct live GPS Geotag metadata
    const geotagData = (latitude && longitude) ? {
      latitude,
      longitude,
      accuracy: accuracy ?? 5.0,
      timestamp: new Date().toISOString(),
      addressSnippet: notes || undefined,
    } : null;

    // 5. INSERT metadata into public.job_documents PostgreSQL table
    const { data: docRecord, error: docInsertError } = await supabase
      .from("job_documents")
      .insert({
        job_id: targetJobId,
        document_type: documentType,
        file_name: fileName,
        file_size: fileBuffer ? fileBuffer.length : (fileSize || 1024),
        mime_type: detectedMimeType,
        storage_path: storagePath,
        download_url: downloadUrl || null,
        uploaded_by: body.uploadedBy || "subcontractor-field-agent",
        uploader_role: (body.uploaderRole === "ADMIN" ? "ADMIN" : "SUBCONTRACTOR"),
        geotag: geotagData,
        metadata: {
          notes: notes || null,
          source: "PWA_FIELD_PROOF",
          capturedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (docInsertError) {
      console.error("[Upload Proof] Database insert failed:", docInsertError);
      return NextResponse.json(
        { success: false, error: `Database document registration error: ${docInsertError.message}` },
        { status: 500 }
      );
    }

    // 6. Record immutable compliance audit log in public.audit_logs
    try {
      await supabase.from("audit_logs").insert({
        action: "PROOF_UPLOADED",
        actor_type: body.uploaderRole === "ADMIN" ? "ADMIN" : "SUBCONTRACTOR",
        actor_identifier: body.uploadedBy || "subcontractor-field-agent",
        resource_id: targetJobId,
        resource_type: "jobs",
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
        user_agent: req.headers.get("user-agent") || "",
        metadata: {
          documentId: docRecord.id,
          fileName,
          documentType,
          storagePath,
          downloadUrl,
          geotag: geotagData,
        },
      });
    } catch (auditErr) {
      console.warn("[Upload Proof] Audit log insert warning:", auditErr);
    }

    // 7. Map database row to application JobDocument model
    const documentResponse = {
      id: docRecord.id,
      jobId: docRecord.job_id,
      documentType: docRecord.document_type,
      fileName: docRecord.file_name,
      fileSize: Number(docRecord.file_size),
      mimeType: docRecord.mime_type,
      storagePath: docRecord.storage_path,
      downloadUrl: docRecord.download_url,
      uploadedBy: docRecord.uploaded_by,
      uploaderRole: docRecord.uploader_role,
      geotag: docRecord.geotag,
      metadata: docRecord.metadata,
      createdAt: docRecord.created_at,
    };

      return NextResponse.json(
        { success: true, document: documentResponse },
        { status: 201 }
      );
    } catch (supaErr) {
      console.warn("[Upload Document Supabase Fallback to Mock DB]", supaErr);
      const geotagData = (latitude && longitude) ? {
        latitude,
        longitude,
        accuracy: accuracy ?? 5.0,
        timestamp: new Date().toISOString(),
        addressSnippet: notes || undefined,
      } : undefined;

      const newDoc = db.addDocument({
        jobId: targetJobId,
        documentType,
        fileName,
        fileSize: fileSize || 1024,
        mimeType: mimeType || "image/jpeg",
        storagePath: `proof-of-work/${targetJobId}/${Date.now()}_${fileName}`,
        downloadUrl: body.previewUrl || "/mock-docs/proof.jpg",
        uploadedBy: body.uploadedBy || "subcontractor-field-agent",
        uploaderRole: body.uploaderRole === "ADMIN" ? "ADMIN" : "SUBCONTRACTOR",
        geotag: geotagData,
      });

      return NextResponse.json(
        { success: true, document: newDoc },
        { status: 201 }
      );
    }
  } catch (err: unknown) {
    console.error("[Upload Document Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
