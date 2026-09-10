"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Building2,
  PhoneCall,
  MapPin,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Subcontractor } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function AdminSubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchSubcontractors = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subcontractors")
        .select("*")
        .order("company_name", { ascending: true });

      if (!error && data) {
        setSubcontractors(
          data.map((s) => ({
            id: s.id,
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
      console.error("Failed to fetch subcontractors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  const handleRegenerateCode = async (sub: Subcontractor) => {
    const confirmed = confirm(
      `Are you sure you want to regenerate the Vendor Code for ${sub.companyName}? Their previous code will immediately stop working.`
    );
    if (!confirmed) return;

    setRegeneratingId(sub.id);
    try {
      const res = await fetch(`/api/subcontractors/${sub.id}/regenerate-code`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: "success", msg: `New Vendor Code for ${sub.companyName}: ${data.newVendorCode}` });
        await fetchSubcontractors();
        setTimeout(() => setNotification(null), 8000);
      } else {
        setNotification({ type: "error", msg: data.error || "Could not regenerate code" });
        setTimeout(() => setNotification(null), 8000);
      }
    } catch {
      setNotification({ type: "error", msg: "Network error regenerating code" });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDeleteSubcontractor = async (sub: Subcontractor) => {
    const confirmed = confirm(
      `REMOVE CONTRACTOR?\n\n"${sub.companyName}"\nVendor Code: ${sub.vendorCode}\n\nThis will permanently remove them from the directory. Active jobs must be reassigned first. This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(sub.id);
    try {
      const res = await fetch(`/api/subcontractors/${sub.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ type: "success", msg: `${data.deletedCompany} has been removed from the contractor directory.` });
        setSubcontractors((prev) => prev.filter((s) => s.id !== sub.id));
        setTimeout(() => setNotification(null), 6000);
      } else {
        setNotification({ type: "error", msg: data.error || "Failed to remove contractor." });
        setTimeout(() => setNotification(null), 10000);
      }
    } catch {
      setNotification({ type: "error", msg: "Network error — could not delete contractor." });
      setTimeout(() => setNotification(null), 8000);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSubs = subcontractors.filter((sub) => {
    const term = searchQuery.toLowerCase();
    return (
      sub.companyName.toLowerCase().includes(term) ||
      sub.contactPerson.toLowerCase().includes(term) ||
      sub.vendorCode.toLowerCase().includes(term) ||
      sub.phoneNumber.includes(term) ||
      sub.stateRegion.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Contractor Partner Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage enrolled solar installation partners, issue access vendor codes, and monitor regional ratings.
          </p>
        </div>

        <Link
          href="/admin/subcontractors/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enroll New Partner</span>
        </Link>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded border text-xs flex items-center justify-between gap-2 shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span className="font-medium">{notification.msg}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="font-bold opacity-60 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, contact person, vendor code, or region..."
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 pl-9 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <button
          onClick={fetchSubcontractors}
          disabled={loading}
          className="p-2 rounded border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors self-end md:self-center"
          title="Refresh contractor directory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Contractor Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400 mb-2" />
            <span>Loading contractor directory...</span>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No contractors found matching your search.</p>
            <p>Check spelling or enroll a new partner using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="px-5 py-3">Company &amp; Supervisor</th>
                  <th className="px-5 py-3">Active Vendor Code</th>
                  <th className="px-5 py-3">Phone Contact</th>
                  <th className="px-5 py-3">Region / Hub</th>
                  <th className="px-5 py-3">Assigned Projects</th>
                  <th className="px-5 py-3">Completed Projects</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{sub.companyName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Supervisor: {sub.contactPerson}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {sub.vendorCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                      {sub.phoneNumber}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {sub.stateRegion}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                      {sub.assignedJobsCount}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-mono font-semibold text-emerald-700">
                      {sub.completedJobsCount}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {sub.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active Partner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleRegenerateCode(sub)}
                        disabled={regeneratingId === sub.id || deletingId === sub.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                        title="Generate a new secure Vendor Code"
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 ${
                            regeneratingId === sub.id ? "animate-spin" : ""
                          }`}
                        />
                        <span>Regen Code</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSubcontractor(sub)}
                        disabled={deletingId === sub.id || regeneratingId === sub.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                        title="Permanently remove contractor from directory"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${deletingId === sub.id ? "animate-pulse" : ""}`} />
                        <span>{deletingId === sub.id ? "Removing..." : "Delete"}</span>
                      </button>
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
