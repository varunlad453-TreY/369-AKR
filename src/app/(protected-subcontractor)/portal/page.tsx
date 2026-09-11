import { redirect } from "next/navigation";
import Link from "next/link";
import {
  HardHat,
  Zap,
  Clock,
  CheckCircle2,
  PhoneCall,
  ChevronRight,
  Building2,
  FileText,
} from "lucide-react";
import { Job, Subcontractor } from "@/types";
import { formatKwp } from "@/lib/utils";
import { getSubcontractorSession } from "@/lib/auth/subcontractor-session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function StatusBadge({ status }: { status: Job["status"] }) {
  switch (status) {
    case "assigned":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300">
          New Assignment
        </span>
      );
    case "en_route":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-300">
          Team Traveling
        </span>
      );
    case "on_site":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-300">
          At Work Site
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300">
          Installation In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Completed &amp; Approved
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

export default async function SubcontractorPortalPage() {
  // Identity comes exclusively from the server-verified session cookie — never from the URL.
  const session = await getSubcontractorSession();
  if (!session) {
    redirect("/gateway");
  }

  const supabase = await createServerSupabaseClient();

  const { data: subRow } = await supabase
    .from("subcontractors")
    .select("*")
    .eq("id", session.id)
    .maybeSingle();

  if (!subRow || !subRow.is_active) {
    redirect("/gateway");
  }

  const subcontractor: Subcontractor = {
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
    createdAt: subRow.created_at,
    updatedAt: subRow.updated_at,
  };

  const { data: jobRows } = await supabase
    .from("jobs")
    .select("*")
    .eq("subcontractor_id", session.id)
    .order("created_at", { ascending: false });

  const jobs: Job[] = (jobRows || []).map((j) => ({
    id: j.id,
    jobCode: j.job_code,
    title: j.title,
    description: j.description,
    siteAddress: j.site_address,
    city: j.city,
    state: j.state,
    pincode: j.pincode,
    gpsCoordinates: { lat: j.gps_lat, lng: j.gps_lng },
    capacityKwp: Number(j.capacity_kwp),
    systemType: j.system_type,
    status: j.status,
    subcontractorId: j.subcontractor_id,
    createdBy: j.created_by,
    scheduledStart: j.scheduled_start,
    scheduledEnd: j.scheduled_end,
    completedAt: j.completed_at,
    notes: j.notes,
    createdAt: j.created_at,
    updatedAt: j.updated_at,
  }));

  const activeJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const totalKwp = jobs.reduce((acc, curr) => acc + curr.capacityKwp, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Subcontractor Portal</span>
            <span>/</span>
            <span className="font-mono text-slate-700">{subcontractor?.companyName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              Verified Partner
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Contractor Profile Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-slate-700" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {subcontractor?.companyName || "Field Partner Operations"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-600">
              <div>
                <span className="text-slate-500">Supervisor:</span>{" "}
                <strong className="text-slate-800">{subcontractor?.contactPerson}</strong>
              </div>
              <div>
                <span className="text-slate-500">Registered Phone:</span>{" "}
                <span className="text-slate-800">{subcontractor?.phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-500">Your Vendor Code:</span>{" "}
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {subcontractor?.vendorCode}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Region:</span>{" "}
                <span className="text-slate-800">{subcontractor?.stateRegion}</span>
              </div>
            </div>
          </div>

          {/* Direct Support Hotline */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-md shrink-0">
            <PhoneCall className="w-4 h-4 text-slate-600" />
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">
                AKR Dispatch Desk
              </div>
              <a
                href="tel:+919812037550"
                className="text-xs font-bold text-slate-900 hover:underline"
              >
                +91 98120 37550
              </a>
            </div>
          </div>
        </div>

        {/* 3 Clear Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Total Solar Capacity Assigned</span>
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">
              {formatKwp(totalKwp)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Across {jobs.length} project sites</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Active Projects In Progress</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">
              {activeJobs.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Currently being installed on site</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Completed Solar Projects</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1.5">
              {completedJobs.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Approved &amp; Commissioned</div>
          </div>
        </div>

        {/* Work Orders List / Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Your Assigned Solar Projects ({jobs.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any project to download blueprints, check site address, update status, and submit rooftop photos.
              </p>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <HardHat className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-semibold text-slate-700">No active projects assigned to your Vendor Code.</p>
              <p>Please contact AKR Central Dispatch at +91 98120 37550 to receive your project assignment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                    <th className="px-5 py-3">Project Code</th>
                    <th className="px-5 py-3">Project Name &amp; Description</th>
                    <th className="px-5 py-3">System Size</th>
                    <th className="px-5 py-3">Site Location</th>
                    <th className="px-5 py-3">Installation Window</th>
                    <th className="px-5 py-3">Current Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {job.jobCode}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-900">{job.title}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {job.description}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {formatKwp(job.capacityKwp)}
                      </td>
                      <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                        {job.city}, {job.state}
                      </td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(job.scheduledStart).toLocaleDateString()} -{" "}
                        {new Date(job.scheduledEnd).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/portal/job/${job.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded transition-colors"
                        >
                          <span>Open Project</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
