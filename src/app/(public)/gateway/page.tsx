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
  PhoneCall,
  RefreshCw,
  HardHat,
} from "lucide-react";

export default function GatewayPage() {
  const router = useRouter();
  const [vendorCode, setVendorCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorCode.trim()) {
      setError("Please enter your assigned Vendor Code to continue");
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
        setError(data.error || "Invalid Vendor Code. Please check and try again.");
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
      setError("Unable to connect to the server. Please check your internet connection.");
      setLoading(false);
    }
  };

  const handleQuickFill = (code: string) => {
    setVendorCode(code);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md space-y-5">
        {/* Main Login Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
            <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Subcontractor Portal Login
              </h1>
              <p className="text-xs text-slate-500">
                Access your assigned solar installation projects
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="vendorCode"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Enter Your Vendor Code
              </label>
              <div className="relative">
                <input
                  id="vendorCode"
                  type="text"
                  value={vendorCode}
                  onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AKR-1114"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-slate-900 font-mono text-sm tracking-wide uppercase placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                  autoFocus
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                Enter your assigned 7-character vendor code (e.g. <code className="font-bold text-slate-800">AKR-1114</code>). We will send a quick
                6-digit SMS OTP to your registered phone number.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold py-3 px-4 rounded transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Code &amp; Sending SMS...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code to My Phone</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Sample Accounts for Reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Trying the demo? Click a sample contractor:
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill("AKR-1114")}
                className="w-full text-left p-2.5 rounded bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Swarajya Construction and Developers</span>
                    <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-300">
                      NEW VENDOR
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Code: <span className="font-mono font-bold text-slate-900">AKR-1114</span> • Phone: +91 95526 28232
                  </div>
                </div>
                <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0 font-medium">
                  Hingoli, MH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("AKR-JOB-7K9M-SEC")}
                className="w-full text-left p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">SuryaShakti EPC Services</div>
                  <div className="text-[11px] text-slate-500">
                    Code: <span className="font-mono font-semibold">AKR-JOB-7K9M-SEC</span> • Phone: +91 98120 37550
                  </div>
                </div>
                <span className="text-[10px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 font-medium">
                  Rohtak 450 kWp
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Friendly Phone Support Callout */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>Don&#39;t have your Vendor Code or need help logging in?</p>
          <p>
            Call AKR Central Dispatch:{" "}
            <a
              href="tel:+919812037550"
              className="text-slate-800 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3 text-slate-600" />
              <span>+91 98120 37550</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
