"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Subcontractor } from "@/types";
import { CheckCircle2, AlertCircle, Loader2, Landmark, Shield } from "lucide-react";

interface ProfileFormProps {
  subcontractor: Subcontractor;
}

export default function ProfileForm({ subcontractor }: ProfileFormProps) {
  const router = useRouter();

  const [gstNumber, setGstNumber] = useState(subcontractor.gstNumber || "");
  const [panNumber, setPanNumber] = useState(subcontractor.panNumber || "");
  const [bankName, setBankName] = useState(subcontractor.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(subcontractor.bankAccountNumber || "");
  const [bankIfsc, setBankIfsc] = useState(subcontractor.bankIfsc || "");
  const [bankBranch, setBankBranch] = useState(subcontractor.bankBranch || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/subcontractors/${subcontractor.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstNumber: gstNumber.trim().toUpperCase(),
          panNumber: panNumber.trim().toUpperCase(),
          bankName: bankName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          bankIfsc: bankIfsc.trim().toUpperCase(),
          bankBranch: bankBranch.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Statutory GST, PAN, and Banking details saved successfully!");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred while saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Toast / Notification Banners */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. GST & Income Tax Information */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/75 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">1. Statutory Tax &amp; GST Identification</h2>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              GSTIN (Goods &amp; Services Tax Number)
            </label>
            <input
              type="text"
              maxLength={15}
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 27ENRPM7534P1ZV"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              15-character statutory GSTIN matching state of operations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Income Tax PAN (Permanent Account Number)
            </label>
            <input
              type="text"
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="e.g. ENRPM7534P"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              10-character PAN of entity or proprietor used for Section 194C TDS deduction.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Direct Disbursement Banking Coordinates */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/75 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">
            2. Verified Settlement Bank Account (NEFT / RTGS)
          </h2>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank Ltd. / State Bank of India"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bank Account Number
            </label>
            <input
              type="text"
              maxLength={20}
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 50200124368375"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              IFSC Code
            </label>
            <input
              type="text"
              maxLength={11}
              value={bankIfsc}
              onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
              placeholder="e.g. HDFC0001991"
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              11-character Indian Financial System Code.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Branch Name &amp; Address
            </label>
            <input
              type="text"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              placeholder="e.g. Hingoli - Nawa Mondha, Hingoli 431513"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/portal")}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-md shadow-xs transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <span>Save Statutory Profile</span>
          )}
        </button>
      </div>
    </form>
  );
}
