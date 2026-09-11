"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Smartphone,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
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
      setError("Please enter the full 6-digit code sent to your phone");
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
        setError(data.error || "Incorrect code. Please double-check the SMS on your phone.");
        setLoading(false);
        return;
      }

      router.push("/portal");
    } catch {
      setError("Connection error. Please check your internet connection and try again.");
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
        setError(data.error || "Could not resend SMS at this time. Please wait a moment.");
      }
    } catch {
      setError("Resend request failed. Please try again.");
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
      <div className="w-full max-w-md space-y-5">
        <Link
          href="/gateway"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Enter a different Vendor Code</span>
        </Link>

        {/* Verification Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
            <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Enter 6-Digit SMS Code
              </h1>
              <p className="text-xs text-slate-500">
                Sent to: <strong className="text-slate-800">{maskedPhone}</strong>
              </p>
            </div>
          </div>

          {/* Test Demo Helper */}
          <div className="mb-5 p-3 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Demo Mode SMS Code:</span>
              <strong className="text-slate-900 font-mono text-sm">{demoOtp || "369369"}</strong>
            </div>
            <button
              type="button"
              onClick={handleUseDemoOtp}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded transition-colors"
            >
              Fill Code (369369)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="otpInput"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Enter the 6-Digit Verification Code
              </label>
              <input
                id="otpInput"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2.5 text-center text-slate-900 font-mono text-xl tracking-[0.4em] placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold py-3 px-4 rounded transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify &amp; Open My Projects</span>
                </>
              )}
            </button>
          </form>

          {/* Resend Code Section */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Didn&#39;t get the SMS?</span>
            {countdown > 0 ? (
              <span className="text-slate-400 font-mono">Resend available in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-slate-900 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend SMS Code</span>
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
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50 text-slate-600 text-xs">
          Loading verification screen...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
