"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, PhoneCall, Copy, Check, ShieldAlert } from "lucide-react";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const [copied, setCopied] = useState(false);
  const incidentId = error.digest || `ERR-369-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  useEffect(() => {
    // Explicit Telemetry Logging for Route Errors
    logger.error(error, {
      context: "Next.js Route Error Boundary (src/app/error.tsx)",
      digest: error.digest,
      incidentId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [error, incidentId]);

  const handleCopyIncident = async () => {
    try {
      await navigator.clipboard.writeText(incidentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard write fallback
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        {/* Top Operational Status Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 shrink-0">
              <Image
                src="/images/logo/logo-icon.svg"
                alt="369 AKR UNIVERSE"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wider uppercase">
                369 AKR UNIVERSE
              </h2>
              <p className="text-[10px] text-solar-400 font-mono">
                SUBCONTRACTOR OPERATIONS PORTAL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-semibold text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CIRCUIT BREAKER</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-600 shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                System Degraded — Safe Interruption Active
              </h1>
              <p className="text-sm font-medium text-slate-700">
                System degraded. Our dispatch team has been notified.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-lg">
            Our API and state management layer has engaged a hardened fail-fast shield.
            To prevent silent memory desynchronization and protect billing ledgers during transient
            database degradation, this route was halted safely. All prior verified records remain secure.
          </p>

          {/* Incident Telemetry Card */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-lg space-y-3 font-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
              <span>TELEMETRY INCIDENT REPORT</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DISPATCH ALERTED
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="text-slate-400">Incident ID: </span>
                <span className="text-solar-400 font-semibold">{incidentId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyIncident}
                className="shrink-0 flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                title="Copy Incident ID"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 truncate">
              Timestamp: {new Date().toISOString()}
            </div>
          </div>

          {/* Interactive Recovery Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Route</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Gateway</span>
            </Link>
          </div>
        </div>

        {/* Support & Helpline Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
            <span>Solar EPC Field Dispatch Desk:</span>
            <a
              href="tel:+911800369767"
              className="font-semibold text-slate-700 hover:text-slate-900 hover:underline"
            >
              1800-369-SOLAR
            </a>
          </div>
          <span className="text-[11px] text-slate-400">
            Automated SRE Watchdog Active
          </span>
        </div>
      </div>
    </div>
  );
}
