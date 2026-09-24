import { redirect } from "next/navigation";
import Link from "next/link";
import { getSubcontractorSession } from "@/lib/auth/subcontractor-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { Bill, BillItem, BillStatus } from "@/types";
import BillsClient from "./bills-client";
import { Receipt, Plus, ArrowLeft, Building2 } from "lucide-react";

export default async function SubcontractorBillsPage() {
  const session = await getSubcontractorSession();
  if (!session) {
    redirect("/gateway");
  }

  let subRow: any = null;
  let billRows: any[] | null = null;

  try {
    const supabase = await createServerSupabaseClient();

    // Fetch Subcontractor info
    const { data: s } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("id", session.id)
      .maybeSingle();

    subRow = s;

    // Fetch Bills for this subcontractor
    const { data: b, error } = await supabase
      .from("bills")
      .select(`
        *,
        jobs (
          id,
          job_code,
          title,
          site_address,
          city,
          state,
          capacity_kwp,
          work_order_no,
          work_order_date
        ),
        subcontractors (
          id,
          company_name,
          phone_number,
          vendor_code,
          contact_person,
          gst_number,
          pan_number,
          bank_name,
          bank_account_number,
          bank_ifsc,
          bank_branch
        ),
        bill_items (*)
      `)
      .eq("subcontractor_id", session.id)
      .order("created_at", { ascending: false });

    if (!error && b) {
      billRows = b;
    }
  } catch {}

  const mockSub = db.getSubcontractorById(session.id) || (session.vendorCode ? db.getSubcontractorByVendorCode(session.vendorCode) : undefined);

  if (!subRow && mockSub && mockSub.isActive) {
    subRow = {
      id: mockSub.id,
      company_name: mockSub.companyName,
      phone_number: mockSub.phoneNumber,
      vendor_code: mockSub.vendorCode,
      contact_person: mockSub.contactPerson,
      is_active: mockSub.isActive,
    };
  }

  if (!subRow || !subRow.is_active) {
    redirect("/gateway");
  }

  if (!billRows) {
    const mockBills = db.getBills(session.id);
    const bills = mockBills;
    const isProfileComplete = Boolean(
      subRow.gst_number &&
      subRow.pan_number &&
      subRow.bank_name &&
      subRow.bank_account_number &&
      subRow.bank_ifsc
    ) || Boolean(mockSub?.gstNumber && mockSub?.panNumber && mockSub?.bankAccountNumber);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
        <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/portal" className="hover:text-slate-900 transition-colors">Subcontractor Portal</Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Running Account Invoices</span>
            </div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Projects</span>
            </Link>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-amber-600" />
                <span>Running Account (RA) Billing</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Generate and submit GST tax invoices, track line-item quantities, and monitor payment certifications.
              </p>
            </div>
            <Link
              href="/portal/bills/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New RA Bill</span>
            </Link>
          </div>
          <BillsClient
            initialBills={bills}
            subcontractorName={subRow.company_name}
          />
        </main>
      </div>
    );
  }

  const bills: Bill[] = (billRows || []).map((b) => {
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
            stateRegion: "",
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/portal" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Running Account (RA) Bills &amp; Tax Invoices</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/portal/profile"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Tax &amp; Bank Profile
            </Link>
            <Link
              href="/portal/bills/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New RA Bill</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Running Account (RA) Billing &amp; Tax Invoices
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submit line-item milestone bills, track Indian GST computations, statutory TDS &amp; retention deductions,
              and download audit-ready Tax Invoices.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/portal/bills/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>New RA Bill</span>
            </Link>
          </div>
        </div>

        {/* Interactive Bills Client Component */}
        <BillsClient initialBills={bills} subcontractorName={subRow.company_name} />
      </div>
    </div>
  );
}
