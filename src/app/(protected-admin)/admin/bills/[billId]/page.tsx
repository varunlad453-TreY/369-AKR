import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { Bill, BillItem, BillStatus } from "@/types";
import BillReviewClient from "./bill-review-client";

interface PageProps {
  params: Promise<{ billId: string }>;
}

export default async function AdminBillDetailPage({ params }: PageProps) {
  const { billId } = await params;
  let b: any = null;

  try {
    const supabase = await createServerSupabaseClient();
    const res = await supabase
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
    b = res.data;
  } catch {}

  if (!b) {
    const mockBill = db.getBillById(billId);
    if (mockBill) {
      return <BillReviewClient initialBill={mockBill} />;
    }
    notFound();
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

  return <BillReviewClient initialBill={bill} />;
}
