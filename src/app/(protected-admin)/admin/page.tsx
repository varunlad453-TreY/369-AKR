"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  ShieldCheck,
  Plus,
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Job, Subcontractor } from "@/types";
import { formatKwp } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function StatusBadge({ status }: { status: Job["status"] }) {
  switch (status) {
    case "assigned":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-300">
          Assigned
        </span>
      );
    case "en_route":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-300">
          En Route
        </span>
      );
    case "on_site":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-300">
          On Site
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-300">
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

export default function AdminOverviewPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const [jobsRes, { data: subData }] = await Promise.all([
          fetch("/api/jobs"),
          supabase.from("subcontractors").select("*").order("created_at", { ascending: false }),
        ]);

        const jobsData = await jobsRes.json();
        if (jobsData.success) setJobs(jobsData.jobs);

        if (subData) {
          setSubcontractors(
            subData.map((s) => ({
              id: s.id,
              authUserId: s.auth_user_id,
              companyName: s.company_name,
              phoneNumber: s.phone_number,
              vendorCode: s.vendor_code,
              contactPerson: s.contact_person,
              licenseNumber: s.license_number,
              stateRegion: s.state_region,
              isActive: s.is_active,
              rating: Number(s.rating) || 5.0,
              assignedJobsCount: s.assigned_jobs_count || 0,
              completedJobsCount: s.completed_jobs_count || 0,
              createdAt: s.created_at,
              updatedAt: s.updated_at,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load overview data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-600 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mr-2" />
        <span>Loading management dashboard...</span>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const totalKwp = jobs.reduce((acc, curr) => acc + curr.capacityKwp, 0);

  return (
    <div className="space-y-6">
      {/* Overview Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Operations Command Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of statewide solar dispatches, subcontractor allocations, and completion rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Dispatch New Solar Job</span>
          </Link>
          <Link
            href="/admin/subcontractors/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Enroll Partner</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Total Solar Capacity</span>
            <Zap className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">
            {formatKwp(totalKwp)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Dispatched across {jobs.length} projects</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Active Installations</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">
            {activeJobs.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Currently in progress on site</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Completed Solar Plants</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1.5">
            {completedJobs.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Commissioned &amp; Verified</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Active Contractors</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">
            {subcontractors.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Enrolled EPC partner firms</div>
        </div>
      </div>

      {/* Two Column Layout: Recent Dispatches & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Dispatches */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Recent Solar Project Dispatches
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest project assignments across all regions</p>
            </div>

            <Link
              href="/admin/jobs"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All Projects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="px-5 py-2.5">Project Code</th>
                  <th className="px-5 py-2.5">Project Name</th>
                  <th className="px-5 py-2.5">Capacity</th>
                  <th className="px-5 py-2.5">Location</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {job.jobCode}
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{job.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{job.systemType}</div>
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {formatKwp(job.capacityKwp)}
                    </td>
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {job.city}, {job.state}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Navigation & Partner Directory Snapshot */}
        <div className="space-y-6">
          {/* Quick Management Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Management Shortcuts</h2>
            <div className="space-y-2">
              <Link
                href="/admin/jobs"
                className="p-3 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="font-bold text-slate-900">Manage All Projects</div>
                    <div className="text-[11px] text-slate-500">Filter and track all {jobs.length} dispatches</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/subcontractors"
                className="p-3 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="font-bold text-slate-900">Contractor Directory</div>
                    <div className="text-[11px] text-slate-500">Manage codes &amp; partner ratings</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/audit-logs"
                className="p-3 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="font-bold text-slate-900">Security Audit Trail</div>
                    <div className="text-[11px] text-slate-500">Review log history &amp; uploads</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Subcontractor Directory Snapshot */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Partner Contractors</h2>
              <Link
                href="/admin/subcontractors"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {subcontractors.slice(0, 3).map((sub) => (
                <div
                  key={sub.id}
                  className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">{sub.companyName}</div>
                    <div className="text-[11px] text-slate-500">
                      Code: <span className="font-mono font-semibold">{sub.vendorCode}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {sub.stateRegion}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
