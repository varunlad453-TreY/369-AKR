import { redirect } from "next/navigation";
import Link from "next/link";
import { getSubcontractorSession } from "@/lib/auth/subcontractor-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { Job, Subcontractor } from "@/types";
import BillBuilderForm from "./bill-builder-form";
import { ArrowLeft, Receipt, ShieldAlert } from "lucide-react";

export default async function NewBillPage() {
  const session = await getSubcontractorSession();
  if (!session) {
    redirect("/gateway");
  }

  let subcontractor: Subcontractor | null = null;
  let jobs: Job[] = [];

  try {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch Subcontractor Info
    const { data: subRow } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("id", session.id)
      .maybeSingle();

    if (subRow && subRow.is_active) {
      subcontractor = {
        id: subRow.id,
        authUserId: subRow.auth_user_id,
        companyName: subRow.company_name,
        phoneNumber: subRow.phone_number,
        vendorCode: subRow.vendor_code,
        contactPerson: subRow.contact_person,
        licenseNumber: subRow.license_number,
        stateRegion: subRow.state_region,
        isActive: subRow.is_active,
        rating: Number(subRow.rating) || 5.0,
        gstNumber: subRow.gst_number || "",
        panNumber: subRow.pan_number || "",
        bankName: subRow.bank_name || "",
        bankAccountNumber: subRow.bank_account_number || "",
        bankIfsc: subRow.bank_ifsc || "",
        bankBranch: subRow.bank_branch || "",
        createdAt: subRow.created_at,
      };

      // 2. Fetch Assigned Projects for this subcontractor
      const { data: jobRows } = await supabase
        .from("jobs")
        .select("*")
        .eq("subcontractor_id", session.id)
        .order("created_at", { ascending: false });

      if (jobRows) {
        jobs = jobRows.map((j) => ({
          id: j.id,
          jobCode: j.job_code,
          title: j.title,
          description: j.description,
          siteAddress: j.site_address,
          city: j.city,
          state: j.state,
          pincode: j.pincode,
          capacityKwp: Number(j.capacity_kwp),
          systemType: j.system_type,
          status: j.status,
          subcontractorId: j.subcontractor_id,
          createdBy: j.created_by,
          scheduledStart: j.scheduled_start,
          scheduledEnd: j.scheduled_end,
          workOrderNo: j.work_order_no,
          workOrderDate: j.work_order_date,
          contractAmount: Number(j.contract_amount) || undefined,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }));
      }
    }
  } catch {}

  if (!subcontractor) {
    const mockSub = db.getSubcontractorById(session.id) || (session.vendorCode ? db.getSubcontractorByVendorCode(session.vendorCode) : undefined);
    if (mockSub && mockSub.isActive) {
      subcontractor = mockSub;
      jobs = db.getJobsBySubcontractor(mockSub.id);
    }
  }

  if (!subcontractor) {
    redirect("/gateway");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/portal/bills" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RA Bills</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">New RA Bill &amp; Tax Invoice</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {subcontractor.vendorCode}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header Title */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Generate Running Account (RA) Bill
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemize solar EPC milestones, calculate Indian GST automatically, and submit for central finance audit.
              </p>
            </div>
          </div>
        </div>

        {/* Warning if GST or Bank Account is missing */}
        {(!subcontractor.gstNumber || !subcontractor.bankAccountNumber) && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-xs flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Missing Statutory Tax or Bank Details</p>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                Your GSTIN and Bank details are not yet complete. While you may prepare this invoice,
                settlement and disbursements require statutory details.
              </p>
              <Link
                href="/portal/profile"
                className="inline-block mt-2 font-bold text-amber-950 underline hover:text-black"
              >
                Complete Your Statutory Profile &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Form Component */}
        <BillBuilderForm subcontractor={subcontractor} jobs={jobs} />
      </div>
    </div>
  );
}
