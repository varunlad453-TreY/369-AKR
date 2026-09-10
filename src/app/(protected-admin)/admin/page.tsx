"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Plus,
  KeyRound,
  HardHat,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCw,
  Search,
  Building,
  FileCheck2,
  ExternalLink,
  History,
  Phone,
  MapPin,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Job, Subcontractor, AuditLog } from "@/types";
import { formatKwp, formatDateTime } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "subcontractors">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
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

  // New Subcontractor Modal State
  const [showSubModal, setShowSubModal] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubPerson, setNewSubPerson] = useState("");
  const [newSubPhone, setNewSubPhone] = useState("+91");
  const [newSubRegion, setNewSubRegion] = useState("Haryana / NCR");
  const [submittingSub, setSubmittingSub] = useState(false);

  // Status message
  const [notification, setNotification] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [jobsRes, subRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/subcontractors"),
      ]);

      const [jobsData, subData] = await Promise.all([
        jobsRes.json(),
        subRes.json(),
      ]);

      if (jobsData.success) setJobs(jobsData.jobs);
      if (subData.success) {
        setSubcontractors(subData.subcontractors);
        if (subData.subcontractors.length > 0 && !newJobSubId) {
          setNewJobSubId(subData.subcontractors[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Create Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJob(true);

    try {
      const payload = {
        title: newJobTitle,
        description: newJobDesc || "High-efficiency solar array installation with mandatory Discom net-metering synchronization.",
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
        showToast(`Job ${data.job.jobCode} created and assigned successfully!`);
        fetchData();
      } else {
        alert(data.error || "Failed to create job");
      }
    } catch {
      alert("Job dispatch failed");
    } finally {
      setSubmittingJob(false);
    }
  };

  // Handle Onboard Subcontractor
  const handleOnboardSub = async (e: React.FormEvent) => {
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
          stateRegion: newSubRegion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowSubModal(false);
        setNewSubName("");
        setNewSubPerson("");
        setNewSubPhone("+91");
        showToast(`Subcontractor onboarded! Vendor Code: ${data.subcontractor.vendorCode}`);
        fetchData();
      } else {
        alert(data.error || "Failed to onboard subcontractor");
      }
    } catch {
      alert("Subcontractor registration failed");
    } finally {
      setSubmittingSub(false);
    }
  };

  // Handle Regenerate Vendor Code
  const handleRegenerateCode = async (subId: string) => {
    if (!confirm("Are you sure you want to revoke the current Vendor Code and generate a new cryptographic token?")) {
      return;
    }

    try {
      const res = await fetch(`/api/subcontractors/${subId}/regenerate-code`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`New Vendor Code issued: ${data.vendorCode}`);
        fetchData();
      } else {
        alert("Failed to regenerate code");
      }
    } catch {
      alert("Error regenerating code");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-amber-400 font-mono text-sm">
        Initializing Central Admin Plane...
      </div>
    );
  }

  const totalKwp = jobs.reduce((acc, curr) => acc + curr.capacityKwp, 0);
  const activeJobs = jobs.filter((j) => j.status !== "completed");
  const completedJobs = jobs.filter((j) => j.status === "completed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-mono shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#FFD23F] uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>369 AKR UNIVERSE • Operations Dispatch Plane</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Central Dispatch &amp; Subcontractor Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit Ledger</span>
          </Link>

          <button
            onClick={() => setShowJobModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#FFD23F] hover:bg-[#ffe17d] text-black transition-colors shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Job</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-slate-400 text-xs font-mono uppercase">Total Capacity Under Dispatch</div>
          <div className="text-2xl font-extrabold text-[#FFD23F] font-mono mt-1">
            {formatKwp(totalKwp)}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-slate-400 text-xs font-mono uppercase">Active Field Jobs</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {activeJobs.length}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-slate-400 text-xs font-mono uppercase">Partner Contractors</div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            {subcontractors.length}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 border border-slate-800">
          <div className="text-slate-400 text-xs font-mono uppercase">Commissioned Sites</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {completedJobs.length}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === "jobs"
              ? "text-[#FFD23F]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>All Dispatched Jobs ({jobs.length})</span>
          {activeTab === "jobs" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD23F]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("subcontractors")}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === "subcontractors"
              ? "text-[#FFD23F]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Registered Subcontractors ({subcontractors.length})</span>
          {activeTab === "subcontractors" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD23F]" />
          )}
        </button>
      </div>

      {/* Tab 1: Jobs List */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="glass-panel rounded-xl p-5 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-black text-[#FFD23F] font-mono text-xs font-bold border border-amber-500/30">
                    {job.jobCode}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-800 text-slate-300">
                    {job.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {job.systemType}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {job.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-[#FFD23F]" />
                    <span>{job.siteAddress}, {job.city}, {job.state}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#FFD23F] font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{formatKwp(job.capacityKwp)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Building className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Assigned: {job.subcontractor?.companyName || "Subcontractor"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/portal/job/${job.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 border border-slate-700 flex items-center gap-1"
                >
                  <span>Inspect Portal View</span>
                  <ExternalLink className="w-3 h-3 text-[#FFD23F]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Subcontractors List */}
      {activeTab === "subcontractors" && (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowSubModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-[#FFD23F] border border-amber-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Subcontractor Firm</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcontractors.map((sub) => (
              <div
                key={sub.id}
                className="glass-panel rounded-xl p-6 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-white">
                      {sub.companyName}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-mono text-[10px] border border-emerald-500/30 shrink-0">
                      Active Partner
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">Supervisor:</span>{" "}
                      <span className="text-slate-200">{sub.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone (OTP):</span>{" "}
                      <span className="text-slate-200">{sub.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Region:</span>{" "}
                      <span className="text-slate-200">{sub.stateRegion}</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-slate-500 block mb-1">Cryptographic Vendor Code:</span>
                      <div className="flex items-center justify-between bg-black/60 p-2 rounded border border-amber-500/30 text-[#FFD23F] font-bold">
                        <span>{sub.vendorCode}</span>
                        <button
                          onClick={() => handleRegenerateCode(sub.id)}
                          title="Revoke and generate new code"
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Dispatches: <span className="text-white font-bold">{sub.assignedJobsCount || 0}</span>
                  </span>
                  <Link
                    href={`/portal?subId=${sub.id}`}
                    className="text-[#FFD23F] hover:underline flex items-center gap-1"
                  >
                    <span>View Field UI</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Dispatch New Job */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel max-w-xl w-full rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative my-8">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FFD23F]" />
              <span>Dispatch New Solar Installation Job</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Create a project work order and assign it to a verified subcontractor.
            </p>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Manesar Auto Component Factory 600 kWp Rooftop"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Capacity (kWp)
                  </label>
                  <input
                    type="number"
                    value={newJobKwp}
                    onChange={(e) => setNewJobKwp(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    System Architecture
                  </label>
                  <select
                    value={newJobSystemType}
                    onChange={(e) => setNewJobSystemType(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  >
                    <option value="Rooftop Commercial Solar">Rooftop Commercial Solar</option>
                    <option value="Utility Ground-Mount Solar">Utility Ground-Mount Solar</option>
                    <option value="Industrial Microgrid with BESS">Industrial Microgrid with BESS</option>
                    <option value="Solar Canopy / Carport">Solar Canopy / Carport</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Site Physical Address
                </label>
                <input
                  type="text"
                  value={newJobSite}
                  onChange={(e) => setNewJobSite(e.target.value)}
                  placeholder="Plot number, industrial area, landmark"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newJobCity}
                    onChange={(e) => setNewJobCity(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newJobState}
                    onChange={(e) => setNewJobState(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={newJobPincode}
                    onChange={(e) => setNewJobPincode(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Assign to Subcontractor Firm
                </label>
                <select
                  value={newJobSubId}
                  onChange={(e) => setNewJobSubId(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  required
                >
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.companyName} ({sub.contactPerson} - {sub.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-5 py-2 text-xs font-bold bg-[#FFD23F] hover:bg-[#ffe17d] text-black rounded-lg transition-colors"
                >
                  {submittingJob ? "Dispatching..." : "Dispatch Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Onboard Subcontractor */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-[#FFD23F]" />
              <span>Onboard Subcontractor Firm</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              A cryptographically secure Vendor Code will be generated automatically.
            </p>

            <form onSubmit={handleOnboardSub} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Haryana Solar Powertech Solutions"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Field Supervisor / Contact Person
                </label>
                <input
                  type="text"
                  value={newSubPerson}
                  onChange={(e) => setNewSubPerson(e.target.value)}
                  placeholder="e.g. Vikramaditya Singh"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  Registered Mobile Number (for OTP)
                </label>
                <input
                  type="text"
                  value={newSubPhone}
                  onChange={(e) => setNewSubPhone(e.target.value)}
                  placeholder="+919812037550"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  State / Hub Region
                </label>
                <input
                  type="text"
                  value={newSubRegion}
                  onChange={(e) => setNewSubRegion(e.target.value)}
                  placeholder="e.g. Haryana / Rajasthan"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-3.5 py-2 text-white text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSub}
                  className="px-5 py-2 text-xs font-bold bg-[#FFD23F] hover:bg-[#ffe17d] text-black rounded-lg transition-colors"
                >
                  {submittingSub ? "Registering..." : "Onboard & Issue Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
