import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-auto font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Brand Col */}
          <div className="space-y-2">
            <div className="relative h-6 w-36">
              <Image
                src="/images/logo/logo-horizontal.svg"
                alt="369 AKR UNIVERSE"
                width={140}
                height={24}
                className="h-6 w-auto object-contain"
              />
            </div>
            <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
              369 AKR UNIVERSE Subcontractor Operations Portal (SOP). EPC field operations
              management, CAD dispatching, and cryptographic proof-of-work verification.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PostgreSQL RLS Protected</span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              System Modules
            </h3>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/gateway" className="hover:text-slate-900 transition-colors">
                  Subcontractor Gateway (OTP Auth)
                </Link>
              </li>
              <li>
                <Link href="/portal" className="hover:text-slate-900 transition-colors">
                  Field Operations UI
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-slate-900 transition-colors">
                  Admin Control Plane
                </Link>
              </li>
              <li>
                <Link href="/admin/audit-logs" className="hover:text-slate-900 transition-colors">
                  Security Audit Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Standards */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Security Specifications
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-500">
              <li>• Row-Level Security Policed</li>
              <li>• DLT Compliant SMS Dispatch</li>
              <li>• 256-bit Vendor Codes</li>
              <li>• Geotagged Proof Watermarking</li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Central Dispatch Desk
            </h3>
            <div className="space-y-1 text-[11px] text-slate-600">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="font-sans">Rohtak, Haryana, India 124001</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>+91 98120 37550</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>info@369akruniverse.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} 369 AKR UNIVERSE. Subcontractor Operations Portal.</p>
          <p className="text-slate-400">Next.js 15 • Supabase PostgreSQL • Edge RBAC</p>
        </div>
      </div>
    </footer>
  );
}
