"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Layers,
  Users,
  ShieldAlert,
  Plus,
  LogOut,
  ChevronRight,
  PhoneCall,
  HardHat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // If on login page, render children without the admin navigation shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      window.location.href = "/admin/login";
    }
  };

  const isTabActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-50 text-slate-900 flex flex-col">
      {/* Persistent Enterprise Admin Sub-Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 sm:py-0 sm:h-12">
            {/* Left: Section label & Nav Tabs */}
            <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto">
              <span className="hidden md:inline-block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono shrink-0">
                ADMINISTRATION:
              </span>

              <nav className="flex items-center gap-1 text-xs shrink-0">
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    isTabActive("/admin") && pathname === "/admin"
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </Link>

                <Link
                  href="/admin/jobs"
                  className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    isTabActive("/admin/jobs")
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Project Dispatches</span>
                </Link>

                <Link
                  href="/admin/subcontractors"
                  className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    isTabActive("/admin/subcontractors")
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Contractor Directory</span>
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                    isTabActive("/admin/audit-logs")
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </Link>
              </nav>
            </div>

            {/* Right: Quick Action & Logout */}
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center text-xs">
              <Link
                href="/admin/jobs/new"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Dispatch</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                title="Sign out of Admin Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Page Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
