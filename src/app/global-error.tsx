"use client";

import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [copied, setCopied] = useState(false);
  const incidentId = error.digest || `FATAL-369-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  useEffect(() => {
    // Explicit Telemetry Logging for Root Layout Crashes
    logger.error(error, {
      context: "Next.js Root Global Error Boundary (src/app/global-error.tsx)",
      digest: error.digest,
      incidentId,
      isFatal: true,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  }, [error, incidentId]);

  const handleCopyIncident = async () => {
    try {
      await navigator.clipboard.writeText(incidentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>System Degraded | 369 AKR UNIVERSE</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0B0F19;
            color: #F8FAFC;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .card {
            background-color: #131D31;
            border: 1px solid #1E293B;
            border-radius: 0.75rem;
            max-width: 38rem;
            width: 100%;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .header {
            background-color: #06090E;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1E293B;
          }
          .brand-title {
            font-size: 0.75rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            color: #FFD23F;
            text-transform: uppercase;
          }
          .brand-sub {
            font-size: 0.625rem;
            color: #94A3B8;
            font-family: monospace;
          }
          .badge {
            background-color: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #F87171;
            font-size: 0.6875rem;
            font-weight: 700;
            padding: 0.25rem 0.625rem;
            border-radius: 0.25rem;
            text-transform: uppercase;
          }
          .content {
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          .title-group h1 {
            font-size: 1.25rem;
            font-weight: 700;
            color: #FFFFFF;
            line-height: 1.3;
          }
          .title-group p {
            font-size: 0.875rem;
            color: #FFD23F;
            font-weight: 500;
            margin-top: 0.35rem;
          }
          .desc {
            font-size: 0.8125rem;
            color: #94A3B8;
            line-height: 1.6;
            background-color: #0B0F19;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #1E293B;
          }
          .incident-box {
            background-color: #06090E;
            border: 1px solid #1E293B;
            border-radius: 0.5rem;
            padding: 0.875rem 1rem;
            font-family: monospace;
            font-size: 0.75rem;
            color: #CBD5E1;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .incident-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .btn-copy {
            background-color: #1E293B;
            border: none;
            color: #E2E8F0;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 0.6875rem;
            font-family: inherit;
          }
          .btn-copy:hover {
            background-color: #334155;
          }
          .button-group {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 0.5rem;
          }
          .btn-primary {
            flex: 1;
            min-width: 140px;
            background-color: #FFD23F;
            color: #0B0F19;
            font-weight: 700;
            font-size: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            text-align: center;
            transition: opacity 0.2s;
          }
          .btn-primary:hover {
            opacity: 0.9;
          }
          .btn-secondary {
            flex: 1;
            min-width: 140px;
            background-color: transparent;
            color: #E2E8F0;
            font-weight: 600;
            font-size: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid #334155;
            cursor: pointer;
            text-align: center;
          }
          .btn-secondary:hover {
            background-color: #1E293B;
          }
          .footer {
            background-color: #06090E;
            padding: 0.75rem 1.5rem;
            border-top: 1px solid #1E293B;
            font-size: 0.75rem;
            color: #64748B;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .footer a {
            color: #FFD23F;
            text-decoration: none;
            font-weight: 600;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          {/* Header */}
          <div className="header">
            <div>
              <div className="brand-title">369 AKR UNIVERSE</div>
              <div className="brand-sub">ROOT SYSTEM ISOLATION MONITOR</div>
            </div>
            <div className="badge">ROOT RECOVERY</div>
          </div>

          {/* Content */}
          <div className="content">
            <div className="title-group">
              <h1>Solar Infrastructure Operations Gateway</h1>
              <p>System degraded. Our dispatch team has been notified.</p>
            </div>

            <div className="desc">
              The root application context encountered an unrecoverable rendering boundary.
              To safeguard financial and operational data from corrupting client state during transient Supabase degradation,
              the application safely stopped rendering. Field engineers and subcontractors can trigger a clean recovery below.
            </div>

            {/* Telemetry Incident Information */}
            <div className="incident-box">
              <div className="incident-row">
                <span>INCIDENT HASH: <strong style={{ color: "#FFD23F" }}>{incidentId}</strong></span>
                <button type="button" className="btn-copy" onClick={handleCopyIncident}>
                  {copied ? "COPIED" : "COPY ID"}
                </button>
              </div>
              <div style={{ color: "#64748B", fontSize: "0.6875rem" }}>
                DISPATCH STATUS: TELEMETRY DISPATCHED TO SRE ON-CALL
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="button-group">
              <button type="button" className="btn-primary" onClick={() => reset()}>
                Attempt System Recovery
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/";
                  }
                }}
              >
                Hard Refresh to Gateway
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <span>Solar EPC Field Dispatch Desk</span>
            <span>Emergency Helpline: <a href="tel:+911800369767">1800-369-SOLAR</a></span>
          </div>
        </div>
      </body>
    </html>
  );
}
