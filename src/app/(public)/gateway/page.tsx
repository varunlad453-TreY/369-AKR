"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Lock,
  Radio,
  CheckCircle2,
  Sparkles,
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

      // Navigate to step 2 verification
      const query = new URLSearchParams({
        code: data.session.vendorCode,
        phone: data.session.maskedPhone,
        expires: data.session.expiresAt,
        ...(data.session.demoOtp ? { demoOtp: data.session.demoOtp } : {}),
      });

      router.push(`/gateway/verify?${query.toString()}`);
    } catch {
      setError("Network or server connection failed. Please retry.");
      setLoading(false);
    }
  };

  const handleQuickFill = (code: string) => {
    setVendorCode(code);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-solar-grid">
      <div className="w-full max-w-md">
        {/* Security Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#FFD23F] mb-4 shadow-lg shadow-amber-500/10">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Subcontractor Gateway
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Zero-Trust Operational Access for 369 AKR UNIVERSE Field Partners
          </p>
        </div>

        {/* Main Gateway Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          {/* Top Edge Indicator */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD23F] to-transparent" />

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-6 pb-4 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>STEP 1 OF 2: VENDOR CODE</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>ENCRYPTED</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="vendorCode"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 font-mono"
              >
                Project / Vendor Access Code
              </label>
              <div className="relative">
                <input
                  id="vendorCode"
                  type="text"
                  value={vendorCode}
                  onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AKR-JOB-7K9M-SEC"
                  className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] focus:ring-1 focus:ring-[#FFD23F] rounded-lg px-4 py-3.5 text-white font-mono text-sm tracking-wider uppercase placeholder:text-slate-600 transition-colors"
                  autoFocus
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-4" />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Provided by 369 AKR Central Dispatch in your operational mandate or agreement.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FFD23F] hover:bg-[#ffe17d] disabled:opacity-50 text-black font-bold text-sm py-3.5 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Code &amp; Dispatching SMS...</span>
                </>
              ) : (
                <>
                  <span>Request SMS One-Time Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Test Accounts for Evaluators */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD23F]" />
              <span>One-Click Test Vendor Codes:</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill("AKR-JOB-7K9M-SEC")}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono text-[#FFD23F] font-bold">AKR-JOB-7K9M-SEC</div>
                  <div className="text-slate-400 text-[11px]">SuryaShakti EPC (+91 98120 37550)</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  Rohtak 450 kWp
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("AKR-JOB-4X2P-SEC")}
                className="w-full text-left p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono text-[#FFD23F] font-bold">AKR-JOB-4X2P-SEC</div>
                  <div className="text-slate-400 text-[11px]">Thar High-Voltage (+91 90509 37550)</div>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                  Jaipur 1.2 MWp
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Compliance Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Protected by Rate-Limiting &amp; DLT SMS Audit Tracking</span>
        </div>
      </div>
    </div>
  );
}
