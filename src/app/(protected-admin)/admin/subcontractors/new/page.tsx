"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Building2,
  PhoneCall,
  MapPin,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateSecureVendorCode } from "@/lib/utils";

export default function NewSubcontractorPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [stateRegion, setStateRegion] = useState("Maharashtra (Hingoli / Marathwada)");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vendorCode, setVendorCode] = useState("AKR-1114");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactPerson.trim() || !phoneNumber.trim()) {
      setError("Please fill in company name, contact supervisor, and phone number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Format: AKR-XXXX (e.g. AKR-1114)
      const finalVendorCode = vendorCode.trim().toUpperCase() || generateSecureVendorCode();

      const { data, error: insertError } = await supabase
        .from("subcontractors")
        .insert({
          company_name: companyName.trim(),
          contact_person: contactPerson.trim(),
          phone_number: phoneNumber.trim(),
          state_region: stateRegion.trim(),
          license_number: licenseNumber.trim() || null,
          vendor_code: finalVendorCode,
          is_active: true,
          rating: 5.0,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message || "Failed to register contractor");
      }

      // Log to audit trail
      try {
        await supabase.from("audit_logs").insert({
          action: "SUBCONTRACTOR_REGISTERED",
          actor_type: "ADMIN",
          actor_identifier: "dispatcher@369akruniverse.in",
          resource_id: data.id,
          resource_type: "subcontractors",
          metadata: {
            companyName: data.company_name,
            vendorCode: finalVendorCode,
          },
        });
      } catch {
        // Non-fatal
      }

      // Success! Navigate back to directory
      router.push("/admin/subcontractors");
      router.refresh();
    } catch (err: unknown) {
      console.error("Enroll error", err);
      setError(err instanceof Error ? err.message : "Failed to register contractor");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/subcontractors"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Contractor Directory</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Enroll New Partner Contractor
            </h1>
            <p className="text-xs text-slate-500">
              Register an installation partner firm and automatically issue their initial Vendor Code.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Company / Firm Legal Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. SuryaShakti EPC Private Limited"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Authorized Supervisor / Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Registered Mobile Phone (Receives OTP)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98120 37550"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operational State / Region Hub
              </label>
              <select
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-slate-900"
              >
                <option value="Maharashtra (Hingoli / Marathwada)">Maharashtra (Hingoli / Marathwada)</option>
                <option value="Haryana / NCR">Haryana / NCR</option>
                <option value="Rajasthan Hub">Rajasthan Hub</option>
                <option value="Punjab Region">Punjab Region</option>
                <option value="Uttar Pradesh Central">Uttar Pradesh Central</option>
                <option value="Gujarat Solar Corridor">Gujarat Solar Corridor</option>
                <option value="Madhya Pradesh Region">Madhya Pradesh Region</option>
                <option value="Karnataka Hub">Karnataka Hub</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                License / GST / Udyam Number (Optional)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. GST: 27ENRPM7534P1ZV / UDYAM-MH-12-0015908"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Assigned Vendor Code <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setVendorCode(generateSecureVendorCode())}
                className="text-[11px] text-slate-600 hover:text-slate-900 underline flex items-center gap-1 font-mono"
              >
                <KeyRound className="w-3 h-3" />
                <span>Auto-Generate Random Code</span>
              </button>
            </div>
            <input
              type="text"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
              placeholder="e.g. AKR-1114"
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono font-bold text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 uppercase tracking-wide"
              required
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Client Standard: 7-character code (Format: <code className="font-bold text-slate-800">AKR-XXXX</code>). First vendor is <code className="font-bold text-emerald-700">AKR-1114</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[11px] leading-relaxed">
            Upon enrollment, the contractor will be bound to their unique Vendor Code
            (e.g. <code className="font-bold">AKR-1114</code>) to access solar dispatches and blueprints via mobile SMS OTP verification.
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <Link
              href="/admin/subcontractors"
              className="px-4 py-2.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering Contractor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enroll Partner Firm</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
