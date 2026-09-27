import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "./route";

// Mock Supabase Server Client
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => {
            if (table === "jobs") {
              return { data: { id: "job-uuid-1234", job_code: "JOB-101" }, error: null };
            }
            return { data: null, error: null };
          }),
        })),
      })),
      insert: vi.fn(async () => ({ error: null })),
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUploadUrl: vi.fn(async (path: string) => ({
          data: {
            signedUrl: `https://mock.supabase.co/storage/v1/object/upload/sign/job-documents/${path}?token=mock-token-xyz`,
            token: "mock-token-xyz",
            path,
          },
          error: null,
        })),
        getPublicUrl: vi.fn((path: string) => ({
          data: {
            publicUrl: `https://mock.supabase.co/storage/v1/object/public/job-documents/${path}`,
          },
        })),
      })),
    },
  })),
}));

describe("Direct-to-Storage Presigned URL Generation Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthorized requests without session cookies with HTTP 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/jobs/job-uuid-1234/presigned-url", {
      method: "POST",
      body: JSON.stringify({ fileName: "solar_array.jpg" }),
    });

    const res = await POST(req, { params: Promise.resolve({ jobId: "job-uuid-1234" }) });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Unauthorized");
  });

  it("accepts valid subcontractor session cookie and returns signed upload URL (POST)", async () => {
    const subSession = JSON.stringify({
      id: "sub-123",
      vendorCode: "VEND-001",
      company: "Apex Solar",
      phone: "+919876543210",
    });

    const req = new NextRequest("http://localhost:3000/api/jobs/job-uuid-1234/presigned-url", {
      method: "POST",
      headers: {
        cookie: `akr_sub_session=${encodeURIComponent(subSession)}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fileName: "inverter_reading.jpg", mimeType: "image/jpeg" }),
    });

    const res = await POST(req, { params: Promise.resolve({ jobId: "job-uuid-1234" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.signedUrl).toContain("job-documents");
    expect(data.token).toBe("mock-token-xyz");
    expect(data.storagePath).toContain("proof-of-work/job-uuid-1234");
    expect(data.publicUrl).toBeDefined();
    expect(data.expiresIn).toBe(60);
    expect(data.method).toBe("PUT");
  });

  it("accepts valid admin session cookie and resolves job_code (GET)", async () => {
    const adminSession = JSON.stringify({
      id: "admin-001",
      email: "dispatcher@369akruniverse.in",
      role: "dispatcher",
    });

    const req = new NextRequest(
      "http://localhost:3000/api/jobs/JOB-101/presigned-url?fileName=panel_inspect.png",
      {
        method: "GET",
        headers: {
          cookie: `akr_admin_session=${encodeURIComponent(adminSession)}`,
        },
      }
    );

    const res = await GET(req, { params: Promise.resolve({ jobId: "JOB-101" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.signedUrl).toBeDefined();
    expect(data.storagePath).toContain("proof-of-work/job-uuid-1234");
  });
});
