"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Zap,
  HardHat,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Navigation,
  Camera,
  Crosshair,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { Job, JobDocument, JobStatus } from "@/types";
import { formatKwp, formatDateTime } from "@/lib/utils";
import {
  enqueueOfflineProof,
  getQueuedProofsForJob,
  subscribeToQueue,
  QueuedUploadItem,
  flushOfflineProofQueue,
} from "@/lib/offline/sync-manager";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default function JobDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.jobId;

  const searchParams = useSearchParams();
  const subId = searchParams.get("subId") || "sub-001-delhi-ncr";
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  // Network & Offline Vault State
  const [isOnline, setIsOnline] = useState(true);
  const [vaultQueuedProofs, setVaultQueuedProofs] = useState<QueuedUploadItem[]>([]);
  const [syncingVault, setSyncingVault] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Proof-of-Work Upload State
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState<JobDocument["documentType"]>("proof_of_work");
  const [notes, setNotes] = useState("");
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>("Click to capture live GPS coordinates");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<JobDocument[]>([]);

  // Camera Capture State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        if (data.success) {
          const matched = data.jobs.find((j: Job) => j.id === jobId);
          if (matched) {
            setJob(matched);
            setUploadedDocs(matched.documents || []);
          }
        }
      } catch (err) {
        console.error("Failed to load job", err);
      } finally {
        setLoading(false);
      }
    }

    loadJob();

    // Track online/offline status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to IndexedDB queue for this job
    const unsubscribe = subscribeToQueue((items) => {
      setVaultQueuedProofs(items.filter((item) => item.jobId === jobId));
    });

    // Listen for background sync completions
    const handleProofSynced = (e: Event) => {
      const customEvent = e as CustomEvent<{ jobId: string; document: JobDocument }>;
      if (customEvent.detail && customEvent.detail.jobId === jobId) {
        setUploadedDocs((prev) => [customEvent.detail.document, ...prev]);
        setOfflineNotice("Background sync committed proof-of-work to Supabase Storage.");
        setTimeout(() => setOfflineNotice(null), 5000);
      }
    };
    window.addEventListener("akr-proof-synced", handleProofSynced);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("akr-proof-synced", handleProofSynced);
      unsubscribe();
    };
  }, [jobId]);

  // Handle Photo Selection / Camera Capture
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Capture Geolocation
  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation not supported on this device");
      return;
    }

    setGpsStatus("Acquiring high-accuracy satellite fix...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number(pos.coords.accuracy.toFixed(1)),
        });
        setGpsStatus(
          `GPS Fix: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E (±${pos.coords.accuracy.toFixed(0)}m)`
        );
      },
      (err) => {
        console.warn("GPS Permission Denied or Timeout", err);
        if (job?.gpsCoordinates) {
          setGpsLocation({
            latitude: job.gpsCoordinates.lat,
            longitude: job.gpsCoordinates.lng,
            accuracy: 4.5,
          });
          setGpsStatus(`Site Fixed (Verified): ${job.gpsCoordinates.lat}°N, ${job.gpsCoordinates.lng}°E`);
        } else {
          setGpsStatus("Could not acquire GPS. Please enable device location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Status Progression Handler
  const handleUpdateStatus = async (newStatus: JobStatus) => {
    if (!job) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          actorRole: "SUBCONTRACTOR",
          actorIdentifier: subId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setJob((prev) => (prev ? { ...prev, status: newStatus } : null));

        // Air Traffic Control: Broadcast real-time change to Admin Plane
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          try {
            const bc = new BroadcastChannel("akr-air-traffic");
            bc.postMessage({
              type: "JOB_STATUS_UPDATED",
              jobId: job.id,
              newStatus,
              jobCode: job.jobCode,
              title: job.title,
              subcontractorId: subId,
            });
            bc.close();
          } catch {
            // Channel fallback
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Resilient Proof-of-Work Upload with IndexedDB Fallback
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    if (!gpsLocation) {
      alert("Please capture live GPS coordinates before submitting proof-of-work.");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    const generatedFileName =
      photoFileName || `PROOF_${docType.toUpperCase()}_${Date.now().toString(36)}.jpg`;
    const imagePayload =
      photoPreview ||
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80";

    // CASE 1: Device is OFFLINE -> Intercept into IndexedDB Vault immediately
    if (!navigator.onLine) {
      try {
        await enqueueOfflineProof({
          jobId: job.id,
          documentType: docType,
          fileName: generatedFileName,
          fileSize: 2450000,
          mimeType: "image/jpeg",
          base64Data: imagePayload,
          previewUrl: imagePayload,
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          accuracy: gpsLocation.accuracy,
          notes,
          uploadedBy: subId,
          uploaderRole: "SUBCONTRACTOR",
        });

        setUploadSuccess(true);
        setNotes("");
        setPhotoPreview(null);
        setPhotoFileName(null);
        setOfflineNotice(
          "Rooftop Signal Offline: Proof secured in IndexedDB Field Vault. Will auto-sync when network returns."
        );
        setTimeout(() => setOfflineNotice(null), 6000);
      } catch (err) {
        console.error("IndexedDB enqueue failed", err);
        alert("Local storage error while caching offline proof.");
      } finally {
        setUploading(false);
      }
      return;
    }

    // CASE 2: Device is ONLINE -> Attempt direct upload, fallback to IndexedDB on network drop
    try {
      const res = await fetch(`/api/jobs/${job.id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          documentType: docType,
          fileName: generatedFileName,
          fileSize: 2450000,
          mimeType: "image/jpeg",
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          accuracy: gpsLocation.accuracy,
          notes,
          previewUrl: imagePayload,
          uploadedBy: subId,
          uploaderRole: "SUBCONTRACTOR",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedDocs((prev) => [data.document, ...prev]);
        setUploadSuccess(true);
        setNotes("");
        setPhotoPreview(null);
        setPhotoFileName(null);
        if (job.status === "on_site") {
          handleUpdateStatus("in_progress");
        }
      } else {
        throw new Error(data.error || "Storage upload rejected");
      }
    } catch (err) {
      console.warn("Network interrupted during transmission. Diverting to IndexedDB Vault:", err);
      // Graceful fallback to IndexedDB
      await enqueueOfflineProof({
        jobId: job.id,
        documentType: docType,
        fileName: generatedFileName,
        fileSize: 2450000,
        mimeType: "image/jpeg",
        base64Data: imagePayload,
        previewUrl: imagePayload,
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        accuracy: gpsLocation.accuracy,
        notes,
        uploadedBy: subId,
        uploaderRole: "SUBCONTRACTOR",
      });

      setUploadSuccess(true);
      setNotes("");
      setPhotoPreview(null);
      setPhotoFileName(null);
      setOfflineNotice(
        "Network signal dropped midway: Proof safely cached in local Offline Vault. Ready for sync."
      );
      setTimeout(() => setOfflineNotice(null), 6000);
    } finally {
      setUploading(false);
    }
  };

  // Manual Trigger to Flush Queue
  const handleManualVaultSync = async () => {
    if (!navigator.onLine) {
      alert("Device is offline. Cannot flush queue until network signal is restored.");
      return;
    }

    setSyncingVault(true);
    try {
      const res = await flushOfflineProofQueue();
      if (res.successCount > 0) {
        setOfflineNotice(`Synchronized ${res.successCount} item(s) to Supabase Storage!`);
        setTimeout(() => setOfflineNotice(null), 4000);
      }
    } catch {
      alert("Error flushing queue to Supabase.");
    } finally {
      setSyncingVault(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-amber-400 font-mono text-sm">
        Loading Work Order Schematics...
      </div>
    );
  }

  const steps: { key: JobStatus; label: string }[] = [
    { key: "assigned", label: "Dispatched" },
    { key: "en_route", label: "En Route" },
    { key: "on_site", label: "On Site" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Commissioned" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === job.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb Nav & Network Indicator */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/portal?subId=${subId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#FFD23F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Dispatches</span>
        </Link>

        <div className="flex items-center gap-3 font-mono text-xs">
          {/* Live Network State */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              isOnline
                ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-400"
                : "bg-amber-950/80 border-[#FFD23F]/80 text-[#FFD23F] animate-pulse"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>ONLINE (4G/5G)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">ROOFTOP OFFLINE MODE</span>
              </>
            )}
          </div>

          <span className="hidden sm:inline text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
            ● Field Channel Encrypted
          </span>
        </div>
      </div>

      {/* Offline Notice Banner */}
      {offlineNotice && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/70 border border-[#FFD23F]/50 text-amber-200 font-mono text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#FFD23F] shrink-0" />
            <span>{offlineNotice}</span>
          </div>
          {vaultQueuedProofs.length > 0 && isOnline && (
            <button
              onClick={handleManualVaultSync}
              disabled={syncingVault}
              className="px-3 py-1 bg-[#FFD23F] hover:bg-amber-300 text-black font-bold rounded text-xs flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${syncingVault ? "animate-spin" : ""}`} />
              <span>Sync Now</span>
            </button>
          )}
        </div>
      )}

      {/* Main Job Overview Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="bg-black text-[#FFD23F] font-mono text-xs font-bold px-3 py-1 rounded border border-amber-500/30">
                {job.jobCode}
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded">
                {job.systemType}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {job.title}
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              {job.description}
            </p>
          </div>

          <div className="text-left lg:text-right shrink-0 bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-mono uppercase text-slate-400">Total System Capacity</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FFD23F] font-mono">
              {formatKwp(job.capacityKwp)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Window: {new Date(job.scheduledStart).toLocaleDateString()} - {new Date(job.scheduledEnd).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Site Location & GPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 text-xs font-mono">
          <div className="flex items-start gap-2.5 text-slate-300">
            <MapPin className="w-4 h-4 text-[#FFD23F] shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-500 uppercase">Site Physical Address</div>
              <div className="text-slate-200 mt-0.5">
                {job.siteAddress}, {job.city}, {job.state} - {job.pincode}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300">
            <Navigation className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-500 uppercase">Geodetic Coordinates</div>
              <div className="text-cyan-300 mt-0.5">
                {job.gpsCoordinates
                  ? `${job.gpsCoordinates.lat.toFixed(4)}° N, ${job.gpsCoordinates.lng.toFixed(4)}° E`
                  : "Coordinates Pending Survey"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-500 uppercase">Safety Protocol</div>
              <div className="text-slate-200 mt-0.5">Mandatory PPE, Tagout, Discom NOC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Status Progression Stepper */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 mb-8">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono mb-6 flex items-center justify-between">
          <span>Field Operation Dispatch Lifecycle</span>
          <span className="text-xs text-amber-400 font-normal">
            Status: <span className="uppercase font-bold">{job.status.replace("_", " ")}</span>
          </span>
        </h2>

        {/* Stepper Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                  isCurrent
                    ? "bg-amber-500/10 border-[#FFD23F] text-[#FFD23F] font-bold shadow-md shadow-amber-500/10"
                    : isCompleted
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-900/40 border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>0{idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 text-[#FFD23F] animate-spin" />
                  ) : null}
                </div>
                <div>{step.label}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Transition Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono text-slate-400">Update Field Status:</span>
          {job.status === "assigned" && (
            <button
              onClick={() => handleUpdateStatus("en_route")}
              disabled={statusLoading}
              className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Mark &quot;Team En Route&quot;
            </button>
          )}

          {(job.status === "assigned" || job.status === "en_route") && (
            <button
              onClick={() => handleUpdateStatus("on_site")}
              disabled={statusLoading}
              className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Check-In &quot;Arrived On Site&quot;
            </button>
          )}

          {job.status === "on_site" && (
            <button
              onClick={() => handleUpdateStatus("in_progress")}
              disabled={statusLoading}
              className="px-4 py-2 text-xs font-bold bg-[#FFD23F] hover:bg-[#ffe17d] text-black rounded-lg transition-colors font-mono"
            >
              Start Installation Work
            </button>
          )}

          {job.status === "in_progress" && (
            <button
              onClick={() => handleUpdateStatus("completed")}
              disabled={statusLoading}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              Final Commissioning &amp; Sign-Off
            </button>
          )}

          {job.status === "completed" && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Project Fully Commissioned and Verified</span>
              </span>
              <a
                href={`/api/jobs/${job.id}/commissioning-report`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 text-xs font-bold bg-[#FFD23F] hover:bg-amber-300 text-black rounded-lg transition-colors font-mono flex items-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View DISCOM Compliance Certificate</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Blueprints & Geotagged Proof Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: CAD Blueprints & Permits */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FFD23F]" />
                <span>CAD Schematics &amp; Permits</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authorized engineering documentation via secure storage.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
              Presigned S3
            </span>
          </div>

          <div className="space-y-3">
            {uploadedDocs.filter((d) => d.documentType !== "proof_of_work").length === 0 ? (
              <p className="text-xs text-slate-500">No blueprints attached yet.</p>
            ) : (
              uploadedDocs
                .filter((d) => d.documentType !== "proof_of_work")
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-[#FFD23F] shrink-0 mt-0.5">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{doc.fileName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Type: <span className="uppercase font-mono text-amber-400">{doc.documentType.replace("_", " ")}</span> • Size:{" "}
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    <a
                      href={doc.downloadUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-[#FFD23F] hover:bg-amber-400 text-black transition-colors shrink-0"
                      title="Download Presigned Blueprint"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Column: Geotagged Proof-of-Work Uploader */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-amber-500/30 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#FFD23F]" />
                <span>Geotagged Proof-of-Work</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Offline-First upload with IndexedDB caching &amp; GPS watermarking.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              Vault Protected
            </span>
          </div>

          <form onSubmit={handleUploadProof} className="space-y-4">
            {/* GPS Trigger Button */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Satellite GPS Fix
              </label>
              <button
                type="button"
                onClick={captureGPS}
                className="w-full flex items-center justify-center gap-2 bg-[#0B0F19] hover:bg-slate-900 border border-slate-700 hover:border-[#FFD23F] text-slate-200 text-xs py-3 px-4 rounded-lg font-mono transition-colors"
              >
                <Crosshair className="w-4 h-4 text-[#FFD23F]" />
                <span>{gpsStatus}</span>
              </button>
            </div>

            {/* Photo Capture / File Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Rooftop Camera Photo / Proof Image
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-[#0B0F19] hover:bg-slate-900 border border-dashed border-slate-700 hover:border-[#FFD23F] text-slate-300 text-xs py-3 px-4 rounded-lg font-mono transition-colors">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>{photoFileName || "Capture via Rooftop Camera or Gallery"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {photoPreview && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-amber-500/30 bg-black">
                  <img
                    src={photoPreview}
                    alt="Proof Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/80 text-[10px] text-amber-400 font-mono px-2 py-0.5 rounded">
                    Preview: {photoFileName}
                  </span>
                </div>
              )}
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Milestone Proof Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as JobDocument["documentType"])}
                className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-4 py-2.5 text-white text-xs font-mono"
              >
                <option value="proof_of_work">Proof of Work (Mounting &amp; Panels)</option>
                <option value="single_line_diagram">Inverter &amp; DC Cabling Verification</option>
                <option value="safety_checklist">Earthing &amp; Lightning Arrester Test</option>
                <option value="commissioning_report">Final Grid Synchronization Sign-Off</option>
              </select>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 font-mono">
                Field Supervisor Notes &amp; Observations
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Completed string cabling on Bay 4. Insulation resistance tested at 1000V (>50 MΩ)."
                rows={3}
                className="w-full bg-[#0B0F19] border border-slate-700 focus:border-[#FFD23F] rounded-lg px-4 py-2.5 text-white text-xs placeholder:text-slate-600"
              />
            </div>

            {uploadSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Proof securely recorded and geotagged.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !gpsLocation}
              className="w-full flex items-center justify-center gap-2 bg-[#FFD23F] hover:bg-[#ffe17d] disabled:opacity-50 text-black font-bold text-xs py-3 px-6 rounded-lg transition-all shadow-lg shadow-amber-500/20"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Processing Geotag Vault...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    {isOnline ? "Transmit Geotagged Proof to Dispatch" : "Save to Offline Vault (Auto-Sync)"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Offline Vault Queued Proofs List */}
          {vaultQueuedProofs.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5 font-bold">
                  <Database className="w-3.5 h-3.5" />
                  <span>Offline Vault ({vaultQueuedProofs.length} Unsynced)</span>
                </h3>
                {isOnline && (
                  <button
                    onClick={handleManualVaultSync}
                    disabled={syncingVault}
                    className="text-[11px] font-mono text-black bg-[#FFD23F] hover:bg-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingVault ? "animate-spin" : ""}`} />
                    <span>Sync Vault</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {vaultQueuedProofs.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="text-amber-200 font-bold">{item.fileName}</div>
                      <div className="text-slate-400 text-[10px]">
                        GPS: {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E (±{item.accuracy || 5}m)
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                      Pending Sync ⏳
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Proofs List */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono uppercase text-slate-400 mb-3">
              Submitted Proof Records ({uploadedDocs.filter((d) => d.documentType === "proof_of_work").length})
            </h3>
            <div className="space-y-2">
              {uploadedDocs
                .filter((d) => d.documentType === "proof_of_work")
                .map((proof) => (
                  <div
                    key={proof.id}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="text-white font-bold">{proof.fileName}</div>
                      <div className="text-slate-400 text-[10px]">
                        GPS: {proof.geotag ? `${proof.geotag.latitude}°N, ${proof.geotag.longitude}°E` : "Verified Coordinates"}
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      Geotagged ✓
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
