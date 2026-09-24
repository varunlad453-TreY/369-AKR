import { NextRequest, NextResponse } from "next/server";
import { billCreationSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Bill, BillItem, BillStatus } from "@/types";
import { db } from "@/lib/state/mock-db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subcontractorId = searchParams.get("subcontractorId");
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");

    const supabase = await createServerSupabaseClient();
    let query = supabase
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
      .order("created_at", { ascending: false });

    if (subcontractorId) {
      query = query.eq("subcontractor_id", subcontractorId);
    }
    if (jobId) {
      query = query.eq("job_id", jobId);
    }
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Get Bills Supabase Error]", error);
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Database service unavailable. Unable to retrieve bills." },
          { status: 500 }
        );
      }
      console.warn("[Get Bills Supabase Fallback to Mock DB in development]", error.message);
      const mockBills = db.getBills(
        subcontractorId || undefined,
        jobId || undefined,
        status || undefined
      );
      return NextResponse.json({ success: true, bills: mockBills });
    }

    const bills: Bill[] = (data || []).map((b) => {
      const jobData = b.jobs;
      const subData = b.subcontractors;
      const itemsData = b.bill_items || [];

      return {
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
    });

    return NextResponse.json({ success: true, bills });
  } catch (err: unknown) {
    console.error("[Get Bills API Error]", err);
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Internal Server Error. Failed to retrieve bills." },
        { status: 500 }
      );
    }
    console.warn("[Get Bills - Fallback to Mock DB in development]", err);
    const { searchParams } = new URL(req.url);
    const subcontractorId = searchParams.get("subcontractorId");
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const mockBills = db.getBills(
      subcontractorId || undefined,
      jobId || undefined,
      status || undefined
    );
    return NextResponse.json({ success: true, bills: mockBills });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = billCreationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { jobId, subcontractorId, invoiceNo, invoiceDate, taxType, items, notes } = parseResult.data;

    // 1. Server-side accurate math computation (Never trust client math)
    const computedItems = items.map((item) => {
      const qty = Number(item.quantity);
      const rate = Number(item.rate);
      const amount = Number((qty * rate).toFixed(2));
      return {
        item_code: item.itemCode || null,
        description: item.description.trim(),
        hsn_sac: item.hsnSac.trim(),
        uom: item.uom.trim(),
        quantity: qty,
        rate: rate,
        amount: amount,
      };
    });

    const subtotal = Number(
      computedItems.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)
    );

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (taxType === "INTRA_STATE") {
      cgstRate = 9.0;
      cgstAmount = Number((subtotal * 0.09).toFixed(2));
      sgstRate = 9.0;
      sgstAmount = Number((subtotal * 0.09).toFixed(2));
    } else {
      igstRate = 18.0;
      igstAmount = Number((subtotal * 0.18).toFixed(2));
    }

    const grossTotal = Number(
      (subtotal + cgstAmount + sgstAmount + igstAmount).toFixed(2)
    );

    // Initial draft/submitted status has 0 deductions until verified and approved by admin
    const retentionPercentage = 0.0;
    const retentionAmount = 0.0;
    const tdsPercentage = 0.0;
    const tdsAmount = 0.0;
    const netPayable = grossTotal;

    let billData = null;
    let billError = null;
    let supabase: any = null;

    try {
      supabase = await createServerSupabaseClient();
      const res = await supabase
        .from("bills")
        .insert({
          job_id: jobId,
          subcontractor_id: subcontractorId,
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          status: "submitted",
          subtotal,
          cgst_rate: cgstRate,
          cgst_amount: cgstAmount,
          sgst_rate: sgstRate,
          sgst_amount: sgstAmount,
          igst_rate: igstRate,
          igst_amount: igstAmount,
          gross_total: grossTotal,
          retention_percentage: retentionPercentage,
          retention_amount: retentionAmount,
          tds_percentage: tdsPercentage,
          tds_amount: tdsAmount,
          net_payable: netPayable,
          notes: notes || "",
        })
        .select()
        .single();
      billData = res.data;
      billError = res.error;
    } catch (e: any) {
      billError = { message: e?.message || "Supabase offline" };
    }

    if (billError || !billData) {
      if (billError?.message?.includes("unique")) {
        return NextResponse.json(
          { success: false, error: "An invoice with this Invoice Number already exists." },
          { status: 400 }
        );
      }

      // Fail fast in production: do NOT fall back to RAM DB to prevent silent financial data loss
      if (process.env.NODE_ENV === "production") {
        console.error("[Supabase Insert Bill Production Failure]", billError);
        return NextResponse.json(
          {
            success: false,
            error: "Database transaction failed. Invoice creation aborted to prevent financial data loss.",
          },
          { status: 500 }
        );
      }

      console.warn("[Supabase Insert Bill Fallback to Mock DB in development]", billError?.message);
      const createdBill = db.createBill(
        {
          jobId,
          subcontractorId,
          invoiceNo,
          invoiceDate,
          status: "submitted",
          subtotal,
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          igstRate,
          igstAmount,
          grossTotal,
          retentionPercentage,
          retentionAmount,
          tdsPercentage,
          tdsAmount,
          netPayable,
          notes: notes || "",
        },
        computedItems.map((item) => ({
          itemCode: item.item_code || undefined,
          description: item.description,
          hsnSac: item.hsn_sac,
          uom: item.uom,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        }))
      );
      return NextResponse.json({ success: true, bill: createdBill }, { status: 201 });
    }

    // 3. Insert Line Items atomically
    const itemsToInsert = computedItems.map((item) => ({
      bill_id: billData.id,
      ...item,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("bill_items")
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error("[Supabase Insert Bill Items Error]", itemsError);
      // Clean up orphaned bill header on failure
      await supabase.from("bills").delete().eq("id", billData.id);
      return NextResponse.json(
        { success: false, error: "Failed to store invoice line items" },
        { status: 500 }
      );
    }

    // 4. Record Immutable Audit Trail
    try {
      await supabase.from("audit_logs").insert({
        action: "BILL_SUBMITTED",
        actor_type: "SUBCONTRACTOR",
        actor_identifier: subcontractorId,
        resource_id: billData.id,
        resource_type: "bills",
        metadata: {
          invoiceNo: billData.invoice_no,
          subtotal: billData.subtotal,
          grossTotal: billData.gross_total,
          itemCount: computedItems.length,
        },
      });
    } catch (auditErr) {
      console.warn("[Audit Log Insert Warning]", auditErr);
    }

    const createdBill: Bill = {
      id: billData.id,
      jobId: billData.job_id,
      subcontractorId: billData.subcontractor_id,
      invoiceNo: billData.invoice_no,
      invoiceDate: billData.invoice_date,
      status: billData.status as BillStatus,
      subtotal: Number(billData.subtotal),
      cgstRate: Number(billData.cgst_rate),
      cgstAmount: Number(billData.cgst_amount),
      sgstRate: Number(billData.sgst_rate),
      sgstAmount: Number(billData.sgst_amount),
      igstRate: Number(billData.igst_rate),
      igstAmount: Number(billData.igst_amount),
      grossTotal: Number(billData.gross_total),
      retentionPercentage: Number(billData.retention_percentage),
      retentionAmount: Number(billData.retention_amount),
      tdsPercentage: Number(billData.tds_percentage),
      tdsAmount: Number(billData.tds_amount),
      netPayable: Number(billData.net_payable),
      notes: billData.notes || "",
      createdAt: billData.created_at,
      updatedAt: billData.updated_at,
      items: (insertedItems || []).map((it: any) => ({
        id: it.id,
        billId: it.bill_id,
        itemCode: it.item_code || undefined,
        description: it.description,
        hsnSac: it.hsn_sac,
        uom: it.uom,
        quantity: Number(it.quantity),
        rate: Number(it.rate),
        amount: Number(it.amount),
      })),
    };

    return NextResponse.json({ success: true, bill: createdBill }, { status: 201 });
  } catch (err: unknown) {
    console.error("[Create Bill API Error]", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate running account bill" },
      { status: 500 }
    );
  }
}
