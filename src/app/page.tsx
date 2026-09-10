import Link from "next/link";
import {
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  FileCheck2,
  Lock,
  ArrowRight,
  Database,
  Radio,
  Server,
  Building2,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 text-slate-900 pb-12">
      {/* Sub-Header / Breadcrumb Line */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <span>OPERATIONS</span>
            <span>/</span>
            <span className="font-semibold text-slate-900">CENTRAL COMMAND CENTER</span>
            <span>/</span>
            <span>DISPATCH ORCHESTRATION</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>CORE API HEALTHY</span>
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-slate-500">PostgreSQL RLS Active</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Command Center Title & Summary */}
        <div className="bg-white border border-slate-200 rounded p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                  SYSTEM VERSION 2.4.0
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  B2B INFRASTRUCTURE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
                Subcontractor Operations Portal (SOP)
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Centralized workforce orchestration plane for 369 AKR UNIVERSE engineering
                operations. Controls real-time work order dispatching, CAD single-line schematic
                distribution, and cryptographic GPS-verified proof-of-work compliance across India.
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 font-mono text-xs">
              <Link
                href="/gateway"
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Subcontractor Gateway</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>

              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-4 py-2.5 rounded border border-slate-300 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
                <span>Admin Control Plane</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500">Capacity Under Dispatch</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">450+ MWp</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Utility-Scale Solar EPC</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500">Security Governance</div>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">PostgreSQL RLS</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Zero-Trust Isolation</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500">Geotag Accuracy</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">±4.5m</div>
            <div className="text-[11px] text-slate-500 mt-0.5">High-Precision Satellite Fix</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded">
            <div className="text-[11px] font-mono uppercase text-slate-500">Audit Ledger Traceability</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">100%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Immutable Event Tracking</div>
          </div>
        </div>

        {/* Core Operations Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Module 1: Gateway */}
          <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
                    Subcontractor Auth Gateway
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Two-Factor Auth
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Field technicians log in with their registered 256-bit Vendor Code and receive a
                dynamic SMS OTP. Rate-limited and validated against live Supabase PostgreSQL.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Target: /gateway</span>
              <Link
                href="/gateway"
                className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span>Launch Gateway</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 2: Admin Plane */}
          <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
                    Admin Dispatch Plane
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Protected Admin
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Central dispatch monitoring, live subcontractor tracking, work order assignment,
                and vendor code regeneration with Edge Middleware session security.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Target: /admin</span>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span>Open Control Plane</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 3: Field Portal */}
          <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
                    Field Workforce Portal
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Offline Vault
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Review CAD single-line diagrams, advance installation milestones (Dispatched → En
                Route → On Site → In Progress → Commissioned), and upload geotagged proofs.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Target: /portal</span>
              <Link
                href="/portal"
                className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span>View Dispatches</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 4: Audit Ledger */}
          <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase font-mono">
                    Security Audit Ledger
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Compliance
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Tamper-evident system audit trail recording every authentication attempt, OTP
                generation, rate-limit violation, and proof-of-work upload.
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Target: /admin/audit-logs</span>
              <Link
                href="/admin/audit-logs"
                className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-slate-900 hover:text-blue-600 transition-colors"
              >
                <span>Inspect Audit Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Demo & Evaluation Credentials Box */}
        <div className="bg-white border border-slate-200 rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-mono font-bold uppercase text-slate-800">
              System Test Credentials (Pre-Configured)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Subcontractor Portal Credentials */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 uppercase">
                Subcontractor Portal Access
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vendor Code:</span>
                <code className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  AKR-JOB-7K9M-SEC
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registered Phone:</span>
                <span className="text-slate-800">+91 98120 37550</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Simulation OTP:</span>
                <code className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  369369
                </code>
              </div>
            </div>

            {/* Admin Control Plane Credentials */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 uppercase">
                Admin Control Plane Access
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <code className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  dispatcher@369akruniverse.in
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Password:</span>
                <code className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Admin@369AKR!
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Role Authority:</span>
                <span className="text-slate-800 font-semibold">Central Dispatcher (Superadmin)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
