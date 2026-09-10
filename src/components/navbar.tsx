"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { KeyRound, Shield, HardHat, PhoneCall } from "lucide-react";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Brand Logo & Portal Label */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2">
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
          <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
            Solar EPC Portal
          </span>
        </div>

        {/* Center: Network Status */}
        <div className="hidden lg:flex items-center">
          <NetworkStatusIndicator />
        </div>

        {/* Navigation Links & Helpline */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 sm:gap-1.5 text-xs">
            <Link
              href="/"
              className={`px-2.5 py-1.5 rounded transition-colors ${
                isLinkActive("/") && pathname === "/"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Home
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
              <span>Subcontractor Login</span>
            </Link>

            <Link
              href="/portal"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
                isLinkActive("/portal")
                  ? "bg-slate-100 text-slate-900 font-semibold border border-slate-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <HardHat className="w-3.5 h-3.5 text-slate-500" />
              <span>Field Projects</span>
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
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          </nav>

          <div className="hidden xl:flex items-center pl-2 border-l border-slate-200">
            <a
              href="tel:+919812037550"
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              title="Call Central Dispatch Helpline"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              <span>+91 98120 37550</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
