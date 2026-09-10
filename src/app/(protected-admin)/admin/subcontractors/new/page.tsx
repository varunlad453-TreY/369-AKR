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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function NewSubcontractorPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [stateRegion, setStateRegion] = useState("Haryana / NCR");
  const [licenseNumber, setLicenseNumber] = useState("");

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

      // Generate random 4-char alphanumeric token for vendor code
      const randToken = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedCode = `AKR-JOB-${randToken}-SEC`;

      const { data, error: insertError } = await supabase
        .from("subcontractors")
        .insert({
          company_name: companyName.trim(),
          contact_person: contactPerson.trim(),
          phone_number: phoneNumber.trim(),
          state_region: stateRegion.trim(),
          license_number: licenseNumber.trim() || null,
          vendor_code: generatedCode,
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
            vendorCode: generatedCode,
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
                <option value="Haryana / NCR">Haryana / NCR</option>
                <option value="Rajasthan Hub">Rajasthan Hub</option>
                <option value="Punjab Region">Punjab Region</option>
                <option value="Uttar Pradesh Central">Uttar Pradesh Central</option>
                <option value="Gujarat Solar Corridor">Gujarat Solar Corridor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Electrical Contractor License (Optional)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. DISCOM/ELEC/2026/0942"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[11px] leading-relaxed">
            Upon enrollment, the system will automatically generate a secure 16-character Vendor Code
            (e.g. <code>AKR-JOB-XXXX-SEC</code>) for this partner to access work orders via SMS verification.
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
