import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorCode = searchParams.get("vendorCode") || "AKR-1114";

  const scriptPath = path.resolve(process.cwd(), "scripts", "generate_369_sop_vendor_dossier_pdf.py");
  const tempPdfPath = path.join(
    os.tmpdir(),
    `Swarajya_Construction_and_Developers_${vendorCode.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`
  );

  try {
    // Run the Python ReportLab generator
    await new Promise<void>((resolve, reject) => {
      const pythonProcess = spawn("python", [scriptPath, tempPdfPath, vendorCode], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      });

      let stderr = "";
      pythonProcess.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PDF generator script exited with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on("error", (err) => {
        reject(err);
      });
    });

    // Read the generated PDF buffer
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await fs.readFile(tempPdfPath);
    } catch {
      // Fallback to the G:\369 Daily path if temp file wasn't found
      const fallbackPath = path.join(
        "G:",
        "369 Daily",
        "Swarajya_Construction_and_Developers_AKR-1114_Official_Dossier.pdf"
      );
      pdfBuffer = await fs.readFile(fallbackPath);
    }

    // Clean up temporary file asynchronously
    fs.unlink(tempPdfPath).catch(() => {});

    const downloadFilename = `Swarajya_Construction_and_Developers_${vendorCode}_Official_Dossier.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[Subcontractor PDF Export API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate official vendor dossier PDF",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
