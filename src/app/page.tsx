import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  LayoutDashboard,
  Zap,
  MapPin,
  FileCheck2,
  Lock,
  ArrowRight,
  Sun,
  Activity,
  Award,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col bg-[#06090e]">
      {/* Hero Section with Video/Atmospheric Glow */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-amber-500/20">
        {/* Video / Background Overlay */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-25 filter brightness-75 scale-105"
            src="/videos/solar-hero.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06090e]/80 via-[#06090e]/60 to-[#06090e]" />
          <div className="absolute inset-0 bg-solar-radial pointer-events-none" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#FFD23F] text-xs font-mono tracking-wide mb-6 uppercase">
            <Sun className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
            <span>369 AKR UNIVERSE • Subcontractor Operations Portal (SOP)</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            ENERGY. <span className="text-[#FFD23F] drop-shadow-[0_0_35px_rgba(255,210,63,0.35)]">REDEFINED.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed font-light">
            Upgrading India&#39;s premier solar energy engineering backbone with a{" "}
            <span className="text-white font-medium">Zero-Trust Subcontractor Gateway</span>, real-time CAD dispatching,
            and cryptographic geotagged proof-of-work compliance.
          </p>

          {/* Dual Enterprise CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            <Link
              href="/gateway"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#FFD23F] hover:bg-[#ffe17d] text-black font-bold text-base px-8 py-4 rounded-lg transition-all duration-300 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95"
            >
              <KeyRound className="w-5 h-5 text-black" />
              <span>Subcontractor Gateway</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-base px-8 py-4 rounded-lg border border-slate-700/80 hover:border-amber-500/40 transition-all duration-300 shadow-lg hover:scale-[1.02] active:scale-95"
            >
              <LayoutDashboard className="w-5 h-5 text-[#FFD23F]" />
              <span>Admin Control Plane</span>
            </Link>
          </div>

          {/* Quick Demo Assist Banner */}
          <div className="mt-12 p-4 rounded-lg glass-panel max-w-2xl mx-auto text-left border border-amber-500/30">
            <div className="flex items-center gap-2 text-xs font-mono text-[#FFD23F] uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Quick Test Credentials for Subcontractor Portal:</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 font-mono">
              <div>
                <span className="text-slate-500">Vendor Code:</span>{" "}
                <code className="text-[#FFD23F] font-bold bg-black/50 px-2 py-0.5 rounded border border-amber-500/20">
                  AKR-JOB-7K9M-SEC
                </code>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>{" "}
                <code className="text-slate-200 bg-black/50 px-2 py-0.5 rounded">
                  +91 98120 37550
                </code>
              </div>
              <div>
                <span className="text-slate-500">SMS OTP:</span>{" "}
                <code className="text-emerald-400 font-bold bg-black/50 px-2 py-0.5 rounded border border-emerald-500/20">
                  369369
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Architecture Pillars */}
      <section className="py-20 bg-[#080C14] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#FFD23F] mb-3">
              Mission-Critical Engineering
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for India&#39;s Utility-Scale Solar Grid
            </p>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Moving beyond static marketing to high-availability, serverless field workforce orchestration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-8 rounded-xl glass-card border border-slate-800 hover:border-amber-500/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#FFD23F] mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Zero-Trust Gateway
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Subcontractors access dispatches via a two-factor security barrier: Cryptographic Vendor Code validation
                paired with localized dynamic SMS OTP directly tied to their registered telecom number.
              </p>
              <div className="text-xs font-mono text-[#FFD23F] flex items-center gap-1">
                <span>Rate-limited anti-pumping protection</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-8 rounded-xl glass-card border border-slate-800 hover:border-amber-500/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#FFD23F] mb-6 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Geotagged Proof-of-Work
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Field technicians capture and transmit installation milestones with tamper-evident GPS coordinates,
                structural permits, and CAD schematic sign-offs securely stored with pre-signed S3 bucket URLs.
              </p>
              <div className="text-xs font-mono text-[#FFD23F] flex items-center gap-1">
                <span>Sub-meter GPS precision logging</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-8 rounded-xl glass-card border border-slate-800 hover:border-amber-500/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#FFD23F] mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                PostgreSQL RLS Governance
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Strict Row-Level Security ensures subcontractors never see projects outside their assigned jurisdiction,
                while an immutable audit ledger logs every vendor code generation, login, and upload.
              </p>
              <div className="text-xs font-mono text-[#FFD23F] flex items-center gap-1">
                <span>Complete audit trail traceability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Operational Metrics */}
      <section className="py-16 bg-[#06090e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-lg glass-card border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#FFD23F] font-mono">
                450+ MWp
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
                Solar Assets Under Dispatch
              </p>
            </div>

            <div className="p-6 rounded-lg glass-card border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                100%
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
                Geotagged Inspection Rate
              </p>
            </div>

            <div className="p-6 rounded-lg glass-card border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#FFD23F] font-mono">
                &lt; 30s
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
                DLT SMS OTP Latency
              </p>
            </div>

            <div className="p-6 rounded-lg glass-card border border-slate-800">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                ZERO
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">
                Unauthorized Breaches
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
