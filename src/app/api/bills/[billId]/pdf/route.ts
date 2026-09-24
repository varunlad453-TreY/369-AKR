import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator";
import { Bill, BillStatus } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    const { billId } = await params;
    let bill: Bill | null = null;

    try {
      const supabase = await createServerSupabaseClient();
      const { data: b, error } = await supabase
        .from("bills")
        .select(`
          *,
          jobs (
            id,
            job_code,
            title,
            description,
            site_address,
            city,
            state,
            capacity_kwp,
            work_order_no,
            work_order_date,
            contract_amount
          ),
          subcontractors (
            id,
            company_name,
            phone_number,
            vendor_code,
            contact_person,
            state_region,
            gst_number,
            pan_number,
            bank_name,
            bank_account_number,
            bank_ifsc,
            bank_branch
          ),
          bill_items (*)
        `)
        .eq("id", billId)
        .maybeSingle();

      if (b && !error) {
        const jobData = b.jobs;
        const subData = b.subcontractors;
        bill = {
          id: b.id,
          jobId: b.job_id,
          subcontractorId: b.subcontractor_id,
          invoiceNo: b.invoice_no,
          invoiceDate: b.invoice_date,
          status: b.status as BillStatus,
          subtotal: Number(b.subtotal) || 0,
          cgstRate: Number(b.cgst_rate) || 0,
          cgstAmount: Number(b.cgst_amount) || 0,
          sgstRate: Number(b.sgst_rate) || 0,
          sgstAmount: Number(b.sgst_amount) || 0,
          igstRate: Number(b.igst_rate) || 0,
          igstAmount: Number(b.igst_amount) || 0,
          grossTotal: Number(b.gross_total) || 0,
          retentionPercentage: Number(b.retention_percentage) || 0,
          retentionAmount: Number(b.retention_amount) || 0,
          tdsPercentage: Number(b.tds_percentage) || 0,
          tdsAmount: Number(b.tds_amount) || 0,
          netPayable: Number(b.net_payable) || 0,
          notes: b.notes || "",
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          job: jobData
            ? {
                id: jobData.id,
                jobCode: jobData.job_code,
                title: jobData.title,
                description: jobData.description,
                siteAddress: jobData.site_address,
                city: jobData.city,
                state: jobData.state,
                pincode: "",
                capacityKwp: Number(jobData.capacity_kwp) || 0,
                systemType: "Rooftop Commercial & Industrial",
                status: "in_progress",
                subcontractorId: b.subcontractor_id,
                createdBy: "admin",
                scheduledStart: "",
                scheduledEnd: "",
                workOrderNo: jobData.work_order_no,
                workOrderDate: jobData.work_order_date,
                contractAmount: Number(jobData.contract_amount) || undefined,
                createdAt: "",
                updatedAt: "",
              }
            : undefined,
          subcontractor: subData
            ? {
                id: subData.id,
                companyName: subData.company_name,
                phoneNumber: subData.phone_number,
                vendorCode: subData.vendor_code,
                contactPerson: subData.contact_person,
                licenseNumber: "",
                stateRegion: subData.state_region,
                gstNumber: subData.gst_number || "",
                panNumber: subData.pan_number || "",
                bankName: subData.bank_name || "",
                bankAccountNumber: subData.bank_account_number || "",
                bankIfsc: subData.bank_ifsc || "",
                bankBranch: subData.bank_branch || "",
                isActive: true,
                rating: 5.0,
                createdAt: "",
              }
            : undefined,
          items: (b.bill_items || []).map((it: any) => ({
            id: it.id,
            billId: it.bill_id,
            description: it.description,
            hsnSacCode: it.hsn_sac_code,
            uom: it.uom,
            quantity: Number(it.quantity) || 0,
            rate: Number(it.rate) || 0,
            amount: Number(it.amount) || 0,
          })),
        };
      }
    } catch {}

    if (!bill) {
      bill = db.getBillById(billId) || null;
    }

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const doc = generateInvoicePDF(bill);
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RA_Bill_${bill.invoiceNo}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("[Bill PDF Generation API Error]", err);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: err?.message },
      { status: 500 }
    );
  }
}
