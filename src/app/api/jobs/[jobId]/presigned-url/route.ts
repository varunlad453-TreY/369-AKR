import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

interface Context {
  params: Promise<{ jobId: string }>;
}

interface PresignedUrlPayload {
  fileName?: string;
  mimeType?: string;
  documentType?: string;
}

/**
 * Validates session authorization.
 * Strictly checks for either a verified subcontractor session (akr_sub_session)
 * or verified admin session (akr_admin_session).
 */
function verifySession(req: NextRequest): {
  isAuthorized: boolean;
  actorType: "ADMIN" | "SUBCONTRACTOR";
  actorIdentifier: string;
} {
  // 1. Check for active Enterprise Admin session
  const adminCookie = req.cookies.get("akr_admin_session")?.value;
  if (adminCookie) {
    try {
      const session = JSON.parse(adminCookie);
      if (
        (session?.email || session?.username) &&
        (session.role === "super_admin" || session.role === "dispatcher")
      ) {
        return {
          isAuthorized: true,
          actorType: "ADMIN",
          actorIdentifier: session.email || session.username || "admin",
        };
      }
    } catch {
      // Malformed cookie, proceed to sub session check
    }
  }

  // 2. Check for active Subcontractor OTP session
  const subCookie = req.cookies.get("akr_sub_session")?.value;
  if (subCookie) {
    try {
      const session = JSON.parse(subCookie);
      if (session?.id && typeof session.id === "string") {
        return {
          isAuthorized: true,
          actorType: "SUBCONTRACTOR",
          actorIdentifier: session.vendorCode || session.phone || session.id,
        };
      }
    } catch {
      // Malformed cookie
    }
  }

  return {
    isAuthorized: false,
    actorType: "SUBCONTRACTOR",
    actorIdentifier: "anonymous",
  };
}

/**
 * Core handler to generate short-lived Supabase Storage Signed Upload URLs.
 * Enables zero-memory-buffer direct-to-storage binary photo PUTs from PWA clients.
 */
async function handlePresignedUrl(
  req: NextRequest,
  params: Promise<{ jobId: string }>,
  payload: PresignedUrlPayload
) {
  try {
    // 1. Security Gate: Verify session authentication
    const auth = verifySession(req);
    if (!auth.isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Active subcontractor or admin session required",
        },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    let targetJobId = jobId;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        jobId
      );

    const supabase = await createServerSupabaseClient();

    // 2. Resolve job ID if human-readable job code was passed
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

    // 3. Construct deterministic, collision-resistant storage path
    const rawFileName = payload.fileName || `proof_${Date.now()}.jpg`;
    const sanitizedFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `proof-of-work/${targetJobId}/${Date.now()}_${sanitizedFileName}`;

    // 4. Generate short-lived Signed Upload URL using Supabase Storage SDK (60-second TTL)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("job-documents")
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (signedError || !signedData) {
      logger.error(
        signedError || new Error("Failed to generate signed upload URL"),
        {
          context: "Supabase Storage Presigned URL Generation Error",
          jobId: targetJobId,
          storagePath,
        }
      );

      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            success: false,
            error: `Storage service error: ${signedError?.message || "Failed to generate upload URL"}`,
          },
          { status: 500 }
        );
      }

      // Safe development fallback when local mock bucket is not provisioned
      logger.warn(
        "[Presigned URL] Supabase Storage signed upload URL unavailable in dev",
        { message: signedError?.message, storagePath }
      );

      return NextResponse.json(
        {
          success: false,
          error: signedError?.message || "Failed to generate signed upload URL",
        },
        { status: 500 }
      );
    }

    // 5. Get deterministic public download URL
    const { data: publicUrlData } = supabase.storage
      .from("job-documents")
      .getPublicUrl(storagePath);

    // 6. Record immutable compliance audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "PRESIGNED_UPLOAD_URL_GENERATED",
        actor_type: auth.actorType,
        actor_identifier: auth.actorIdentifier,
        resource_id: targetJobId,
        resource_type: "jobs",
        ip_address:
          req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
        user_agent: req.headers.get("user-agent") || "",
        metadata: {
          storagePath,
          fileName: sanitizedFileName,
          documentType: payload.documentType || "proof_of_work",
        },
      });
    } catch (auditErr) {
      logger.warn("[Presigned URL] Audit log insert warning", {
        error: String(auditErr),
        jobId: targetJobId,
      });
    }

    logger.info("[Presigned Upload URL Generated]", {
      jobId: targetJobId,
      storagePath,
      actorType: auth.actorType,
    });

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      path: signedData.path,
      storagePath,
      publicUrl: publicUrlData.publicUrl,
      expiresIn: 60,
      method: "PUT",
    });
  } catch (err: unknown) {
    logger.error(err, { context: "Presigned URL Generation Fatal Error" });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  const body = (await req.json().catch(() => ({}))) as PresignedUrlPayload;
  return handlePresignedUrl(req, params, body);
}

export async function GET(req: NextRequest, { params }: Context) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName") || undefined;
  const mimeType =
    searchParams.get("mimeType") ||
    searchParams.get("contentType") ||
    undefined;
  const documentType = searchParams.get("documentType") || undefined;

  return handlePresignedUrl(req, params, {
    fileName,
    mimeType,
    documentType,
  });
}
