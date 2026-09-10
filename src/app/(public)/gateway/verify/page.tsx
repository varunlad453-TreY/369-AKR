"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Lock,
} from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vendorCode = searchParams.get("code") || "";
  const maskedPhone = searchParams.get("phone") || "your registered number";
  const demoOtp = searchParams.get("demoOtp");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorCode, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Incorrect OTP.");
        setLoading(false);
        return;
      }

      // Successful verification! Redirect to Subcontractor Field Portal
      router.push(`/portal?subId=${data.subcontractor.id}`);
    } catch {
      setError("Failed to verify code. Please check your network connection.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/vendor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCountdown(60);
      } else {
        setError(data.error || "Could not resend OTP at this time");
      }
    } catch {
      setError("Resend request failed");
    } finally {
      setResending(false);
    }
  };

  const handleUseDemoOtp = () => {
    if (demoOtp) {
      setOtp(demoOtp);
      setError(null);
    } else {
      setOtp("369369");
      setError(null);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-solar-grid">
      <div className="w-full max-w-md">
        {/* Top Navigation */}
        <div className="mb-6">
          <Link
            href="/gateway"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#FFD23F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Vendor Code</span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD23F] via-amber-400 to-yellow-500" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#FFD23F] mb-3">
              <Smartphone className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Enter SMS Verification Code
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Dispatched to your registered mobile number:{" "}
              <span className="text-[#FFD23F] font-mono font-semibold block sm:inline">
                {maskedPhone}
              </span>
            </p>
          </div>

          {/* Test Mode OTP Banner */}
          <div className="mb-6 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs flex items-center justify-between">
            <div>
              <span className="text-amber-400 font-bold font-mono">DEMO SIMULATION OTP:</span>{" "}
              <code className="text-white font-mono bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                {demoOtp || "369369"}
              </code>
            </div>
            <button
              type="button"
              onClick={handleUseDemoOtp}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#FFD23F] hover:bg-amber-400 text-black rounded transition-colors"
            >
              Auto-Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otpInput"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 font-mono"
              >
                6-Digit Dynamic Passcode
              </label>
              <input
                id="otpInput"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] focus:ring-1 focus:ring-[#FFD23F] rounded-lg px-4 py-3.5 text-center text-white font-mono text-2xl tracking-[0.5em] placeholder:text-slate-700 transition-colors"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-[#FFD23F] hover:bg-[#ffe17d] disabled:opacity-50 text-black font-bold text-sm py-3.5 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Passcode &amp; Issuing Session...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate &amp; Open Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Resend Code Section */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Didn&#39;t receive the SMS?</span>
            {countdown > 0 ? (
              <span className="font-mono text-amber-400">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[#FFD23F] hover:underline flex items-center gap-1 font-mono font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-amber-400 font-mono text-sm">
          Loading Security Gateway...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
