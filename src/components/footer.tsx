import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ShieldCheck, Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#080C14] text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="relative h-10 w-48">
              <Image
                src="/images/logo/logo-horizontal.svg"
                alt="369 AKR UNIVERSE"
                width={200}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              India&#39;s premier solar EPC and utility-scale energy solutions contractor.
              Engineering future-proof renewable energy assets with cutting-edge B2B field workforce orchestration.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#FFD23F]" />
              <span>Zero-Trust Field Operations Architecture</span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Portal Modules
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/gateway" className="hover:text-[#FFD23F] transition-colors flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-[#FFD23F]" />
                  Subcontractor Gateway (OTP Access)
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-[#FFD23F] transition-colors">
                  Field Operations UI
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#FFD23F] transition-colors">
                  Admin Control Plane
                </Link>
              </li>
              <li>
                <Link href="/admin/audit-logs" className="hover:text-[#FFD23F] transition-colors">
                  Security Audit Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Standards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Standards & Security
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD23F]"></span>
                Supabase PostgreSQL RLS Policed
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD23F]"></span>
                DLT Compliant SMS Dispatch (TRAI)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD23F]"></span>
                Cryptographic Vendor Codes (256-bit)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD23F]"></span>
                Geotagged Proof-of-Work Verification
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Central Headquarters
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FFD23F] shrink-0 mt-0.5" />
                <span>Sube Singh Complex, X3-4624, Rohtak, Haryana, India 124001</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FFD23F] shrink-0" />
                <span>+91 98120 37550 / +91 90509 37550</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FFD23F] shrink-0" />
                <span>info@369akruniverse.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} 369 AKR UNIVERSE. All rights reserved. Enterprise B2B SaaS Portal.</p>
          <p className="font-mono text-[11px] text-amber-500/80">
            Powered by Next.js Serverless + Supabase PostgreSQL RLS
          </p>
        </div>
      </div>
    </footer>
  );
}
