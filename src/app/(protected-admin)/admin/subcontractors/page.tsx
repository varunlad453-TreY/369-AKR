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
  FileText,
  ShieldCheck,
  ExternalLink,
  X,
  CreditCard,
  Building,
  Download,
  Share2,
  Printer,
} from "lucide-react";
import { Subcontractor } from "@/types";
import { createClient } from "@/lib/supabase/client";
import VendorDossierPrintable from "@/components/admin/VendorDossierPrintable";

export default function AdminSubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedKycSub, setSelectedKycSub] = useState<Subcontractor | null>(null);
  const [dossierSub, setDossierSub] = useState<Subcontractor | null>(null);
  const [dossierKyc, setDossierKyc] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [exportingPdf, setExportingPdf] = useState(false);
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

  useEffect(() => {
    if (selectedKycSub) {
      setDossierSub(selectedKycSub);
      if (selectedKycSub.vendorCode === "AKR-1114") {
        fetch("/documents/subcontractors/AKR-1114/kyc_profile.json")
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) setDossierKyc(data);
          })
          .catch(() => {});
      } else {
        setDossierKyc(null);
      }

      import("qrcode").then((m) => {
        const QRCode = m.default || m;
        const gatewayUrl = `http://localhost:3000/gateway?code=${encodeURIComponent(selectedKycSub.vendorCode)}`;
        QRCode.toDataURL(gatewayUrl, {
          margin: 1,
          width: 240,
          color: { dark: "#0F172A", light: "#FFFFFF" },
        }).then(setQrCodeDataUrl);
      });
    }
  }, [selectedKycSub]);

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

  const prepareDossier = async (sub: Subcontractor) => {
    let kyc = undefined;
    if (sub.vendorCode === "AKR-1114") {
      try {
        const res = await fetch("/documents/subcontractors/AKR-1114/kyc_profile.json");
        if (res.ok) kyc = await res.json();
      } catch {}
    }
    setDossierSub(sub);
    setDossierKyc(kyc);

    try {
      const m = await import("qrcode");
      const QRCode = m.default || m;
      const gatewayUrl = `http://localhost:3000/gateway?code=${encodeURIComponent(sub.vendorCode)}`;
      const qrData = await QRCode.toDataURL(gatewayUrl, {
        margin: 1,
        width: 240,
        color: { dark: "#0F172A", light: "#FFFFFF" },
      });
      setQrCodeDataUrl(qrData);
    } catch (e) {
      console.warn("QR Code generation error", e);
    }

    // Small delay to allow React to paint the DOM element
    await new Promise((resolve) => setTimeout(resolve, 250));
  };

  const handleExportPdf = async (sub: Subcontractor) => {
    setExportingPdf(true);
    try {
      await prepareDossier(sub);

      const element = document.getElementById("vendor-dossier-printable-document");
      if (!element) {
        throw new Error("Printable dossier element not found in DOM");
      }

      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x high-res retina quality (crisp typography & vectors)
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight));
      const cleanFileName = `${sub.companyName.replace(/[^a-zA-Z0-9]/g, "_")}_${sub.vendorCode}_Official_Dossier.pdf`;
      pdf.save(cleanFileName);

      setNotification({
        type: "success",
        msg: `Official Executive Dossier for ${sub.companyName} (${sub.vendorCode}) downloaded successfully.`,
      });
      setTimeout(() => setNotification(null), 7000);
    } catch (pdfErr) {
      console.error("PDF generation failed", pdfErr);
      setNotification({
        type: "error",
        msg: "Failed to generate PDF. Please try again.",
      });
      setTimeout(() => setNotification(null), 6000);
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintDossier = async (sub: Subcontractor) => {
    await prepareDossier(sub);
    window.print();
  };

  const handleShareWhatsApp = (sub: Subcontractor) => {
    const text =
      `*369 AKR UNIVERSE SOLAR EPC - VENDOR CREDENTIAL*\n\n` +
      `Dear ${sub.contactPerson} (${sub.companyName}),\n\n` +
      `Your contractor onboarding and statutory KYC compliance verification is *COMPLETE*.\n\n` +
      `*OFFICIAL VENDOR CODE:* ${sub.vendorCode}\n` +
      `*REGISTERED MOBILE:* ${sub.phoneNumber}\n` +
      `*STATUS:* ACTIVE TIER-1 CONTRACTOR\n\n` +
      `*Contractor Operations Gateway:*\nhttps://369akruniverse.com/gateway?code=${encodeURIComponent(sub.vendorCode)}\n\n` +
      `Please keep your Vendor Code confidential. Use it to log in via mobile OTP to view assigned solar installations, submit milestone photos, and receive direct bank disbursements.`;

    const cleanPhone = sub.phoneNumber.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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
                        onClick={() => handleExportPdf(sub)}
                        disabled={exportingPdf}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded font-medium transition-colors cursor-pointer disabled:opacity-50"
                        title={`Export official PDF Dossier for ${sub.companyName} (${sub.vendorCode})`}
                      >
                        <Download className="w-3.5 h-3.5 text-amber-600" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => setSelectedKycSub(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded font-medium transition-colors cursor-pointer"
                        title="View verified compliance & KYC documents"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>KYC Docs</span>
                      </button>
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

      {/* KYC Compliance & Verification Modal */}
      {selectedKycSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedKycSub.companyName}</span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-300 font-bold text-amber-900 shadow-xs">
                      {selectedKycSub.vendorCode}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Verified Vendor Profile &amp; Regulatory KYC Compliance
                  </p>
                </div>
              </div>

              {/* Action Buttons in Modal Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPdf(selectedKycSub)}
                  disabled={exportingPdf}
                  title="Export official onboarding dossier PDF"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{exportingPdf ? "Generating..." : "Export as PDF"}</span>
                </button>

                <button
                  onClick={() => handlePrintDossier(selectedKycSub)}
                  title="Print or Save as Vector PDF"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  onClick={() => handleShareWhatsApp(selectedKycSub)}
                  title="Share credentials with partner via WhatsApp"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <button
                  onClick={() => setSelectedKycSub(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 text-xs">
              {/* Prominent Vendor Code Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                    Assigned Master Vendor Code (Primary Identifier)
                  </div>
                  <div className="text-2xl sm:text-3xl font-mono font-extrabold tracking-tight text-white mt-0.5 flex items-center gap-2.5">
                    <span>{selectedKycSub.vendorCode}</span>
                    <span className="text-[10px] font-sans font-semibold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                      Verified Tier-1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Share this code with the partner. Used at <span className="text-amber-300 font-mono font-semibold">/gateway</span> to receive login OTP.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleExportPdf(selectedKycSub)}
                    disabled={exportingPdf}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{exportingPdf ? "Exporting..." : "Download Official PDF"}</span>
                  </button>
                </div>
              </div>

              {/* Profile Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Proprietor / Supervisor</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedKycSub.contactPerson}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Registered Mobile (OTP Gateway)</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">{selectedKycSub.phoneNumber}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Operational Region</span>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedKycSub.stateRegion}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Compliance &amp; License Number</span>
                  <div className="font-mono text-slate-800 mt-0.5">{selectedKycSub.licenseNumber || "Recorded in file"}</div>
                </div>
              </div>

              {/* Specific Details for Swarajya Construction and Developers (AKR-1114) */}
              {selectedKycSub.vendorCode === "AKR-1114" && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-500">
                      Statutory Tax &amp; MSME Registrations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-500">GSTIN (State 27)</div>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">27ENRPM7534P1ZV</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1">● Regular Taxpayer</div>
                      </div>
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-500">MSME Udyam No.</div>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">UDYAM-MH-12-0015908</div>
                        <div className="text-[10px] text-blue-600 font-semibold mt-1">● Micro Enterprise</div>
                      </div>
                      <div className="p-2.5 rounded bg-white border border-slate-200">
                        <div className="text-[10px] text-slate-500">Income Tax PAN</div>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">ENRPM7534P</div>
                        <div className="text-[10px] text-slate-600 font-semibold mt-1">● Aadhaar Linked</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-500">
                      Disbursement Bank Account
                    </h3>
                    <div className="p-3 bg-white border border-slate-200 rounded flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900">HDFC Bank Ltd. (Biz Pro Plus Current Account)</div>
                        <div className="font-mono text-slate-700">Account No: 50200124368375 • IFSC: HDFC0001991</div>
                        <div className="text-[11px] text-slate-500">Branch: Hingoli - Nawa Mondha, Plot No 8/163, Hingoli 431513</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-slate-500">
                      Registered Proof Documents (Available for Audit Download)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href="/documents/subcontractors/AKR-1114/gst_registration_certificate.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-600" />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600">Form GST REG-06 Certificate</div>
                            <div className="text-[10px] text-slate-500">PDF • Verified 27ENRPM7534P1ZV</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>

                      <a
                        href="/documents/subcontractors/AKR-1114/udyam_msme_registration.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600">Udyam Registration Certificate</div>
                            <div className="text-[10px] text-slate-500">PDF • UDYAM-MH-12-0015908</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>

                      <a
                        href="/documents/subcontractors/AKR-1114/bank_statement_hdfc.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600">HDFC Bank Account Confirmation</div>
                            <div className="text-[10px] text-slate-500">PDF • A/C 50200124368375</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>

                      <a
                        href="/documents/subcontractors/AKR-1114/aadhaar_card_front.jpeg"
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600">UIDAI Aadhaar Card (Front/Back)</div>
                            <div className="text-[10px] text-slate-500">Image • 9978 0205 9920</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>

                      <a
                        href="/documents/subcontractors/AKR-1114/pan_card.jpeg"
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600">Income Tax PAN Card</div>
                            <div className="text-[10px] text-slate-500">Image • ENRPM7534P</div>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Authorized for Utility-Scale &amp; Commercial Rooftop Dispatches</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleExportPdf(selectedKycSub)}
                  disabled={exportingPdf}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>{exportingPdf ? "Generating Official PDF..." : "Export as PDF"}</span>
                </button>
                <button
                  onClick={() => handlePrintDossier(selectedKycSub)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded text-xs font-semibold transition-colors cursor-pointer"
                  title="Print or Save as Vector PDF via browser print"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedKycSub(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen / Print Document Container (For crisp 2.5x capture & native @media print) */}
      {dossierSub && (
        <div
          className="fixed left-[-9999px] top-0 pointer-events-none z-[-50] print:left-0 print:top-0 print:z-50 print:pointer-events-auto print:w-full print:bg-white"
          aria-hidden="true"
        >
          <VendorDossierPrintable
            subcontractor={dossierSub}
            kycDetails={dossierKyc}
            qrCodeDataUrl={qrCodeDataUrl}
          />
        </div>
      )}
    </div>
  );
}
