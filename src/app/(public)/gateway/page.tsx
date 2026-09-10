"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Lock,
  Building2,
  RefreshCw,
} from "lucide-react";

export default function GatewayPage() {
  const router = useRouter();
  const [vendorCode, setVendorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorCode.trim()) {
      setError("Please enter your assigned Vendor Code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/vendor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorCode: vendorCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication gateway rejected this code");
        setLoading(false);
        return;
      }

      const query = new URLSearchParams({
        code: data.session.vendorCode,
        phone: data.session.maskedPhone,
        expires: data.session.expiresAt,
        ...(data.session.demoOtp ? { demoOtp: data.session.demoOtp } : {}),
      });

      router.push(`/gateway/verify?${query.toString()}`);
    } catch {
      setError("Network connection failed. Please retry.");
      setLoading(false);
    }
  };

  const handleQuickFill = (code: string) => {
    setVendorCode(code);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Gateway Card */}
        <div className="bg-white border border-slate-200 rounded p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 mb-5">
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-mono font-bold uppercase text-slate-900">
                Subcontractor Auth Gateway
              </h1>
              <p className="text-[11px] text-slate-500 font-sans">
                369 AKR UNIVERSE Zero-Trust Access Barrier
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="vendorCode"
                className="block text-[11px] font-mono font-semibold uppercase text-slate-700 mb-1"
              >
                Assigned Vendor Access Code
              </label>
              <div className="relative">
                <input
                  id="vendorCode"
                  type="text"
                  value={vendorCode}
                  onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AKR-JOB-7K9M-SEC"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 font-mono text-xs tracking-wider uppercase placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                  autoFocus
                  required
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-sans">
                Enter the 16-character cryptographic code provided in your work order dispatch.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono text-xs font-semibold py-2.5 px-4 rounded transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying &amp; Sending SMS...</span>
                </>
              ) : (
                <>
                  <span>Request Dynamic SMS OTP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Codes */}
          <div className="mt-6 pt-4 border-t border-slate-100 font-mono text-xs">
            <div className="text-[11px] uppercase text-slate-500 mb-2 font-semibold">
              Evaluation Demo Accounts:
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("AKR-JOB-7K9M-SEC")}
                className="w-full text-left p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">AKR-JOB-7K9M-SEC</span>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    SuryaShakti EPC (+91 98120 37550)
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Rohtak 450 kWp
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("AKR-JOB-4X2P-SEC")}
                className="w-full text-left p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">AKR-JOB-4X2P-SEC</span>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    Thar High-Voltage (+91 90509 37550)
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Jaipur 1.2 MWp
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Compliance Note */}
        <div className="text-center font-mono text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>PostgreSQL Rate-Limiting &amp; DLT SMS Audit Trail Active</span>
        </div>
      </div>
    </div>
  );
}
