"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { KeyRound, Shield, HardHat, LayoutDashboard } from "lucide-react";
import { NetworkStatusIndicator } from "@/components/network-status-indicator";

export function Navbar() {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo & System Label */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-7 w-32 md:w-36 flex items-center">
              <Image
                src="/images/logo/logo-horizontal.svg"
                alt="369 AKR UNIVERSE"
                width={140}
                height={28}
                priority
                className="h-6 w-auto object-contain"
              />
            </div>
          </Link>
          <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono uppercase">
            SOP B2B
          </span>
        </div>

        {/* Center: Live Network Status */}
        <div className="hidden md:flex items-center">
          <NetworkStatusIndicator />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-1.5 font-mono text-xs">
          <Link
            href="/"
            className={`px-2.5 py-1.5 rounded transition-colors ${
              isLinkActive("/") && pathname === "/"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Overview
          </Link>

          <Link
            href="/gateway"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
              isLinkActive("/gateway")
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Gateway</span>
          </Link>

          <Link
            href="/portal"
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
              isLinkActive("/portal")
                ? "bg-slate-100 text-slate-900 font-semibold border border-slate-300"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <HardHat className="w-3.5 h-3.5 text-slate-500" />
            <span>Field Portal</span>
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
              isLinkActive("/admin")
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Admin Plane</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
