"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileCheck2,
} from "lucide-react";
import { AuditLog } from "@/types";
import { formatDateTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "VENDOR_CODE_GENERATED":
      case "VENDOR_CODE_REVOKED_AND_REGENERATED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            {action}
          </span>
        );
      case "OTP_REQUESTED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-300">
            OTP_REQUESTED
          </span>
        );
      case "OTP_VERIFIED_SUCCESS":
      case "SUBCONTRACTOR_LOGIN":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            {action}
          </span>
        );
      case "OTP_VERIFIED_FAILED":
      case "OTP_RATE_LIMIT_EXCEEDED":
      case "VENDOR_CODE_LOOKUP_FAILED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-red-50 text-red-800 border border-red-300">
            {action}
          </span>
        );
      case "PROOF_OF_WORK_UPLOADED":
      case "DOCUMENT_ATTACHED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-800 border border-indigo-300">
            {action}
          </span>
        );
      case "JOB_CREATED":
      case "JOB_STATUS_UPDATED":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-50 text-purple-800 border border-purple-300">
            {action}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    const matchesSearch =
      searchTerm === "" ||
      log.actorIdentifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Security &amp; Operations Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic ledger logging all vendor authentication events, work order status changes, and photo proof uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by phone, dispatcher email, action name, or IP..."
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 pl-9 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Action Filter:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-900"
          >
            <option value="ALL">All Recorded Actions ({logs.length})</option>
            <option value="VENDOR_CODE_GENERATED">Vendor Code Generated</option>
            <option value="OTP_REQUESTED">OTP Requested</option>
            <option value="OTP_VERIFIED_SUCCESS">OTP Verified</option>
            <option value="PROOF_OF_WORK_UPLOADED">Proof of Work Uploaded</option>
            <option value="JOB_STATUS_UPDATED">Job Status Updated</option>
            <option value="JOB_CREATED">Job Created</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400 mb-2" />
            <span>Loading audit ledger...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No matching audit events found.</p>
            <p>Clear your search filter to see historical events.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="px-5 py-3">Timestamp (IST)</th>
                  <th className="px-5 py-3">Action Event</th>
                  <th className="px-5 py-3">Actor Type</th>
                  <th className="px-5 py-3">Actor Identifier</th>
                  <th className="px-5 py-3">Source IP</th>
                  <th className="px-5 py-3">Context Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-sans">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3.5 font-sans font-semibold text-slate-800">
                      {log.actorType}
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-semibold whitespace-nowrap">
                      {log.actorIdentifier || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-sans text-xs max-w-sm truncate">
                      {log.metadata ? (
                        <span className="truncate block">
                          {typeof log.metadata === "object"
                            ? Object.entries(log.metadata)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" | ")
                            : String(log.metadata)}
                        </span>
                      ) : (
                        "—"
                      )}
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
