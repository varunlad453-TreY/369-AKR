"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  FileText,
  Building2,
  MapPin,
  Calendar,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Job, Subcontractor, JobStatus } from "@/types";
import { formatKwp } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function StatusBadge({ status }: { status: Job["status"] }) {
  switch (status) {
    case "assigned":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300">
          Assigned
        </span>
      );
    case "en_route":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-300">
          En Route
        </span>
      );
    case "on_site":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-300">
          On Site
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-300">
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Completed
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

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [jobsRes, { data: subData }] = await Promise.all([
        fetch("/api/jobs"),
        supabase.from("subcontractors").select("*"),
      ]);

      const jobsData = await jobsRes.json();
      if (jobsData.success) setJobs(jobsData.jobs);

      if (subData) {
        setSubcontractors(
          subData.map((s) => ({
            id: s.id,
            companyName: s.company_name,
            phoneNumber: s.phone_number,
            vendorCode: s.vendor_code,
            contactPerson: s.contact_person,
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
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSubcontractorName = (subId?: string) => {
    if (!subId) return "Unassigned";
    const sub = subcontractors.find((s) => s.id === subId);
    return sub ? sub.companyName : subId;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.state.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Solar Project Dispatches
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage work order assignments, installation milestones, and DISCOM commissioning reports.
          </p>
        </div>

        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Dispatch New Solar Job</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name, code (e.g. AKR-2026), or city..."
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 pl-9 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
            >
              <option value="ALL">All Statuses ({jobs.length})</option>
              <option value="assigned">Assigned</option>
              <option value="en_route">En Route</option>
              <option value="on_site">On Site</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh projects list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400 mb-2" />
            <span>Loading projects list...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No project dispatches found matching your search.</p>
            <p>Try changing your search keywords or clearing filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="px-5 py-3">Job Code</th>
                  <th className="px-5 py-3">Project Title &amp; Scope</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Site Location</th>
                  <th className="px-5 py-3">Assigned Contractor</th>
                  <th className="px-5 py-3">Schedule Window</th>
                  <th className="px-5 py-3">Current Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {job.jobCode}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {job.systemType}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {formatKwp(job.capacityKwp)}
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {job.city}, {job.state}
                    </td>
                    <td className="px-5 py-4 text-slate-800 whitespace-nowrap font-medium">
                      {getSubcontractorName(job.subcontractorId)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(job.scheduledStart).toLocaleDateString()} -{" "}
                      {new Date(job.scheduledEnd).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                      {job.status === "completed" && (
                        <a
                          href={`/api/jobs/${job.id}/commissioning-report`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-medium"
                          title="View DISCOM Report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </a>
                      )}
                      <Link
                        href={`/portal/job/${job.id}?subId=${job.subcontractorId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded font-medium"
                        title="Open Subcontractor View"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Portal View</span>
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
  );
}
