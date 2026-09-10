"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HardHat,
  MapPin,
  Calendar,
  Zap,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  PhoneCall,
  Shield,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Job, Subcontractor } from "@/types";
import { formatKwp, formatDateTime } from "@/lib/utils";

function PortalContent() {
  const searchParams = useSearchParams();
  const subId = searchParams.get("subId") || "sub-001-delhi-ncr";

  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortalData() {
      try {
        // Fetch Subcontractor Info
        const subRes = await fetch("/api/subcontractors");
        const subData = await subRes.json();
        if (subData.success) {
          const matched = subData.subcontractors.find((s: Subcontractor) => s.id === subId) || subData.subcontractors[0];
          setSubcontractor(matched);
        }

        // Fetch Assigned Jobs
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
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-amber-400 font-mono">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Field Operations Gateway...</span>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const totalKwp = jobs.reduce((acc, curr) => acc + curr.capacityKwp, 0);

  const getStatusBadge = (status: Job["status"]) => {
    switch (status) {
      case "assigned":
        return <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-950/60 text-blue-400 border border-blue-500/30">Assigned</span>;
      case "en_route":
        return <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/60 text-purple-400 border border-purple-500/30">En Route</span>;
      case "on_site":
        return <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">On Site</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/60 text-amber-400 border border-amber-500/30 animate-pulse">In Progress</span>;
      case "completed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">Completed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Subcontractor Header Profile Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#FFD23F] flex items-center justify-center shrink-0">
              <HardHat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {subcontractor?.companyName || "Field Partner Operations"}
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  Verified Contractor
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Field Supervisor: <span className="text-white font-medium">{subcontractor?.contactPerson}</span> • Registered Mobile:{" "}
                <span className="text-[#FFD23F] font-mono">{subcontractor?.phoneNumber}</span>
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs font-mono">
                <span className="text-slate-400">
                  Active Vendor Code:{" "}
                  <code className="bg-black/60 px-2 py-0.5 rounded text-[#FFD23F] border border-amber-500/30">
                    {subcontractor?.vendorCode}
                  </code>
                </span>
                <span className="text-slate-400">
                  State / Hub: <span className="text-slate-200">{subcontractor?.stateRegion}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Direct Dispatch Support Hotline */}
          <div className="flex items-center gap-4 bg-[#080C14] border border-slate-800 rounded-xl p-4 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#FFD23F]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">AKR Dispatch Desk</div>
              <a
                href="tel:+919812037550"
                className="text-sm font-bold text-white hover:text-[#FFD23F] transition-colors"
              >
                +91 98120 37550
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="glass-card rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>Assigned Solar Capacity</span>
            <Zap className="w-4 h-4 text-[#FFD23F]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FFD23F] font-mono">
            {formatKwp(totalKwp)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across {jobs.length} dispatched project sites</p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>Active Field Dispatches</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {activeJobs.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pending or in progress on-site</p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-2">
            <span>Completed &amp; Commissioned</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {completedJobs.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Geotagged proof approved</p>
        </div>
      </div>

      {/* Dispatched Projects List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Assigned Installation Dispatches</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a project to review CAD schematics, single-line diagrams, and submit geotagged proof-of-work.
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border border-slate-800">
            <HardHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">No installation jobs assigned to this Vendor Code.</p>
            <p className="text-xs text-slate-500 mt-1">Contact 369 AKR Central Dispatch to receive new dispatches.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="glass-card rounded-xl p-6 border border-slate-800 hover:border-amber-500/40 transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Job Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-black text-[#FFD23F] font-mono text-xs font-bold border border-amber-500/30">
                        {job.jobCode}
                      </span>
                      {getStatusBadge(job.status)}
                      <span className="text-xs font-mono text-slate-400">
                        {job.systemType}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#FFD23F] transition-colors">
                      {job.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-[#FFD23F]" />
                        <span>{job.siteAddress}, {job.city}, {job.state}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-[#FFD23F]" />
                        <span className="font-bold text-[#FFD23F]">{formatKwp(job.capacityKwp)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Window: {new Date(job.scheduledStart).toLocaleDateString()} - {new Date(job.scheduledEnd).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 lg:border-l lg:border-slate-800 lg:pl-6 shrink-0">
                    <Link
                      href={`/portal/job/${job.id}?subId=${subcontractor?.id}`}
                      className="flex items-center gap-2 bg-[#FFD23F] hover:bg-[#ffe17d] text-black font-bold text-xs py-2.5 px-4 rounded-lg transition-colors shadow-md shadow-amber-500/10"
                    >
                      <span>Open Work Order</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubcontractorPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-amber-400 font-mono text-sm">
          Loading Subcontractor Dashboard...
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
