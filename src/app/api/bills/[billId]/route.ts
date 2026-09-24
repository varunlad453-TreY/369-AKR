import { NextRequest, NextResponse } from "next/server";
import { adminBillUpdateSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Bill, BillItem, BillStatus } from "@/types";
import { db } from "@/lib/state/mock-db";

interface RouteParams {
  params: Promise<{ billId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { billId } = await params;

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

    if (error || !b) {
      const mockBill = db.getBillById(billId);
      if (mockBill) {
        return NextResponse.json({ success: true, bill: mockBill });
      }
      if (error) {
        console.error("[Get Bill By ID Supabase Error]", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const jobData = b.jobs;
    const subData = b.subcontractors;
    const itemsData = b.bill_items || [];

    const bill: Bill = {
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
            stateRegion: subData.state_region,
            isActive: true,
            rating: 5.0,
            gstNumber: subData.gst_number,
            panNumber: subData.pan_number,
            bankName: subData.bank_name,
            bankAccountNumber: subData.bank_account_number,
            bankIfsc: subData.bank_ifsc,
            bankBranch: subData.bank_branch,
            createdAt: "",
          }
        : undefined,
      items: itemsData.map((item: Record<string, unknown>) => ({
        id: String(item.id),
        billId: String(item.bill_id),
        itemCode: item.item_code as string | undefined,
        description: String(item.description),
        hsnSac: String(item.hsn_sac),
        uom: String(item.uom),
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
    };

    return NextResponse.json({ success: true, bill });
  } catch (err: unknown) {
    console.warn("[Get Bill Detail API Fallback to Mock DB]", err);
    try {
      const { billId } = await params;
      const mockBill = db.getBillById(billId);
      if (mockBill) {
        return NextResponse.json({ success: true, bill: mockBill });
      }
    } catch {}
    return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  let body: any = null;
  try {
    const { billId } = await params;
    body = await req.json();

    const parseResult = adminBillUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const { status, retentionPercentage, tdsPercentage, notes } = parseResult.data;

    const supabase = await createServerSupabaseClient();

    // 1. Fetch current bill financial figures to recalculate net payable securely
    const { data: currentBill, error: fetchErr } = await supabase
      .from("bills")
      .select("id, subtotal, gross_total, invoice_no, status, notes")
      .eq("id", billId)
      .single();

    if (fetchErr || !currentBill) {
      const mockBill = db.getBillById(billId);
      if (mockBill) {
        const subtotal = mockBill.subtotal;
        const grossTotal = mockBill.grossTotal;
        const retentionAmount = Number(((subtotal * retentionPercentage) / 100).toFixed(2));
        const tdsAmount = Number(((subtotal * tdsPercentage) / 100).toFixed(2));
        const netPayable = Number((grossTotal - retentionAmount - tdsAmount).toFixed(2));

        const updated = db.updateBill(billId, {
          status,
          retentionPercentage,
          retentionAmount,
          tdsPercentage,
          tdsAmount,
          netPayable,
          notes: notes !== undefined ? notes : mockBill.notes,
        });

        return NextResponse.json({
          success: true,
          bill: updated,
        });
      }
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const subtotal = Number(currentBill.subtotal) || 0;
    const grossTotal = Number(currentBill.gross_total) || 0;

    // 2. Server-side computation of statutory deductions
    // Retention is calculated on Subtotal (Taxable Value) as per standard Indian EPC practice
    const retentionAmount = Number(
      ((subtotal * retentionPercentage) / 100).toFixed(2)
    );
    // TDS u/s 194C is calculated on Taxable Value
    const tdsAmount = Number(
      ((subtotal * tdsPercentage) / 100).toFixed(2)
    );
    const netPayable = Number(
      (grossTotal - retentionAmount - tdsAmount).toFixed(2)
    );

    // 3. Update database record
    const { data: updatedBill, error: updateErr } = await supabase
      .from("bills")
      .update({
        status,
        retention_percentage: retentionPercentage,
        retention_amount: retentionAmount,
        tds_percentage: tdsPercentage,
        tds_amount: tdsAmount,
        net_payable: netPayable,
        notes: notes !== undefined ? notes : currentBill.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", billId)
      .select()
      .single();

    if (updateErr) {
      console.warn("[Supabase Update Bill Fallback to Mock DB]", updateErr.message);
      const updated = db.updateBill(billId, {
        status,
        retentionPercentage,
        retentionAmount,
        tdsPercentage,
        tdsAmount,
        netPayable,
        notes: notes !== undefined ? notes : currentBill.notes,
      });
      return NextResponse.json({ success: true, bill: updated });
    }

    // 4. Audit Log Record
    try {
      await supabase.from("audit_logs").insert({
        action: "BILL_STATUS_UPDATED",
        actor_type: "ADMIN",
        actor_identifier: "finance-admin@369akruniverse.in",
        resource_id: billId,
        resource_type: "bills",
        metadata: {
          invoiceNo: currentBill.invoice_no,
          previousStatus: currentBill.status,
          newStatus: status,
          retentionPercentage,
          retentionAmount,
          tdsPercentage,
          tdsAmount,
          netPayable,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Insert Warning]", auditErr);
    }

    return NextResponse.json({
      success: true,
      bill: {
        id: updatedBill.id,
        invoiceNo: updatedBill.invoice_no,
        status: updatedBill.status,
        subtotal: Number(updatedBill.subtotal),
        grossTotal: Number(updatedBill.gross_total),
        retentionPercentage: Number(updatedBill.retention_percentage),
        retentionAmount: Number(updatedBill.retention_amount),
        tdsPercentage: Number(updatedBill.tds_percentage),
        tdsAmount: Number(updatedBill.tds_amount),
        netPayable: Number(updatedBill.net_payable),
        notes: updatedBill.notes,
        updatedAt: updatedBill.updated_at,
      },
    });
  } catch (err: unknown) {
    console.warn("[Update Bill API Fallback to Mock DB]", err);
    try {
      const { billId } = await params;
      const mockBill = db.getBillById(billId);
      if (mockBill) {
        const subtotal = mockBill.subtotal;
        const grossTotal = mockBill.grossTotal;
        const retentionPercentage = Number(body?.retentionPercentage) || 0;
        const tdsPercentage = Number(body?.tdsPercentage) || 0;
        const retentionAmount = Number(((subtotal * retentionPercentage) / 100).toFixed(2));
        const tdsAmount = Number(((subtotal * tdsPercentage) / 100).toFixed(2));
        const netPayable = Number((grossTotal - retentionAmount - tdsAmount).toFixed(2));

        const updated = db.updateBill(billId, {
          status: body?.status || mockBill.status,
          retentionPercentage,
          retentionAmount,
          tdsPercentage,
          tdsAmount,
          netPayable,
          notes: body?.notes !== undefined ? body?.notes : mockBill.notes,
        });

        return NextResponse.json({
          success: true,
          bill: updated,
        });
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
