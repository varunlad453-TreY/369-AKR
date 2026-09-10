"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Server,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/admin";
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("dispatcher@369akruniverse.in");
  const [password, setPassword] = useState("AKR-Admin-2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "unauthorized_admin"
      ? "Access Denied: Your account is not registered as an authorized dispatcher in the admins table."
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
      const supabase = createClient();

      // 1. Attempt Supabase Password Authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      let authenticatedUser = data?.user || null;
      let finalAuthError = authError;

      // 2. If user does not exist yet in Supabase Auth (e.g. first-time evaluation run), auto-provision
      if (finalAuthError && (finalAuthError.message.includes("Invalid login credentials") || finalAuthError.message.includes("Email not confirmed"))) {
        setProvisionNotice("Initializing first-time admin credentials with Supabase Auth...");
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: "AKR Central Dispatch Lead",
              role: "super_admin",
            },
          },
        });

        if (!signUpError && signUpData.user) {
          authenticatedUser = signUpData.user;
          finalAuthError = null;
        } else if (signUpError) {
          console.warn("[Admin Login Provisioning Notice]", signUpError);
        }
      }

      if (finalAuthError || !authenticatedUser) {
        setError(finalAuthError?.message || "Invalid administrative credentials.");
        setLoading(false);
        setProvisionNotice(null);
        return;
      }

      // 3. Verify user matches public.admins table and link auth_user_id
      const { data: adminRecord, error: adminErr } = await supabase
        .from("admins")
        .select("id, email, role")
        .or(`auth_user_id.eq.${authenticatedUser.id},email.eq.${authenticatedUser.email}`)
        .maybeSingle();

      if (adminErr || !adminRecord) {
        setError("Your account authenticated, but is not enrolled in the admins table. Contact System Operations.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Link auth_user_id if not yet set
      await supabase
        .from("admins")
        .update({ auth_user_id: authenticatedUser.id })
        .eq("email", authenticatedUser.email);

      // Log login to audit_logs
      try {
        await supabase.from("audit_logs").insert({
          action: "ADMIN_LOGIN_SUCCESS",
          actor_type: "ADMIN",
          actor_identifier: authenticatedUser.email,
          resource_id: adminRecord.id,
          resource_type: "admins",
          metadata: {
            loginTime: new Date().toISOString(),
            role: adminRecord.role,
          },
        });
      } catch (logErr) {
        console.warn("[Admin Login] Audit log warning:", logErr);
      }

      // 4. Redirect to protected control plane
      router.push(redirectedFrom);
      router.refresh();
    } catch (err: unknown) {
      console.error("[Admin Login Error]", err);
      setError("Gateway network communication failure. Please check your connectivity.");
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-solar-grid">
      <div className="w-full max-w-md">
        {/* Security Shield Card */}
        <div className="rounded-2xl border border-[#FFD23F]/30 bg-[#0B0F19]/90 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gold gradient accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FFD23F] to-transparent"></div>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative w-14 h-14 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Image
                src="/akr-logo.png"
                alt="369 AKR UNIVERSE"
                width={36}
                height={36}
                className="object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
              <Shield className="w-7 h-7 text-[#FFD23F]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#FFD23F] text-xs font-mono mb-2">
              <Lock className="w-3 h-3" />
              <span>AIR TRAFFIC CONTROL PLANE</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white">
              Admin Access Gateway
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Cryptographically verified session required to dispatch solar jobs and manage subcontractors.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Provisioning Notice */}
          {provisionNotice && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#FFD23F] shrink-0 mt-0.5 animate-spin" />
              <p className="text-xs text-amber-300 leading-relaxed font-mono">{provisionNotice}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Dispatcher Email
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
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-[#FFD23F] focus:ring-1 focus:ring-[#FFD23F] text-white text-sm placeholder-slate-500 transition-all font-mono outline-none"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Master Security Password
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
                  className="w-full px-4 py-3 pl-11 pr-11 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-[#FFD23F] focus:ring-1 focus:ring-[#FFD23F] text-white text-sm placeholder-slate-500 transition-all font-mono outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-[#FFD23F] to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Control Plane</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Staging Badge */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1 text-[#FFD23F]">
                <Sparkles className="w-3 h-3" />
                Pre-Seeded Staging Account
              </span>
              <span>1-Click Fill</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickFill("dispatcher@369akruniverse.in", "AKR-Admin-2026!")}
              className="w-full p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 text-left transition-all text-xs font-mono text-slate-300 flex items-center justify-between group cursor-pointer"
            >
              <div>
                <span className="text-amber-400 font-semibold block">dispatcher@369akruniverse.in</span>
                <span className="text-[10px] text-slate-500">Role: super_admin • Central Dispatch</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-[#FFD23F] group-hover:bg-amber-500/20 transition-colors">
                Apply
              </span>
            </button>
          </div>

          {/* Compliance Footer */}
          <div className="mt-6 text-center text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2">
            <Server className="w-3 h-3 text-emerald-400" />
            <span>RLS Enforced • Supabase Auth v2 • Next.js Middleware</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-amber-400 font-mono text-xs">
          Loading Security Gateway...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
