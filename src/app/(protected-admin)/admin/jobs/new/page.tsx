"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Building2,
  Calendar,
  Zap,
  MapPin,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Subcontractor } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function NewJobDispatchPage() {
  const router = useRouter();
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capacityKwp, setCapacityKwp] = useState("350");
  const [systemType, setSystemType] = useState("Rooftop Commercial Solar");
  const [siteAddress, setSiteAddress] = useState("");
  const [city, setCity] = useState("Rohtak");
  const [state, setState] = useState("Haryana");
  const [pincode, setPincode] = useState("124001");
  const [latitude, setLatitude] = useState("28.8955");
  const [longitude, setLongitude] = useState("76.6066");
  const [subcontractorId, setSubcontractorId] = useState("");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubs() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("subcontractors").select("*").order("company_name");
        if (!error && data) {
          const mapped: Subcontractor[] = data.map((s) => ({
            id: s.id,
            companyName: s.company_name,
            phoneNumber: s.phone_number,
            vendorCode: s.vendor_code,
            contactPerson: s.contact_person,
            stateRegion: s.state_region,
            isActive: s.is_active,
            rating: Number(s.rating) || 5.0,
            assignedJobsCount: s.assigned_jobs_count || 0,
            completedJobsCount: s.completed_jobs_count || 0,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));
          setSubcontractors(mapped);
          if (mapped.length > 0) {
            setSubcontractorId(mapped[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load subcontractors", err);
      } finally {
        setLoadingSubs(false);
      }
    }

    loadSubs();

    // Default dates (Start: today, End: 14 days from now)
    const now = new Date();
    const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setScheduledStart(now.toISOString().split("T")[0]);
    setScheduledEnd(in14Days.toISOString().split("T")[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !siteAddress.trim() || !capacityKwp) {
      setError("Please fill in project title, site address, and system capacity.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          capacityKwp: Number(capacityKwp),
          systemType,
          siteAddress: siteAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          gpsCoordinates: {
            lat: Number(latitude) || 28.8955,
            lng: Number(longitude) || 76.6066,
          },
          subcontractorId,
          scheduledStart: new Date(scheduledStart).toISOString(),
          scheduledEnd: new Date(scheduledEnd).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch solar job");
      }

      // Success! Navigate to projects list
      router.push("/admin/jobs");
      router.refresh();
    } catch (err: unknown) {
      console.error("Dispatch job error", err);
      setError(err instanceof Error ? err.message : "Error dispatching job");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/admin/jobs"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Projects</span>
      </Link>

      {/* Main Dispatch Form Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Dispatch New Solar Project
            </h1>
            <p className="text-xs text-slate-500">
              Create a work order assignment and issue CAD schematics to a partner contractor.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Section 1: Project Basics */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              1. Project Specifications
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project Title &amp; Client Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 450 kWp Industrial Rooftop Solar - Rohtak Cold Chain"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scope &amp; Technical Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Turnkey EPC installation of 450 kWp rooftop solar PV with mono-PERC half-cut modules and string inverters."
                rows={3}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  System Capacity (kWp)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={capacityKwp}
                  onChange={(e) => setCapacityKwp(e.target.value)}
                  placeholder="350"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  System Type
                </label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-slate-900"
                >
                  <option value="Rooftop Commercial Solar">Rooftop Commercial &amp; Industrial</option>
                  <option value="Ground Mount Utility Scale">Ground Mount Utility Scale</option>
                  <option value="Solar Agricultural Pump">Solar Agricultural Microgrid</option>
                  <option value="Residential Solar Array">Residential Rooftop</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Location Details */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              2. Site Address &amp; Location
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Physical Street Address
              </label>
              <input
                type="text"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g. Plot 42, HSIIDC Industrial Area, Phase II"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-slate-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Latitude (GPS)
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="28.8955"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Longitude (GPS)
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="76.6066"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Subcontractor Assignment & Dates */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              3. Contractor Assignment &amp; Dates
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assign to Partner Contractor
              </label>
              {loadingSubs ? (
                <div className="p-2 text-slate-500">Loading contractors...</div>
              ) : (
                <select
                  value={subcontractorId}
                  onChange={(e) => setSubcontractorId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-slate-900"
                  required
                >
                  {subcontractors.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.companyName} ({sub.contactPerson} - {sub.stateRegion})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scheduled Start Date
                </label>
                <input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scheduled End Date
                </label>
                <input
                  type="date"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
            <Link
              href="/admin/jobs"
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
                  <span>Dispatching Work Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispatch Solar Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
