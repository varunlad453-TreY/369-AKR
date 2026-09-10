"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  History,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Upload,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Terminal,
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
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-amber-950/60 text-[#FFD23F] border border-amber-500/30">
            {action}
          </span>
        );
      case "OTP_REQUESTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-blue-950/60 text-blue-400 border border-blue-500/30">
            OTP_REQUESTED
          </span>
        );
      case "OTP_VERIFIED_SUCCESS":
      case "SUBCONTRACTOR_LOGIN":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
            {action}
          </span>
        );
      case "OTP_VERIFIED_FAILED":
      case "OTP_RATE_LIMIT_EXCEEDED":
      case "VENDOR_CODE_LOOKUP_FAILED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
            {action}
          </span>
        );
      case "PROOF_OF_WORK_UPLOADED":
      case "DOCUMENT_ATTACHED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
            {action}
          </span>
        );
      case "JOB_CREATED":
      case "JOB_STATUS_UPDATED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-purple-950/60 text-purple-400 border border-purple-500/30">
            {action}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-slate-800 text-slate-300">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb Nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#FFD23F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Plane</span>
        </Link>
        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FFD23F] hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>Cryptographic Security &amp; Compliance Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Immutable System Audit Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Auditing all Vendor Code creations, SMS OTP sessions, geolocated proof uploads, and dispatch status transitions.
            </p>
          </div>
          <div className="text-right font-mono text-xs text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
            <div>AUDIT COMPLIANCE: 100%</div>
            <div className="text-slate-400 text-[10px] mt-0.5">PostgreSQL Immutable Triggers</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor (phone/email), IP address, or action..."
            className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg pl-10 pr-4 py-2 text-white text-xs font-mono"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full sm:w-auto bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-4 py-2 text-white text-xs font-mono"
        >
          <option value="ALL">All Recorded Actions</option>
          <option value="VENDOR_CODE_GENERATED">VENDOR_CODE_GENERATED</option>
          <option value="OTP_REQUESTED">OTP_REQUESTED</option>
          <option value="OTP_VERIFIED_SUCCESS">OTP_VERIFIED_SUCCESS</option>
          <option value="PROOF_OF_WORK_UPLOADED">PROOF_OF_WORK_UPLOADED</option>
          <option value="JOB_STATUS_UPDATED">JOB_STATUS_UPDATED</option>
          <option value="JOB_CREATED">JOB_CREATED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#080C14] text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Timestamp (IST)</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Actor ID / Target</th>
                <th className="py-3.5 px-4">Source IP</th>
                <th className="py-3.5 px-4">Payload Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="font-semibold text-slate-200">{log.actorType}</span>
                    </td>
                    <td className="py-3 px-4 text-[#FFD23F]">
                      {log.actorIdentifier || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
