"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Building2,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/admin";
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("dispatcher@369akruniverse.in");
  const [password, setPassword] = useState("Admin@369AKR!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "unauthorized_admin"
      ? "Access Denied: Your account is not registered as an authorized dispatcher in the admins directory."
      : null
  );
  const [provisionNotice, setProvisionNotice] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both administrative email and password");
      return;
    }

    setLoading(true);
    setError(null);
    setProvisionNotice(null);

    try {
      // 1. Submit credentials to dedicated server-side admin authentication endpoint
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid administrative email or password.");
        setLoading(false);
        return;
      }

      // 2. Also initialize client-side Supabase auth if permitted (non-blocking)
      try {
        const supabase = createClient();
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      } catch {
        // Non-blocking
      }

      // 3. Successful verification -> Navigate to admin control plane
      window.location.href = redirectedFrom;
    } catch (err: unknown) {
      console.error("[Admin Login Error]", err);
      setError("Network connection failure. Please check your internet connection.");
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md space-y-5">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors font-medium">
            &larr; Back to Portal Overview
          </Link>
          <span className="font-mono text-[11px] text-slate-400">Management Access</span>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
            <div className="w-10 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Management Portal Login
              </h1>
              <p className="text-xs text-slate-500">
                AKR Dispatchers &amp; Solar Project Managers
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Provisioning Notice */}
          {provisionNotice && (
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              <p>{provisionNotice}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatcher Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="dispatcher@369akruniverse.in"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 pl-9 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 pl-9 pr-9 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Staging Account for Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Sample Dispatcher Account (Click to fill):
            </div>

            <button
              type="button"
              onClick={() => handleQuickFill("dispatcher@369akruniverse.in", "Admin@369AKR!")}
              className="w-full p-2.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-900 block">dispatcher@369akruniverse.in</span>
                <span className="text-[11px] text-slate-500">Central Dispatch Lead • Full Management Access</span>
              </div>
              <span className="text-[10px] text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold shrink-0">
                Auto-Fill
              </span>
            </button>
          </div>
        </div>

        {/* Support Help Notice */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>Need administrative assistance or password reset?</p>
          <p>
            Contact AKR Central Operations:{" "}
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

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-slate-50 text-slate-600 text-xs">
          Loading Management Login...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
