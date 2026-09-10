"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Shield, KeyRound, LayoutDashboard, HardHat, ArrowRight } from "lucide-react";
import { NetworkStatusIndicator } from "@/components/network-status-indicator";

export function Navbar() {
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#0B0F19]/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-44 md:w-52 flex items-center">
            <Image
              src="/images/logo/logo-horizontal.svg"
              alt="369 AKR UNIVERSE"
              width={200}
              height={40}
              priority
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold tracking-widest text-black bg-[#FFD23F] px-2 py-0.5 rounded font-mono uppercase">
            SOP B2B
          </span>
        </Link>

        {/* Live Network & Offline Vault Indicator */}
        <div className="hidden sm:flex items-center">
          <NetworkStatusIndicator />
        </div>


        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              isLinkActive("/") && pathname === "/"
                ? "text-[#FFD23F] bg-amber-500/10"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            Overview
          </Link>

          <Link
            href="/gateway"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              isLinkActive("/gateway")
                ? "text-black bg-[#FFD23F] font-semibold shadow-md shadow-amber-500/20"
                : "text-amber-400 hover:text-white hover:bg-amber-500/10 border border-amber-500/30"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Subcontractor Gateway</span>
          </Link>

          <Link
            href="/portal"
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              isLinkActive("/portal")
                ? "text-[#FFD23F] bg-amber-500/10 border border-amber-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <HardHat className="w-4 h-4 text-[#FFD23F]" />
            <span>Field Portal</span>
          </Link>

          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              isLinkActive("/admin")
                ? "text-[#FFD23F] bg-slate-800 border border-amber-500/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Admin Plane</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
