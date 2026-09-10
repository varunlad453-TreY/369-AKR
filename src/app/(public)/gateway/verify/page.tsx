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
  RefreshCw,
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
        setError(data.error || "Authentication failed. Invalid or expired OTP.");
        setLoading(false);
        return;
      }

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
    setOtp(demoOtp || "369369");
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/gateway"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Vendor Code Entry</span>
        </Link>

        {/* Verification Card */}
        <div className="bg-white border border-slate-200 rounded p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 mb-5">
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-mono font-bold uppercase text-slate-900">
                SMS One-Time Password Verification
              </h1>
              <p className="text-[11px] text-slate-500 font-sans">
                Dispatched to: <strong className="text-slate-800 font-mono">{maskedPhone}</strong>
              </p>
            </div>
          </div>

          {/* Test Simulation Banner */}
          <div className="mb-4 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs font-mono flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] block uppercase">Simulation OTP:</span>
              <code className="font-bold text-slate-900">{demoOtp || "369369"}</code>
            </div>
            <button
              type="button"
              onClick={handleUseDemoOtp}
              className="px-2 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded transition-colors"
            >
              Auto-Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="otpInput"
                className="block text-[11px] font-mono font-semibold uppercase text-slate-700 mb-1"
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
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-center text-slate-900 font-mono text-xl tracking-[0.4em] placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono text-xs font-semibold py-2.5 px-4 rounded transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verify Passcode &amp; Open Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Didn&#39;t receive OTP?</span>
            {countdown > 0 ? (
              <span className="text-slate-400">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-slate-900 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50 text-slate-600 font-mono text-xs">
          Loading Security Gateway...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
