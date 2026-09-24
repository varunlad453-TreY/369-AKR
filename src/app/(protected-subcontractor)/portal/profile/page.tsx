import { redirect } from "next/navigation";
import Link from "next/link";
import { getSubcontractorSession } from "@/lib/auth/subcontractor-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/state/mock-db";
import { Subcontractor } from "@/types";
import ProfileForm from "./profile-form";
import { Building2, ArrowLeft, ShieldCheck, AlertCircle, FileText, Receipt } from "lucide-react";

export default async function SubcontractorProfilePage() {
  const session = await getSubcontractorSession();
  if (!session) {
    redirect("/gateway");
  }

  let subcontractor: Subcontractor | null = null;

  try {
    const supabase = await createServerSupabaseClient();
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
        assignedJobsCount: subRow.assigned_jobs_count || 0,
        completedJobsCount: subRow.completed_jobs_count || 0,
        gstNumber: subRow.gst_number || "",
        panNumber: subRow.pan_number || "",
        bankName: subRow.bank_name || "",
        bankAccountNumber: subRow.bank_account_number || "",
        bankIfsc: subRow.bank_ifsc || "",
        bankBranch: subRow.bank_branch || "",
        createdAt: subRow.created_at,
        updatedAt: subRow.updated_at,
      };
    }
  } catch {}

  if (!subcontractor) {
    const mockSub = db.getSubcontractorById(session.id) || (session.vendorCode ? db.getSubcontractorByVendorCode(session.vendorCode) : undefined);
    if (mockSub && mockSub.isActive) {
      subcontractor = mockSub;
    }
  }

  if (!subcontractor) {
    redirect("/gateway");
  }

  const isProfileComplete = Boolean(
    subcontractor.gstNumber &&
    subcontractor.panNumber &&
    subcontractor.bankName &&
    subcontractor.bankAccountNumber &&
    subcontractor.bankIfsc
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/portal" className="hover:text-slate-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portal Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Statutory GST &amp; Bank Profile</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portal/bills"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-600" />
              <span>RA Invoices</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Banner Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {subcontractor.companyName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                  <span>
                    Vendor Code:{" "}
                    <strong className="font-mono text-slate-900">{subcontractor.vendorCode}</strong>
                  </span>
                  <span>
                    Supervisor: <strong className="text-slate-800">{subcontractor.contactPerson}</strong>
                  </span>
                  <span>
                    Mobile: <strong className="text-slate-800">{subcontractor.phoneNumber}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isProfileComplete ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>GST &amp; Bank Profile Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Statutory Info Pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informative Alert */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-xs text-sky-900 flex items-start gap-3">
          <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sky-950">Statutory Compliance Mandate (EPC Billing)</p>
            <p className="mt-0.5 text-sky-800 leading-relaxed">
              Under GST Law and Section 194C of the Income Tax Act, 1961, all Running Account (RA) bills
              require a valid 15-character GSTIN, 10-character PAN, and verified RTGS/NEFT bank coordinates.
              These credentials are automatically rendered onto your official Tax Invoices.
            </p>
          </div>
        </div>

        {/* Profile Update Client Form */}
        <ProfileForm subcontractor={subcontractor} />
      </div>
    </div>
  );
}
