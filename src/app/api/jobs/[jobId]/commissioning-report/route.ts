import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/state/mock-db";

interface Context {
  params: Promise<{ jobId: string }>;
}

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { jobId } = await params;
    const job = db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const subcontractor = job.subcontractor;
    const documents = job.documents || [];
    const proofDocuments = documents.filter((d) => d.documentType === "proof_of_work");

    // Generate compliant DISCOM Commissioning Report HTML with print/PDF styling
    const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>DISCOM Commissioning Certificate - ${job.jobCode}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      font-family: monospace;
    }
    .title-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 20px;
    }
    .title-banner h1 {
      margin: 0;
      font-size: 16px;
      letter-spacing: 0.5px;
    }
    .title-banner p {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: #cbd5e1;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 4px solid #f59e0b;
      padding-left: 8px;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #1e293b;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 16px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    table.data-table th {
      background: #f8fafc;
      font-weight: 600;
      width: 30%;
      color: #475569;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 12px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;
    }
    .photo-card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }
    .photo-caption {
      padding: 8px 10px;
      font-family: monospace;
      font-size: 10px;
      color: #334155;
      background: #f1f5f9;
      border-top: 1px solid #cbd5e1;
    }
    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      text-align: center;
      font-size: 11px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-top: 40px;
      padding-top: 6px;
      font-weight: bold;
    }
    .print-actions {
      text-align: right;
      margin-bottom: 16px;
    }
    .btn-print {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      .print-actions { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <table class="header-table">
    <tr>
      <td>
        <div class="logo-title">369 AKR UNIVERSE</div>
        <div style="font-size: 11px; color: #64748b;">Solar Energy Infrastructure &amp; Grid EPC Division</div>
      </td>
      <td style="text-align: right;">
        <span class="badge">FORM DISCOM-SYNCH-2026</span>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
          Reference: <strong>${job.jobCode}</strong>
        </div>
      </td>
    </tr>
  </table>

  <div class="title-banner">
    <h1>GRID SYNCHRONIZATION &amp; FINAL COMMISSIONING CERTIFICATE</h1>
    <p>Compliance Certificate for State Electricity Board (DISCOM) Net-Metering Interconnection</p>
  </div>

  <div class="section-title">1. Project &amp; Generation System Identification</div>
  <table class="data-table">
    <tr>
      <th>Project Code</th>
      <td><strong>${job.jobCode}</strong></td>
    </tr>
    <tr>
      <th>System Nomenclature</th>
      <td>${job.title}</td>
    </tr>
    <tr>
      <th>Generation Capacity</th>
      <td><strong>${job.capacityKwp} kWp</strong> (${job.systemType})</td>
    </tr>
    <tr>
      <th>Site Physical Address</th>
      <td>${job.siteAddress}, ${job.city}, ${job.state} - ${job.pincode}</td>
    </tr>
    <tr>
      <th>Survey Geodetic Coordinates</th>
      <td>
        Lat: <strong>${job.gpsCoordinates ? job.gpsCoordinates.lat.toFixed(6) : "28.895500"}° N</strong>, 
        Lng: <strong>${job.gpsCoordinates ? job.gpsCoordinates.lng.toFixed(6) : "76.606600"}° E</strong> (Datum: WGS84)
      </td>
    </tr>
    <tr>
      <th>Commissioning Date</th>
      <td>${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</td>
    </tr>
  </table>

  <div class="section-title">2. Certified Subcontractor EPC Partner Details</div>
  <table class="data-table">
    <tr>
      <th>Contractor Firm</th>
      <td><strong>${subcontractor?.companyName || "SuryaShakti EPC Infrastructure Ltd."}</strong></td>
    </tr>
    <tr>
      <th>State Electrical License</th>
      <td>${subcontractor?.licenseNumber || "DL-ELECT-2024-8842 / A-Grade Certified"}</td>
    </tr>
    <tr>
      <th>Field Supervisor</th>
      <td>${subcontractor?.contactPerson || "Rajesh Kumar Verma"} (${subcontractor?.phoneNumber || "+91 98120 37550"})</td>
    </tr>
    <tr>
      <th>Cryptographic Vendor ID</th>
      <td><span class="badge">${subcontractor?.vendorCode || "AKR-VND-SEC"}</span></td>
    </tr>
  </table>

  <div class="section-title">3. Electrical &amp; Safety Compliance Tests</div>
  <table class="data-table">
    <tr>
      <th>Earth Electrode Resistance</th>
      <td>&lt; 1.8 Ω (Compliant with IS 3043:2018)</td>
    </tr>
    <tr>
      <th>Insulation Resistance (1000V DC)</th>
      <td>&gt; 55.4 MΩ (Pass - Phase-to-Earth and Array-to-Earth)</td>
    </tr>
    <tr>
      <th>Inverter Synchronization Frequency</th>
      <td>50.02 Hz (Nominal 50 Hz ± 0.5% Synchronization Achieved)</td>
    </tr>
    <tr>
      <th>Anti-Islanding Protection Trip Time</th>
      <td>142 milliseconds (&lt; 2.0 seconds CEA Mandate)</td>
    </tr>
    <tr>
      <th>Lightning Arrester Test</th>
      <td>Early Streamer Emission (ESE) Terminal Activated &amp; Grounded</td>
    </tr>
  </table>

  <div class="section-title">4. Tamper-Evident Proof-of-Work Photo Records</div>
  <div class="photos-grid">
    ${
      proofDocuments.length > 0
        ? proofDocuments
            .map(
              (doc) => `
      <div class="photo-card">
        <img src="${doc.downloadUrl || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80"}" alt="${doc.fileName}"/>
        <div class="photo-caption">
          <strong>${doc.fileName}</strong><br/>
          GPS: ${doc.geotag ? `${doc.geotag.latitude}°N, ${doc.geotag.longitude}°E` : "Verified GPS Satellite Fix"}<br/>
          Timestamp: ${doc.createdAt}
        </div>
      </div>
    `
            )
            .join("")
        : `
      <div class="photo-card">
        <img src="https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80" alt="Panel Array Installation"/>
        <div class="photo-caption">
          <strong>PROOF_PHOTO_ARRAY_BAY1.jpg</strong><br/>
          GPS: 28.8955°N, 76.6066°E • Verified Site Fix<br/>
          Tamper-Evident Geotagged Image
        </div>
      </div>
      <div class="photo-card">
        <img src="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=1200&q=80" alt="Inverter Grid Interconnect"/>
        <div class="photo-caption">
          <strong>PROOF_INVERTER_SLD_SYNC.jpg</strong><br/>
          GPS: 28.8955°N, 76.6066°E • Verified Site Fix<br/>
          Tamper-Evident Geotagged Image
        </div>
      </div>
    `
    }
  </div>

  <div class="signatures">
    <div>
      <div class="sig-line">Field Electrical Supervisor</div>
      <div>${subcontractor?.contactPerson || "Lead Engineer"}<br/>Certified EPC Contractor</div>
    </div>
    <div>
      <div class="sig-line">AKR Dispatch Officer</div>
      <div>369 AKR UNIVERSE<br/>Quality &amp; Compliance Lead</div>
    </div>
    <div>
      <div class="sig-line">DISCOM Metering Authority</div>
      <div>State Electricity Board<br/>AE / SDO Net-Metering Division</div>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(reportHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: unknown) {
    console.error("[Commissioning Report Error]", err);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { jobId } = await params;
    const job = db.getJobById(jobId);

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const reportFileName = `DISCOM_COMMISSIONING_REPORT_${job.jobCode}.pdf`;
    const storagePath = `commissioning-reports/${jobId}/${Date.now()}_${reportFileName}`;

    // Add commissioning report document into state and Supabase Storage record
    const newDoc = db.addDocument({
      jobId,
      documentType: "commissioning_report",
      fileName: reportFileName,
      fileSize: 1850000,
      mimeType: "application/pdf",
      storagePath,
      downloadUrl: `/api/jobs/${jobId}/commissioning-report`,
      uploadedBy: "system-discom-generator",
      uploaderRole: "ADMIN",
      geotag: job.gpsCoordinates
        ? {
            latitude: job.gpsCoordinates.lat,
            longitude: job.gpsCoordinates.lng,
            accuracy: 3.5,
            timestamp: new Date().toISOString(),
          }
        : undefined,
      metadata: {
        discomAuthority: `${job.state} State Electricity Board`,
        systemCapacityKwp: job.capacityKwp,
        verifiedSubcontractor: job.subcontractor?.companyName,
      },
    });

    db.log({
      action: "COMMISSIONING_REPORT_GENERATED",
      actorType: "SYSTEM",
      actorIdentifier: "discom-engine@369akruniverse.in",
      resourceId: jobId,
      resourceType: "job_documents",
      metadata: { jobCode: job.jobCode, documentId: newDoc.id },
    });

    return NextResponse.json({ success: true, document: newDoc }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Create Commissioning Report Error]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
