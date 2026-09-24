"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Job, Subcontractor } from "@/types";
import {
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Receipt,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";

interface BillBuilderFormProps {
  subcontractor: Subcontractor;
  jobs: Job[];
}

interface FormLineItem {
  id: string;
  itemCode?: string;
  description: string;
  hsnSac: string;
  uom: string;
  quantity: number | "";
  rate: number | "";
}

const PRESET_MILESTONES = [
  {
    description: "MMS Structure Piling & Tracker/Fixed-Tilt Erection with HDG hardware",
    hsnSac: "9954",
    uom: "kWp",
    defaultRate: 750,
  },
  {
    description: "Solar PV Mono-PERC Half-Cut Module Mounting, String Interconnection & Clamping",
    hsnSac: "9954",
    uom: "kWp",
    defaultRate: 1200,
  },
  {
    description: "DC Solar Cable Laying (1x4/6 sqmm) in UV HDPE Conduits & Inverter BOS Termination",
    hsnSac: "9987",
    uom: "kWp",
    defaultRate: 350,
  },
  {
    description: "Maintenance-Free Chemical Earthing Pits, GI Flat Strip Grid & Lightning Arrester",
    hsnSac: "9987",
    uom: "Set",
    defaultRate: 45000,
  },
  {
    description: "HT/LT Distribution Panel, 33kV Switchgear Interconnect & Net Metering Panel",
    hsnSac: "9987",
    uom: "Lot",
    defaultRate: 85000,
  },
];

const UOM_OPTIONS = ["kWp", "Nos", "Lot", "Mtr", "Set", "Cum", "Sqm", "Kg"];

export default function BillBuilderForm({ subcontractor, jobs }: BillBuilderFormProps) {
  const router = useRouter();

  // Step 1: Selected Job
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || "");

  // Step 2: Invoice Header
  const defaultInvoiceNo = `INV/${subcontractor.vendorCode.replace(/[^A-Z0-9]/gi, "").slice(-4)}/${new Date().getFullYear()}/01`;
  const [invoiceNo, setInvoiceNo] = useState(defaultInvoiceNo);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [taxType, setTaxType] = useState<"INTRA_STATE" | "INTER_STATE">("INTRA_STATE");
  const [notes, setNotes] = useState("");

  // Step 3: Dynamic Line Items
  const [items, setItems] = useState<FormLineItem[]>([
    {
      id: "item-1",
      description: "MMS Structure Piling & Tracker/Fixed-Tilt Erection with HDG hardware",
      hsnSac: "9954",
      uom: "kWp",
      quantity: jobs[0]?.capacityKwp || 100,
      rate: 750,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Add a blank row
  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: "",
        hsnSac: "9954",
        uom: "kWp",
        quantity: "",
        rate: "",
      },
    ]);
  };

  // Add preset row
  const handleAddPreset = (preset: (typeof PRESET_MILESTONES)[0]) => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: preset.description,
        hsnSac: preset.hsnSac,
        uom: preset.uom,
        quantity: selectedJob?.capacityKwp || 1,
        rate: preset.defaultRate,
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) {
      alert("At least one line item is required on the invoice.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update line item field
  const handleItemChange = (id: string, field: keyof FormLineItem, val: string | number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, [field]: val };
      })
    );
  };

  // Client-Side Calculations for Live Preview
  const subtotal = items.reduce((acc, it) => {
    const q = Number(it.quantity) || 0;
    const r = Number(it.rate) || 0;
    return acc + Number((q * r).toFixed(2));
  }, 0);

  const cgstAmount = taxType === "INTRA_STATE" ? Number((subtotal * 0.09).toFixed(2)) : 0;
  const sgstAmount = taxType === "INTRA_STATE" ? Number((subtotal * 0.09).toFixed(2)) : 0;
  const igstAmount = taxType === "INTER_STATE" ? Number((subtotal * 0.18).toFixed(2)) : 0;
  const grossTotal = Number((subtotal + cgstAmount + sgstAmount + igstAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedJobId) {
      setError("Please select a project job.");
      return;
    }

    if (!invoiceNo.trim()) {
      setError("Please enter a valid Invoice Number.");
      return;
    }

    // Validate line items
    const validItems = items.filter(
      (it) => it.description.trim() && Number(it.quantity) > 0 && Number(it.rate) >= 0
    );

    if (validItems.length === 0) {
      setError("Please include at least one valid line item with description, quantity, and rate.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        jobId: selectedJobId,
        subcontractorId: subcontractor.id,
        invoiceNo: invoiceNo.trim().toUpperCase(),
        invoiceDate,
        taxType,
        items: validItems.map((it) => ({
          itemCode: it.itemCode,
          description: it.description.trim(),
          hsnSac: it.hsnSac.trim() || "9954",
          uom: it.uom,
          quantity: Number(it.quantity),
          rate: Number(it.rate),
        })),
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit running account bill");
      }

      router.push("/portal/bills");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500 space-y-3 shadow-xs">
        <Layers className="w-8 h-8 mx-auto text-slate-400" />
        <p className="font-bold text-slate-800 text-sm">No Active Projects Assigned</p>
        <p>
          You cannot generate a Running Account bill without an assigned project work order.
          Please contact AKR Central Dispatch (+91 98120 37550) to receive your project assignment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Project / Work Order Selection */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">1. Select Assigned Solar Project Work Order</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Project / Site Allotment
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                [{job.jobCode}] {job.title} — {job.capacityKwp} kWp ({job.city}, {job.state})
              </option>
            ))}
          </select>
        </div>

        {selectedJob && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Work Order No:</span>
              <span className="font-mono font-bold text-slate-800">
                {selectedJob.workOrderNo || "WO/PENDING"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Installation Window:</span>
              <span className="font-mono text-slate-800">
                {selectedJob.scheduledStart ? new Date(selectedJob.scheduledStart).toLocaleDateString() : "N/A"} -{" "}
                {selectedJob.scheduledEnd ? new Date(selectedJob.scheduledEnd).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Contract Value:</span>
              <span className="font-mono font-bold text-slate-900">
                {selectedJob.contractAmount
                  ? `₹ ${selectedJob.contractAmount.toLocaleString("en-IN")}`
                  : "As per Milestones"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Invoice Details & GST Regime */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Receipt className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">2. Tax Invoice Header &amp; GST Regime</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
              placeholder="e.g. INV/2026/01"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              GST Taxation Regime
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="taxType"
                  value="INTRA_STATE"
                  checked={taxType === "INTRA_STATE"}
                  onChange={() => setTaxType("INTRA_STATE")}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Intra-State (CGST 9% + SGST 9%)</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="taxType"
                  value="INTER_STATE"
                  checked={taxType === "INTER_STATE"}
                  onChange={() => setTaxType("INTER_STATE")}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Inter-State (IGST 18%)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Line Items & Milestones */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">3. Line Items &amp; Work Execution Milestones</h2>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400">Quick Presets:</span>
            {PRESET_MILESTONES.slice(0, 3).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(p)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                + {p.uom === "Set" || p.uom === "Lot" ? p.uom : p.description.slice(0, 18)}...
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Table of Line Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <th className="px-3 py-2 w-7/12">Description of Milestone / Work Scope</th>
                <th className="px-2 py-2 w-20">HSN/SAC</th>
                <th className="px-2 py-2 w-20">UoM</th>
                <th className="px-2 py-2 w-24 text-right">Quantity</th>
                <th className="px-2 py-2 w-28 text-right">Rate (₹)</th>
                <th className="px-3 py-2 w-32 text-right">Amount (₹)</th>
                <th className="px-2 py-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const q = Number(item.quantity) || 0;
                const r = Number(item.rate) || 0;
                const rowAmount = Number((q * r).toFixed(2));

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        placeholder="e.g. MMS Piling and Tracker Installation"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
                        required
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={item.hsnSac}
                        onChange={(e) => handleItemChange(item.id, "hsnSac", e.target.value)}
                        placeholder="9954"
                        className="w-full px-2 py-1.5 text-xs font-mono text-center bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        required
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <select
                        value={item.uom}
                        onChange={(e) => handleItemChange(item.id, "uom", e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs text-center bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      >
                        {UOM_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-xs font-mono text-right bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        required
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "rate",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-xs font-mono text-right bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        required
                      />
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-800">
                      ₹ {rowAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Add Custom Line Item</span>
        </button>
      </div>

      {/* 4. Financial Calculation Summary & Bank Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Notes & Bank Coordinates */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Notes &amp; Milestone Completion Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milestone 1: 100% piling completed and certified by AKR site engineer."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wide">
              Disbursement Settlement Coordinates:
            </span>
            <div className="mt-1 font-mono text-[11px]">
              Bank: {subcontractor.bankName || "Not Provided"} · A/C:{" "}
              {subcontractor.bankAccountNumber || "Not Provided"}
            </div>
            <div className="font-mono text-[11px]">IFSC: {subcontractor.bankIfsc || "N/A"}</div>
          </div>
        </div>

        {/* Right: Live Calculations */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Real-time Tax Preview
            </h3>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Taxable Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">
                ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {taxType === "INTRA_STATE" ? (
              <>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>CGST (Central Tax @ 9%):</span>
                  <span className="font-mono text-slate-800">
                    ₹ {cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>SGST (State Tax @ 9%):</span>
                  <span className="font-mono text-slate-800">
                    ₹ {sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs text-slate-600">
                <span>IGST (Integrated Tax @ 18%):</span>
                <span className="font-mono text-slate-800">
                  ₹ {igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
              <span>Gross Invoice Total:</span>
              <span className="font-mono text-slate-900">
                ₹ {grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Note: Statutory TDS (Section 194C) and Contract Retention (e.g. 5%) will be finalized by
              central finance upon engineering audit approval.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={() => router.push("/portal/bills")}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-md shadow-xs transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting RA Bill...</span>
                </>
              ) : (
                <span>Submit RA Bill &amp; Generate Tax Invoice</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
