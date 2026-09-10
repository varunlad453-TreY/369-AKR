import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/state/mock-db";
import { proofOfWorkUploadSchema } from "@/lib/zod/schemas";

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

    // Simulated storage bucket path
    const storagePath = `proof-of-work/${jobId}/${Date.now()}_${fileName.replace(/\s+/g, "_")}`;

    const newDoc = db.addDocument({
      jobId,
      documentType,
      fileName,
      fileSize,
      mimeType,
      storagePath,
      downloadUrl: body.previewUrl || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80",
      uploadedBy: body.uploadedBy || "subcontractor-field-agent",
      uploaderRole: body.uploaderRole || "SUBCONTRACTOR",
      geotag: latitude && longitude ? {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString(),
        addressSnippet: notes || undefined,
      } : undefined,
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Upload Document Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
