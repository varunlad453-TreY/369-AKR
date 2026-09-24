"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bill, BillStatus } from "@/types";
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator";
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

function StatusBadge({ status }: { status: BillStatus }) {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
          Draft
        </span>
      );
    case "submitted":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
          Submitted
        </span>
      );
    case "verified":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200">
          QA Verified
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">
          Approved for Pay
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-900 border border-green-300">
          Disbursed
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-300">
          Rejected
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

export default function AdminBillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      if (data.success && Array.isArray(data.bills)) {
        setBills(data.bills);
      }
    } catch (err) {
      console.error("Failed to fetch bills", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Financial KPIs
  const totalInvoiced = bills.reduce((acc, curr) => acc + curr.grossTotal, 0);
  const totalPending = bills
    .filter((b) => b.status === "submitted" || b.status === "verified")
    .reduce((acc, curr) => acc + curr.grossTotal, 0);
  const totalApproved = bills
    .filter((b) => b.status === "approved")
    .reduce((acc, curr) => acc + curr.netPayable, 0);
  const totalPaid = bills
    .filter((b) => b.status === "paid")
    .reduce((acc, curr) => acc + curr.netPayable, 0);

  // Filters
  const filteredBills = bills.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      b.invoiceNo.toLowerCase().includes(q) ||
      b.subcontractor?.companyName.toLowerCase().includes(q) ||
      b.subcontractor?.vendorCode.toLowerCase().includes(q) ||
      b.job?.jobCode?.toLowerCase().includes(q) ||
      b.job?.title?.toLowerCase().includes(q) ||
      b.job?.workOrderNo?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleDownloadPDF = (bill: Bill) => {
    try {
      setDownloadingId(bill.id);
      const doc = generateInvoicePDF(bill);
      const filename = `Tax_Invoice_${bill.invoiceNo.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation error", err);
      alert("Failed to export Tax Invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-700" />
            <h1 className="text-xl font-bold text-slate-900">Accounts Payable &amp; RA Billing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit Running Account milestone claims, configure statutory TDS &amp; Retention deductions, and authorize payouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBills}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Invoiced Pipeline</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            ₹ {totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total claims submitted across {bills.length} bills</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pending Audit Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">
            ₹ {totalPending.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requires engineering QA &amp; rate verification</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Approved Net Ready for Payout</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            ₹ {totalApproved.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Post statutory TDS &amp; Retention deductions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Disbursed (Paid Out)</span>
            <IndianRupee className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            ₹ {totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Direct NEFT/RTGS settlements completed</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, contractor, or project code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {["ALL", "submitted", "verified", "approved", "paid", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {st === "ALL" ? "All Invoices" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-slate-400" />
            <p>Loading Accounts Payable Ledger...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700">No Running Account Bills Found</p>
            <p>No invoices match your current search or filter query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice Ref</th>
                  <th className="px-4 py-3">Contractor Entity</th>
                  <th className="px-4 py-3">Project / Site</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">GST Taxes</th>
                  <th className="px-4 py-3 text-right">Gross Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Net Payable</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => {
                  const totalTax = bill.igstAmount > 0 ? bill.igstAmount : bill.cgstAmount + bill.sgstAmount;
                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{bill.invoiceNo}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {bill.subcontractor?.companyName || "Field Partner"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Code: {bill.subcontractor?.vendorCode} · GST: {bill.subcontractor?.gstNumber || "Unregistered"}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">
                          {bill.job?.title || "Assigned Project"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {bill.job?.jobCode} {bill.job?.workOrderNo ? `· ${bill.job.workOrderNo}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-right whitespace-nowrap text-slate-700">
                        ₹ {bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 font-mono text-right whitespace-nowrap text-slate-600">
                        ₹ {totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <div className="text-[10px] text-slate-400">
                          {bill.igstAmount > 0 ? `IGST ${bill.igstRate}%` : `CGST+SGST 18%`}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-right whitespace-nowrap text-slate-900">
                        ₹ {bill.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge status={bill.status} />
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-right whitespace-nowrap text-emerald-700">
                        ₹ {bill.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {(bill.retentionAmount > 0 || bill.tdsAmount > 0) && (
                          <div className="text-[10px] font-normal text-slate-400">
                            Ded: ₹ {(bill.retentionAmount + bill.tdsAmount).toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handleDownloadPDF(bill)}
                          disabled={downloadingId === bill.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
                          title="Download Tax Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>PDF</span>
                        </button>

                        <Link
                          href={`/admin/bills/${bill.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                        >
                          <span>Review &amp; Settle</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
