"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HardHat,
  MapPin,
  Calendar,
  Zap,
  Clock,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Job, Subcontractor } from "@/types";
import { formatKwp } from "@/lib/utils";

function StatusBadge({ status }: { status: Job["status"] }) {
  switch (status) {
    case "assigned":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-300">
          Assigned
        </span>
      );
    case "en_route":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-sky-50 text-sky-700 border border-sky-300">
          En Route
        </span>
      );
    case "on_site":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-300">
          On Site
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-300">
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
}

function PortalContent() {
  const searchParams = useSearchParams();
  const subId = searchParams.get("subId") || "sub-001-delhi-ncr";

  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const subRes = await fetch("/api/subcontractors");
        const subData = await subRes.json();
        if (subData.success) {
          const matched =
            subData.subcontractors.find((s: Subcontractor) => s.id === subId) ||
            subData.subcontractors[0];
          setSubcontractor(matched);
        }

        const jobsRes = await fetch(`/api/jobs?subcontractorId=${subId}`);
        const jobsData = await jobsRes.json();
        if (jobsData.success) {
          setJobs(jobsData.jobs);
        }
      } catch (err) {
        console.error("Failed to load portal data", err);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [subId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-600 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
          <span>Synchronizing Field Gateway...</span>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const totalKwp = jobs.reduce((acc, curr) => acc + curr.capacityKwp, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <span>OPERATIONS</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">SUBCONTRACTOR PORTAL</span>
            <span>/</span>
            <span className="text-slate-600">{subcontractor?.vendorCode || subId}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              Field Secure Channel Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Contractor Profile Bar */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {subcontractor?.companyName || "Field Partner Operations"}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Vendor
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600 font-mono">
              <div>
                <span className="text-slate-400">Supervisor:</span>{" "}
                <span className="font-semibold text-slate-800">{subcontractor?.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>{" "}
                <span className="text-slate-800">{subcontractor?.phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-400">Vendor Code:</span>{" "}
                <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {subcontractor?.vendorCode}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Hub:</span>{" "}
                <span className="text-slate-800">{subcontractor?.stateRegion}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded shrink-0">
            <PhoneCall className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">AKR Dispatch Desk</div>
              <a
                href="tel:+919812037550"
                className="text-xs font-mono font-bold text-slate-800 hover:text-blue-600 transition-colors"
              >
                +91 98120 37550
              </a>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Assigned Solar Capacity</span>
              <Zap className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {formatKwp(totalKwp)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across {jobs.length} project sites</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Active Field Dispatches</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {activeJobs.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pending installation or sign-off</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Commissioned Projects</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {completedJobs.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Geotagged proof submitted</div>
          </div>
        </div>

        {/* High-Density Work Orders Data Table */}
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase text-slate-700">
                Assigned Work Orders ({jobs.length})
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Execute field milestones, download CAD schematics, and submit GPS-verified proof of work.
              </p>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No active work orders assigned to this vendor code.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Job Code</th>
                    <th className="px-4 py-2.5 font-semibold">Project Title & Description</th>
                    <th className="px-4 py-2.5 font-semibold">Capacity</th>
                    <th className="px-4 py-2.5 font-semibold">Location</th>
                    <th className="px-4 py-2.5 font-semibold">Execution Window</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {job.jobCode}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate font-sans">{job.title}</div>
                        <div className="text-[11px] text-slate-500 truncate font-sans">{job.description}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {formatKwp(job.capacityKwp)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-sans text-[11px]">
                        {job.city}, {job.state}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(job.scheduledStart).toLocaleDateString()} - {new Date(job.scheduledEnd).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/portal/job/${job.id}?subId=${subcontractor?.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-medium rounded transition-colors"
                        >
                          <span>Open Order</span>
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

export default function SubcontractorPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 text-slate-600 font-mono text-xs">
          Loading Subcontractor Dashboard...
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
