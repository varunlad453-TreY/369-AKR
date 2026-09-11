import Link from "next/link";
import {
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  FileCheck2,
  Lock,
  ArrowRight,
  PhoneCall,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sun,
  HardHat,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 text-slate-900 pb-16">
      {/* Top Welcome & Notification Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">369 AKR UNIVERSE</span>
            <span className="text-slate-400">•</span>
            <span>Solar EPC Field Operations &amp; Subcontractor Management</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 font-mono">
            <a
              href="tel:+919812037550"
              className="flex items-center gap-1.5 hover:text-slate-900 transition-colors font-sans text-xs font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              <span>Dispatch Helpline: <strong>+91 98120 37550</strong></span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Welcome Hero Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-10 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>Solar Project Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 font-sans">
              Welcome to 369 AKR UNIVERSE
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Official field operations portal for our solar installation partners, field engineers,
              and project managers. Access your assigned solar site blueprints, track milestone
              progress, and submit photo proof directly from the field.
            </p>
          </div>

          {/* Two Prominent Action Cards for Non-Tech Users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 pt-8 border-t border-slate-100">
            {/* Pathway 1: Subcontractor */}
            <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      I am a Solar Subcontractor / Engineer
                    </h2>
                    <p className="text-xs text-slate-500">Field installation partners &amp; supervisors</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Enter your assigned <strong>Vendor Code</strong> and quick mobile OTP to download electrical
                  single-line diagrams, review site addresses, and upload geotagged installation photos.
                </p>
              </div>

              <Link
                href="/gateway"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-3 rounded-md transition-colors w-full"
              >
                <span>Login to My Assigned Projects</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pathway 2: Management / Dispatch */}
            <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-white border border-slate-300 text-slate-800 flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      I am AKR Management / Dispatcher
                    </h2>
                    <p className="text-xs text-slate-500">Central operations &amp; project management</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  Login to dispatch new solar work orders, allocate capacity, monitor statewide
                  installation teams in real-time, and verify DISCOM commissioning certificates.
                </p>
              </div>

              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold px-4 py-3 rounded-md transition-colors w-full"
              >
                <span>Open Admin &amp; Dispatch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3-Step Simple Guide for Non-Tech Contractors */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mb-6">
            <h2 className="text-base font-bold text-slate-900">
              How Field Operations Work
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Three simple steps for our installation partners on site.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Get Your Vendor Code</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AKR Central Dispatch issues a unique Vendor Code (e.g. <code>AKR-1114</code>) for your assigned project.
              </p>
            </div>

            <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Receive Quick SMS OTP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your code and receive a 6-digit passcode on your registered mobile phone for instant, password-free login.
              </p>
            </div>

            <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Execute &amp; Upload Proof</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download CAD blueprints, update your job progress, and take rooftop site photos with automatic GPS verification.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Overview Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 p-4 rounded-lg">
            <div className="text-[11px] uppercase font-semibold text-slate-500">Total Solar Capacity</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">450+ MWp</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Utility-Scale &amp; Rooftop Projects</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg">
            <div className="text-[11px] uppercase font-semibold text-slate-500">Active Field Hubs</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">3 Regions</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Delhi-NCR, Rajasthan, Haryana</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg">
            <div className="text-[11px] uppercase font-semibold text-slate-500">Mobile Verification</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">Instant SMS</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Direct to Registered Supervisor</div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-lg">
            <div className="text-[11px] uppercase font-semibold text-slate-500">Rooftop Photos</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-1">GPS Verified</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Offline-Ready Photo Vault</div>
          </div>
        </div>

        {/* Quick Demo Test Accounts for Reviewers */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600" />
              <h2 className="text-xs font-mono font-bold uppercase text-slate-800">
                Evaluation Demo Accounts (One-Click Testing)
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">Pre-configured sample accounts to test the portal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Subcontractor Portal Credentials */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase font-sans">
                Sample Subcontractor Login:
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Vendor Code:</span>
                <code className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  AKR-1114
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Registered Phone:</span>
                <span className="text-slate-800">+91 95526 28232</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Demo SMS OTP:</span>
                <code className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  369369
                </code>
              </div>
              <div className="pt-1">
                <Link
                  href="/gateway"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-sans font-medium"
                >
                  <span>Click to test Subcontractor Login</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Admin Control Plane Credentials */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase font-sans">
                Sample Management Dispatcher Login:
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Email:</span>
                <code className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  dispatcher@369akruniverse.in
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Password:</span>
                <code className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Admin@369AKR!
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">Role Authority:</span>
                <span className="text-slate-800 font-semibold font-sans">Central Dispatcher</span>
              </div>
              <div className="pt-1">
                <Link
                  href="/admin"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-sans font-medium"
                >
                  <span>Click to test Admin Dashboard</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
