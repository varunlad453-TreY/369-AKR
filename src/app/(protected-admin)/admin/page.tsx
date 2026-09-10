"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  RotateCw,
  Search,
  Users,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  X,
  FileSpreadsheet,
  Download,
  Building2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Job, Subcontractor, JobStatus } from "@/types";
import { formatKwp, formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"jobs" | "subcontractors">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  // Realtime Connection & State
  const [realtimeStatus, setRealtimeStatus] = useState<"CONNECTED" | "RECONNECTING" | "OFFLINE">("CONNECTED");
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [regionFilter, setRegionFilter] = useState<string>("ALL");

  // Modals
  const [showJobModal, setShowJobModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  // Job Form State
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [newJobSite, setNewJobSite] = useState("");
  const [newJobCity, setNewJobCity] = useState("Rohtak");
  const [newJobState, setNewJobState] = useState("Haryana");
  const [newJobPincode, setNewJobPincode] = useState("124001");
  const [newJobKwp, setNewJobKwp] = useState("350");
  const [newJobSystemType, setNewJobSystemType] = useState("Rooftop Commercial Solar");
  const [newJobSubId, setNewJobSubId] = useState("");
  const [submittingJob, setSubmittingJob] = useState(false);

  // Subcontractor Form State
  const [newSubName, setNewSubName] = useState("");
  const [newSubPerson, setNewSubPerson] = useState("");
  const [newSubPhone, setNewSubPhone] = useState("+91");
  const [newSubRegion, setNewSubRegion] = useState("Haryana / NCR");
  const [newSubLicense, setNewSubLicense] = useState("");
  const [submittingSub, setSubmittingSub] = useState(false);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const [jobsRes, { data: subData, error: subError }] = await Promise.all([
        fetch("/api/jobs"),
        supabase.from("subcontractors").select("*").order("created_at", { ascending: false }),
      ]);

      const jobsData = await jobsRes.json();
      if (jobsData.success) setJobs(jobsData.jobs);

      if (!subError && subData) {
        const mappedSubs: Subcontractor[] = subData.map((s) => ({
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
        }));
        setSubcontractors(mappedSubs);
        if (mappedSubs.length > 0 && !newJobSubId) {
          setNewJobSubId(mappedSubs[0].id);
        }
      }
    } catch (err) {
      console.error("[Data Fetch Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-jobs-cdc-feed")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs" },
        (payload) => {
          const updated = payload.new as Job;
          setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
          setSystemAlert(`CDC Event: Job ${updated.jobCode || updated.id} transitioned to ${updated.status.toUpperCase()}`);
          setTimeout(() => setSystemAlert(null), 5000);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jobs" },
        (payload) => {
          const newJob = payload.new as Job;
          setJobs((prev) => [newJob, ...prev]);
          setSystemAlert(`CDC Event: New Job ${newJob.jobCode || newJob.id} registered`);
          setTimeout(() => setSystemAlert(null), 5000);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("CONNECTED");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") setRealtimeStatus("RECONNECTING");
      });

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("akr-air-traffic");
        bc.onmessage = (event) => {
          if (event.data?.type === "JOB_STATUS_UPDATED") {
            const { jobId, newStatus, jobCode } = event.data;
            setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
            setSystemAlert(`Local Dispatch Signal: Job ${jobCode || jobId} status updated to ${newStatus.toUpperCase()}`);
            setTimeout(() => setSystemAlert(null), 5000);
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel error:", e);
      }
    }

    return () => {
      supabase.removeChannel(channel);
      if (bc) bc.close();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJob(true);
    try {
      const payload = {
        title: newJobTitle,
        description: newJobDesc || "High-efficiency commercial solar PV installation.",
        siteAddress: newJobSite,
        city: newJobCity,
        state: newJobState,
        pincode: newJobPincode,
        capacityKwp: parseFloat(newJobKwp),
        systemType: newJobSystemType,
        subcontractorId: newJobSubId,
        scheduledStart: new Date().toISOString(),
        scheduledEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        gpsLat: 28.8955,
        gpsLng: 76.6066,
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowJobModal(false);
        setNewJobTitle("");
        setNewJobSite("");
        setSystemAlert(`Job ${data.job.jobCode} created and allocated.`);
        fetchData();
      } else {
        alert(data.error || "Job creation failed");
      }
    } catch {
      alert("Network failure creating job");
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSub(true);
    try {
      const res = await fetch("/api/subcontractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: newSubName,
          contactPerson: newSubPerson,
          phoneNumber: newSubPhone,
          licenseNumber: newSubLicense || undefined,
          stateRegion: newSubRegion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowSubModal(false);
        setNewSubName("");
        setNewSubPerson("");
        setNewSubPhone("+91");
        setNewSubLicense("");
        setSystemAlert(`Subcontractor ${data.subcontractor.companyName} onboarded.`);
        fetchData();
      } else {
        alert(data.error || "Onboarding failed");
      }
    } catch {
      alert("Network error onboarding subcontractor");
    } finally {
      setSubmittingSub(false);
    }
  };

  const handleRegenerateCode = async (subId: string) => {
    if (!confirm("Revoke active Vendor Code and issue a new cryptographic token for this subcontractor?")) {
      return;
    }
    try {
      const res = await fetch(`/api/subcontractors/${subId}/regenerate-code`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSystemAlert(`New Vendor Code assigned: ${data.vendorCode}`);
        fetchData();
      } else {
        alert("Failed to regenerate code");
      }
    } catch {
      alert("Request error regenerating code");
    }
  };

  // Metrics Calculations
  const totalKwp = jobs.reduce((acc, curr) => acc + curr.capacityKwp, 0);
  const activeJobs = jobs.filter((j) => j.status !== "completed" && j.status !== "draft");
  const onSiteJobs = jobs.filter((j) => j.status === "on_site" || j.status === "in_progress");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  // Filtering
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.subcontractor?.companyName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || j.status === statusFilter;
    const matchesRegion = regionFilter === "ALL" || j.state === regionFilter;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const filteredSubs = subcontractors.filter((s) => {
    return (
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.stateRegion.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case "completed":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case "in_progress":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">In Progress</span>;
      case "on_site":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">On Site</span>;
      case "assigned":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">Assigned</span>;
      case "en_route":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">En Route</span>;
      case "inspection_pending":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">Inspection</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-50 text-slate-600 font-mono text-xs">
        Loading Enterprise Dispatch Console...
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] bg-slate-50 text-slate-900">
      {/* Enterprise Side Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-900">369 AKR UNIVERSE</div>
              <div className="text-[10px] text-slate-500 font-mono">ERP Dispatch Plane v2.4</div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
              activeTab === "jobs"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Dispatch Queue</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
              {jobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("subcontractors")}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
              activeTab === "subcontractors"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Subcontractors</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
              {subcontractors.length}
            </span>
          </button>

          <Link
            href="/admin/audit-logs"
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Audit Ledger</span>
            </div>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </nav>

        {/* System Health / Status Widget */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">CDC Stream:</span>
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  realtimeStatus === "CONNECTED" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {realtimeStatus}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Active User:</span>
            <span className="text-slate-800 truncate max-w-[120px]">dispatcher</span>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Top Control Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
              Control Plane / {activeTab === "jobs" ? "Solar EPC Dispatch Queue" : "Contractor Directory"}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeTab === "jobs" ? "Project Dispatch & Field Queue" : "Registered Subcontractors"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            {activeTab === "jobs" ? (
              <button
                onClick={() => setShowJobModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-300" />
                <span>Dispatch Job</span>
              </button>
            ) : (
              <button
                onClick={() => setShowSubModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-300" />
                <span>Onboard Contractor</span>
              </button>
            )}
          </div>
        </header>

        {/* Realtime Notification Flash */}
        {systemAlert && (
          <div className="bg-slate-900 text-slate-100 text-xs px-6 py-2 flex items-center justify-between border-b border-slate-800 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{systemAlert}</span>
            </div>
            <button onClick={() => setSystemAlert(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Allocated Capacity</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{formatKwp(totalKwp)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{jobs.length} total projects</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Active Dispatches</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{activeJobs.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Assigned or in transit</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="text-[11px] font-mono text-slate-500 uppercase">On-Site Execution</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{onSiteJobs.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Crews currently mobilized</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded">
              <div className="text-[11px] font-mono text-slate-500 uppercase">Commissioned Grid-Tied</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{completedJobs.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">DISCOM reports verified</div>
            </div>
          </div>

          {/* Table Filters Bar */}
          <div className="bg-white border border-slate-200 rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by code, title, city, contractor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {activeTab === "jobs" && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="assigned">Assigned</option>
                      <option value="en_route">En Route</option>
                      <option value="on_site">On Site</option>
                      <option value="in_progress">In Progress</option>
                      <option value="inspection_pending">Inspection Pending</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="ALL">All States</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                  </select>
                </>
              )}
            </div>

            <div className="text-xs font-mono text-slate-500">
              Showing {activeTab === "jobs" ? filteredJobs.length : filteredSubs.length} records
            </div>
          </div>

          {/* High-Density Data Table */}
          <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
            {activeTab === "jobs" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Job Identifier</th>
                      <th className="py-2.5 px-3">Project Title &amp; Location</th>
                      <th className="py-2.5 px-3">Contractor Assigned</th>
                      <th className="py-2.5 px-3">System &amp; Capacity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Schedule</th>
                      <th className="py-2.5 px-3">Docs</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-mono text-xs">
                          No dispatch records matching current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            <Link href={`/portal/job/${job.id}`} className="hover:underline text-slate-900">
                              {job.jobCode}
                            </Link>
                          </td>
                          <td className="py-2 px-3 max-w-xs">
                            <div className="font-medium text-slate-900 truncate" title={job.title}>
                              {job.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {job.city}, {job.state} • {job.pincode}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              {job.subcontractor?.companyName || "Unassigned"}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {job.subcontractor?.phoneNumber || "—"}
                            </div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{formatKwp(job.capacityKwp)}</div>
                            <div className="text-[11px] text-slate-500">{job.systemType}</div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {getStatusBadge(job.status)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            <div>{formatDateTime(job.scheduledStart).split(",")[0]}</div>
                            <div className="text-slate-400">to {formatDateTime(job.scheduledEnd).split(",")[0]}</div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                              {job.documents?.length || 0}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {job.status === "completed" && (
                                <Link
                                  href={`/api/jobs/${job.id}/commissioning-report`}
                                  target="_blank"
                                  className="p-1 text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded bg-white transition-colors"
                                  title="View DISCOM Report"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                </Link>
                              )}
                              <Link
                                href={`/portal/job/${job.id}`}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                              >
                                View Job
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Vendor Code</th>
                      <th className="py-2.5 px-3">Contractor / Company Name</th>
                      <th className="py-2.5 px-3">Contact Person &amp; Phone</th>
                      <th className="py-2.5 px-3">Territory</th>
                      <th className="py-2.5 px-3">License Number</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-mono text-xs">
                          No subcontractor records found.
                        </td>
                      </tr>
                    ) : (
                      filteredSubs.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {sub.vendorCode}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {sub.companyName}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{sub.contactPerson}</div>
                            <div className="text-[11px] font-mono text-slate-500">{sub.phoneNumber}</div>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                            {sub.stateRegion}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {sub.licenseNumber || "—"}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-800 font-medium">
                            {sub.rating.toFixed(2)} / 5.0
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {sub.isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleRegenerateCode(sub.id)}
                              className="px-2 py-1 text-[11px] font-mono text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Rotate Vendor Security Code"
                            >
                              Rotate Token
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Dispatch Job */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-300 rounded shadow-xl p-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Dispatch Solar EPC Project</h2>
              <button onClick={() => setShowJobModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 450 kWp Industrial Rooftop Solar"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Site Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Plot 42, HSIIDC Industrial Complex"
                  value={newJobSite}
                  onChange={(e) => setNewJobSite(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newJobCity}
                    onChange={(e) => setNewJobCity(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newJobState}
                    onChange={(e) => setNewJobState(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={newJobPincode}
                    onChange={(e) => setNewJobPincode(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Capacity (kWp)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newJobKwp}
                    onChange={(e) => setNewJobKwp(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">System Type</label>
                  <select
                    value={newJobSystemType}
                    onChange={(e) => setNewJobSystemType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="Rooftop Commercial Solar">Rooftop Commercial Solar</option>
                    <option value="Ground Mount Utility Array">Ground Mount Utility Array</option>
                    <option value="Solar Carport / EV Hybrid">Solar Carport / EV Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Assign Subcontractor</label>
                <select
                  value={newJobSubId}
                  onChange={(e) => setNewJobSubId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500 bg-white"
                  required
                >
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} ({s.vendorCode} • {s.stateRegion})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium transition-colors disabled:opacity-50"
                >
                  {submittingJob ? "Dispatching..." : "Submit Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Onboard Subcontractor */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded shadow-xl p-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Onboard Subcontractor</h2>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company Registered Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SuryaShakti EPC Infrastructure Ltd."
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Lead</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Rajesh Verma"
                    value={newSubPerson}
                    onChange={(e) => setNewSubPerson(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Phone (E.164)</label>
                  <input
                    type="text"
                    required
                    placeholder="+919812037550"
                    value={newSubPhone}
                    onChange={(e) => setNewSubPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Operating Region</label>
                  <input
                    type="text"
                    required
                    value={newSubRegion}
                    onChange={(e) => setNewSubRegion(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Electrical License</label>
                  <input
                    type="text"
                    placeholder="e.g., DL-ELECT-2024-8842"
                    value={newSubLicense}
                    onChange={(e) => setNewSubLicense(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSub}
                  className="px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium transition-colors disabled:opacity-50"
                >
                  {submittingSub ? "Registering..." : "Onboard Subcontractor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
