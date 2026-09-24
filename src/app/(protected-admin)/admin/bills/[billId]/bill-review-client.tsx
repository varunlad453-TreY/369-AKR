"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bill, BillStatus } from "@/types";
import { generateInvoicePDF } from "@/lib/pdf/invoice-generator";
import {
  ArrowLeft,
  Download,
  Building2,
  Layers,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  Loader2,
  FileCheck,
  XCircle,
  Percent,
} from "lucide-react";

interface BillReviewClientProps {
  initialBill: Bill;
}

function StatusBadge({ status }: { status: BillStatus }) {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          Draft
        </span>
      );
    case "submitted":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          Submitted for Review
        </span>
      );
    case "verified":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
          QA Verified
        </span>
      );
    case "approved":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
          Approved for Payout
        </span>
      );
    case "paid":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-900 border border-green-300">
          Disbursed / Paid
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

export default function BillReviewClient({ initialBill }: BillReviewClientProps) {
  const router = useRouter();
  const [bill, setBill] = useState<Bill>(initialBill);

  // Admin adjustments
  const [retentionPercentage, setRetentionPercentage] = useState<number>(
    initialBill.retentionPercentage || 5.0
  );
  const [tdsPercentage, setTdsPercentage] = useState<number>(
    initialBill.tdsPercentage || 1.0
  );
  const [adminNotes, setAdminNotes] = useState<string>(initialBill.notes || "");

  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Dynamic Live Deductions Calculation
  const subtotal = bill.subtotal;
  const grossTotal = bill.grossTotal;

  // Retention is calculated on Subtotal (Taxable Value) as per standard Indian EPC practice
  const calculatedRetention = Number(
    ((subtotal * (Number(retentionPercentage) || 0)) / 100).toFixed(2)
  );
  // TDS u/s 194C is calculated on Taxable Value
  const calculatedTds = Number(
    ((subtotal * (Number(tdsPercentage) || 0)) / 100).toFixed(2)
  );
  const calculatedNetPayable = Number(
    (grossTotal - calculatedRetention - calculatedTds).toFixed(2)
  );

  const handleUpdateStatus = async (newStatus: BillStatus) => {
    setSavingAction(newStatus);
    setToast(null);

    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          retentionPercentage: Number(retentionPercentage) || 0,
          tdsPercentage: Number(tdsPercentage) || 0,
          notes: adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update bill status");
      }

      setBill((prev) => ({
        ...prev,
        status: newStatus,
        retentionPercentage: Number(retentionPercentage) || 0,
        retentionAmount: calculatedRetention,
        tdsPercentage: Number(tdsPercentage) || 0,
        tdsAmount: calculatedTds,
        netPayable: calculatedNetPayable,
        notes: adminNotes,
      }));

      setToast({
        type: "success",
        msg: `Invoice ${bill.invoiceNo} successfully updated to "${newStatus.toUpperCase()}".`,
      });

      router.refresh();
    } catch (err: unknown) {
      setToast({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to update invoice status",
      });
    } finally {
      setSavingAction(null);
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Build export copy with current adjustments
      const currentSnapshot: Bill = {
        ...bill,
        retentionPercentage: Number(retentionPercentage) || 0,
        retentionAmount: calculatedRetention,
        tdsPercentage: Number(tdsPercentage) || 0,
        tdsAmount: calculatedTds,
        netPayable: calculatedNetPayable,
        notes: adminNotes,
      };
      const doc = generateInvoicePDF(currentSnapshot);
      const filename = `Tax_Invoice_${bill.invoiceNo.replace(/[^A-Za-z0-9_-]/g, "_")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to export PDF invoice");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/admin/bills"
            className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Accounts Payable</span>
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-slate-800">{bill.invoiceNo}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download Official Tax Invoice PDF</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`px-4 py-3 rounded-lg text-xs flex items-center gap-2.5 ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-slate-900">{bill.invoiceNo}</span>
            <StatusBadge status={bill.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
            <span>
              Invoice Date:{" "}
              <strong className="font-mono text-slate-800">
                {new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </span>
            <span>
              Work Order:{" "}
              <strong className="font-mono text-slate-800">
                {bill.job?.workOrderNo || "AKR/WO/PENDING"}
              </strong>
            </span>
            <span>
              Solar Site:{" "}
              <strong className="text-slate-800">
                {bill.job?.city}, {bill.job?.state} ({bill.job?.capacityKwp} kWp)
              </strong>
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">Gross Invoice Value</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
            ₹ {bill.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400">Includes applicable GST taxes</div>
        </div>
      </div>

      {/* 2-Column Info Grid (Contractor Statutory & Bank Coordinates vs. Project Scope) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Subcontractor & Bank Account Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Subcontractor &amp; Settlement Coordinates
            </h2>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-sm font-bold text-slate-900">
              {bill.subcontractor?.companyName || "Field Contractor Entity"}
            </div>
            <div className="text-slate-600">
              Contact: {bill.subcontractor?.contactPerson} ({bill.subcontractor?.phoneNumber})
            </div>
            <div className="font-mono text-slate-600">
              Vendor Code: <span className="font-bold text-slate-800">{bill.subcontractor?.vendorCode}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">GSTIN:</span>
              <span className="font-bold text-slate-900">
                {bill.subcontractor?.gstNumber || "Unregistered"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PAN:</span>
              <span className="font-bold text-slate-900">
                {bill.subcontractor?.panNumber || "Not Provided"}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between">
              <span className="text-slate-500">Bank Name:</span>
              <span className="text-slate-900">{bill.subcontractor?.bankName || "HDFC Bank Ltd."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account No:</span>
              <span className="font-bold text-slate-900">
                {bill.subcontractor?.bankAccountNumber || "50200124368375"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="text-slate-900">{bill.subcontractor?.bankIfsc || "HDFC0001991"}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Branch:</span>
              <span>{bill.subcontractor?.bankBranch || "Industrial Area Branch"}</span>
            </div>
          </div>
        </div>

        {/* Project Work Order Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Layers className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Project Job &amp; Work Order Reference
            </h2>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-sm font-bold text-slate-900">
              {bill.job?.title || "Solar EPC Installation"}
            </div>
            <div className="text-slate-600">{bill.job?.siteAddress}</div>
            <div className="font-mono text-slate-600">
              Project Code: <span className="font-bold text-slate-800">{bill.job?.jobCode}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Work Order Ref:</span>
              <span className="font-bold text-slate-900">
                {bill.job?.workOrderNo || "AKR/WO/2026/0104"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Work Order Date:</span>
              <span className="text-slate-900">
                {bill.job?.workOrderDate || "2026-02-15"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">System Capacity:</span>
              <span className="font-bold text-slate-900">{bill.job?.capacityKwp} kWp</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contract Value:</span>
              <span className="font-bold text-slate-900">
                {bill.job?.contractAmount
                  ? `₹ ${bill.job.contractAmount.toLocaleString("en-IN")}`
                  : "Turnkey EPC"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Line Items */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs space-y-2">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Billed Milestones &amp; Work Execution Items ({bill.items?.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase">
                <th className="px-4 py-2.5 w-12 text-center">#</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-center">HSN/SAC</th>
                <th className="px-4 py-2.5 text-center">UoM</th>
                <th className="px-4 py-2.5 text-right">Quantity</th>
                <th className="px-4 py-2.5 text-right">Rate (₹)</th>
                <th className="px-4 py-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(bill.items || []).map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.description}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600">{item.hsnSac}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{item.uom}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {Number(item.quantity).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 3,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    ₹ {Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                    ₹ {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Audit, Deductions Adjustment & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Tax Summary Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            GST Tax Computation Schedule
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value (Subtotal):</span>
              <span className="font-mono font-semibold text-slate-900">
                ₹ {bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {bill.igstAmount > 0 ? (
              <div className="flex justify-between text-slate-600">
                <span>IGST @ {bill.igstRate}%:</span>
                <span className="font-mono text-slate-800">
                  ₹ {bill.igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST @ {bill.cgstRate}%:</span>
                  <span className="font-mono text-slate-800">
                    ₹ {bill.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST @ {bill.sgstRate}%:</span>
                  <span className="font-mono text-slate-800">
                    ₹ {bill.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Gross Invoice Amount:</span>
              <span className="font-mono">
                ₹ {bill.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Admin Audit Notes / Ledger Remarks:
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Engineering verification passed. Piling certified by QA team."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>
        </div>

        {/* Right Column: Interactive Deductions & Net Settlement Form */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Statutory Deductions &amp; Net Settlement Calculator
            </h3>

            {/* Retention % Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <span>Contract Retention Money (%)</span>
                </label>
                <span className="font-mono text-slate-500">
                  Amount: - ₹ {calculatedRetention.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={retentionPercentage}
                  onChange={(e) => setRetentionPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
                <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Typically 5% held until defects liability period expiration.
              </p>
            </div>

            {/* TDS % Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <span>Income Tax TDS u/s 194C (%)</span>
                </label>
                <span className="font-mono text-slate-500">
                  Amount: - ₹ {calculatedTds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tdsPercentage}
                  onChange={(e) => setTdsPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
                <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                1% for individual/proprietor contractor; 2% for corporate entities.
              </p>
            </div>

            {/* Net Payable Highlight Card */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Final Net Payable (Disbursement)
                </span>
                <span className="text-xs text-emerald-600">
                  Gross ₹{grossTotal.toFixed(2)} - Deductions ₹{(calculatedRetention + calculatedTds).toFixed(2)}
                </span>
              </div>

              <div className="text-xl font-bold font-mono text-emerald-800">
                ₹ {calculatedNetPayable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
            {/* Reject */}
            {bill.status !== "rejected" && (
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => {
                  if (confirm("Are you sure you want to reject this Running Account bill?")) {
                    handleUpdateStatus("rejected");
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Bill</span>
              </button>
            )}

            {/* Verify */}
            {bill.status === "submitted" && (
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => handleUpdateStatus("verified")}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors disabled:opacity-50"
              >
                {savingAction === "verified" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileCheck className="w-3.5 h-3.5" />
                )}
                <span>Verify Milestone QA</span>
              </button>
            )}

            {/* Approve */}
            {(bill.status === "submitted" || bill.status === "verified") && (
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => handleUpdateStatus("approved")}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                {savingAction === "approved" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Approve Bill</span>
              </button>
            )}

            {/* Mark as Paid */}
            {bill.status === "approved" && (
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => handleUpdateStatus("paid")}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                {savingAction === "paid" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Mark as Paid (Disbursed)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
