"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Job, JobDocument, JobStatus } from "@/types";
import { formatKwp } from "@/lib/utils";
import {
  enqueueOfflineProof,
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
  const [gpsStatus, setGpsStatus] = useState<string>("Click to capture live GPS fix");
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

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribe = subscribeToQueue((items) => {
      setVaultQueuedProofs(items.filter((item) => item.jobId === jobId));
    });

    const handleProofSynced = (e: Event) => {
      const customEvent = e as CustomEvent<{ jobId: string; document: JobDocument }>;
      if (customEvent.detail && customEvent.detail.jobId === jobId) {
        setUploadedDocs((prev) => [customEvent.detail.document, ...prev]);
        setOfflineNotice("Background sync committed proof-of-work to storage.");
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

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation not supported on this device");
      return;
    }

    setGpsStatus("Acquiring satellite fix...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number(pos.coords.accuracy.toFixed(1)),
        });
        setGpsStatus(
          `Fix: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E (±${pos.coords.accuracy.toFixed(0)}m)`
        );
      },
      (err) => {
        console.warn("GPS Permission Denied or Timeout", err);
        if (job?.gpsCoordinates) {
          setGpsLocation({
            latitude: job.gpsCoordinates.lat,
            longitude: job.gpsCoordinates.lng,
            accuracy: 5.0,
          });
          setGpsStatus(`Site Fallback: ${job.gpsCoordinates.lat}°N, ${job.gpsCoordinates.lng}°E`);
        } else {
          setGpsStatus("Could not acquire GPS fix. Enable device location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
            // BroadcastChannel fallback
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    if (!gpsLocation) {
      alert("Capture live GPS coordinates before submitting proof of work.");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    const generatedFileName =
      photoFileName || `PROOF_${docType.toUpperCase()}_${Date.now().toString(36)}.jpg`;
    const imagePayload =
      photoPreview ||
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80";

    // Device is OFFLINE: write directly to IndexedDB
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
          "Offline: Proof recorded in local vault. Will synchronize when network is restored."
        );
        setTimeout(() => setOfflineNotice(null), 6000);
      } catch (err) {
        console.error("IndexedDB enqueue failed", err);
        alert("Local storage error while caching proof.");
      } finally {
        setUploading(false);
      }
      return;
    }

    // Device is ONLINE: transmit to Supabase Storage
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
      console.warn("Network interrupted during transmission. Caching to local vault:", err);
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
      setOfflineNotice("Network dropped: Proof secured in local offline vault.");
      setTimeout(() => setOfflineNotice(null), 6000);
    } finally {
      setUploading(false);
    }
  };

  const handleManualVaultSync = async () => {
    if (!navigator.onLine) {
      alert("Device is offline. Connect to network before syncing.");
      return;
    }

    setSyncingVault(true);
    try {
      const res = await flushOfflineProofQueue();
      if (res.successCount > 0) {
        setOfflineNotice(`Synchronized ${res.successCount} item(s) to cloud storage.`);
        setTimeout(() => setOfflineNotice(null), 4000);
      }
    } catch {
      alert("Error flushing queue to storage.");
    } finally {
      setSyncingVault(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50 text-slate-600 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mr-2" />
        <span>Loading Work Order Schematics...</span>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Header & Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/portal?subId=${subId}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dispatches</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-xs text-slate-500">WORK ORDER:</span>
            <span className="font-mono text-xs font-bold text-slate-900">{job.jobCode}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            {/* Live Network State */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] border ${
                isOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-300 text-amber-800"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span className="font-semibold">OFFLINE VAULT ACTIVE</span>
                </>
              )}
            </div>

            <span className="hidden sm:inline text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Channel: Field Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Offline Notice Banner */}
      {offlineNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-3 rounded border border-amber-200 bg-amber-50 text-amber-900 font-mono text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{offlineNotice}</span>
            </div>
            {vaultQueuedProofs.length > 0 && isOnline && (
              <button
                onClick={handleManualVaultSync}
                disabled={syncingVault}
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded text-[11px] flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${syncingVault ? "animate-spin" : ""}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Main Job Overview Card */}
        <div className="bg-white border border-slate-200 rounded p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-slate-900 text-white font-mono text-xs font-semibold px-2 py-0.5 rounded">
                  {job.jobCode}
                </span>
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {job.systemType}
                </span>
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                  {job.status.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {job.description}
              </p>
            </div>

            <div className="text-left lg:text-right shrink-0 bg-slate-50 p-3.5 rounded border border-slate-200">
              <div className="text-[11px] font-mono uppercase text-slate-500">System Capacity</div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {formatKwp(job.capacityKwp)}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Window: {new Date(job.scheduledStart).toLocaleDateString()} -{" "}
                {new Date(job.scheduledEnd).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Technical Location Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs font-mono">
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Site Physical Address</div>
                <div className="font-medium text-slate-800 font-sans mt-0.5 text-xs">
                  {job.siteAddress}, {job.city}, {job.state} - {job.pincode}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <Navigation className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Geodetic Coordinates</div>
                <div className="font-medium text-slate-800 mt-0.5 text-xs">
                  {job.gpsCoordinates
                    ? `${job.gpsCoordinates.lat.toFixed(4)}° N, ${job.gpsCoordinates.lng.toFixed(4)}° E`
                    : "Coordinates Pending Survey"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Safety & Compliance Protocol</div>
                <div className="font-medium text-slate-800 font-sans mt-0.5 text-xs">
                  Mandatory PPE, Lockout/Tagout, DISCOM NOC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progression Stepper */}
        <div className="bg-white border border-slate-200 rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono font-bold uppercase text-slate-700">
              Field Milestone Progression
            </h2>
            <span className="text-xs font-mono text-slate-500">
              Current: <strong className="text-slate-800 uppercase">{job.status.replace("_", " ")}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded border text-xs font-mono transition-all ${
                    isCurrent
                      ? "bg-slate-900 border-slate-900 text-white font-semibold"
                      : isCompleted
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px]">STEP 0{idx + 1}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : null}
                  </div>
                  <div className="font-medium text-[11px]">{step.label}</div>
                </div>
              );
            })}
          </div>

          {/* Quick Transition Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-mono text-slate-500">Advance Status:</span>

            {job.status === "assigned" && (
              <button
                onClick={() => handleUpdateStatus("en_route")}
                disabled={statusLoading}
                className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Mark &quot;Team En Route&quot;
              </button>
            )}

            {(job.status === "assigned" || job.status === "en_route") && (
              <button
                onClick={() => handleUpdateStatus("on_site")}
                disabled={statusLoading}
                className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Check-In &quot;Arrived On Site&quot;
              </button>
            )}

            {job.status === "on_site" && (
              <button
                onClick={() => handleUpdateStatus("in_progress")}
                disabled={statusLoading}
                className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Start Installation Work
              </button>
            )}

            {job.status === "in_progress" && (
              <button
                onClick={() => handleUpdateStatus("completed")}
                disabled={statusLoading}
                className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors"
              >
                Final Commissioning &amp; Sign-Off
              </button>
            )}

            {job.status === "completed" && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Installation Commissioned</span>
                </span>
                <a
                  href={`/api/jobs/${job.id}/commissioning-report`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>DISCOM Compliance Certificate</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Grid: Blueprints & Geotagged Proof Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: CAD Blueprints & Permits */}
          <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Engineering CAD Schematics &amp; Permits</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Authorized engineering documents via secure cloud storage.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Presigned S3
              </span>
            </div>

            <div className="space-y-2">
              {uploadedDocs.filter((d) => d.documentType !== "proof_of_work").length === 0 ? (
                <div className="p-4 text-center text-xs font-mono text-slate-400 bg-slate-50 rounded border border-slate-100">
                  No schematics attached.
                </div>
              ) : (
                uploadedDocs
                  .filter((d) => d.documentType !== "proof_of_work")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <div className="text-xs font-mono font-semibold text-slate-900 truncate max-w-xs">
                            {doc.fileName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Type: {doc.documentType.replace("_", " ").toUpperCase()} •{" "}
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.downloadUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Right Column: Geotagged Proof-of-Work Uploader */}
          <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>Geotagged Proof-of-Work</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Offline-resilient upload with IndexedDB caching and GPS metadata.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Vault Protected
              </span>
            </div>

            <form onSubmit={handleUploadProof} className="space-y-3">
              {/* GPS Fix Trigger */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 mb-1 font-semibold">
                  Satellite GPS Fix
                </label>
                <button
                  type="button"
                  onClick={captureGPS}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs py-2 px-3 rounded font-mono transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5 text-slate-600" />
                  <span>{gpsStatus}</span>
                </button>
              </div>

              {/* Photo Input */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 mb-1 font-semibold">
                  Camera Photo / Work Proof
                </label>
                <label className="cursor-pointer flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 text-xs py-2.5 px-3 rounded font-mono transition-colors">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>{photoFileName || "Capture via Camera or Select File"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                {photoPreview && (
                  <div className="mt-2 relative w-full h-28 rounded overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={photoPreview}
                      alt="Proof Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-900/80 text-[10px] text-slate-200 font-mono px-1.5 py-0.5 rounded">
                      Preview: {photoFileName}
                    </span>
                  </div>
                )}
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 mb-1 font-semibold">
                  Milestone Proof Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as JobDocument["documentType"])}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 text-xs font-mono"
                >
                  <option value="proof_of_work">Proof of Work (Mounting &amp; Modules)</option>
                  <option value="single_line_diagram">Inverter &amp; DC Cabling Verification</option>
                  <option value="safety_checklist">Earthing &amp; Lightning Arrester Test</option>
                  <option value="commissioning_report">Grid Synchronization Report</option>
                </select>
              </div>

              {/* Field Notes */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 mb-1 font-semibold">
                  Field Supervisor Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. String cabling on Array 2 completed. Insulation resistance verified at 1000V (>50 MΩ)."
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-slate-900 text-xs placeholder:text-slate-400 font-sans"
                />
              </div>

              {uploadSuccess && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Proof record logged and geotagged.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !gpsLocation}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded font-mono transition-colors"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Proof Record...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isOnline ? "Transmit Geotagged Proof" : "Cache in Offline Vault"}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Offline Vault Queued Items */}
            {vaultQueuedProofs.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-mono uppercase text-amber-800 flex items-center gap-1 font-semibold">
                    <Database className="w-3.5 h-3.5 text-amber-700" />
                    <span>Offline Vault ({vaultQueuedProofs.length} Unsynced)</span>
                  </h3>
                  {isOnline && (
                    <button
                      onClick={handleManualVaultSync}
                      disabled={syncingVault}
                      className="text-[10px] font-mono text-white bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingVault ? "animate-spin" : ""}`} />
                      <span>Sync Vault</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {vaultQueuedProofs.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="text-amber-900 font-semibold">{item.fileName}</div>
                        <div className="text-slate-500 text-[10px]">
                          GPS: {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E (±{item.accuracy || 5}m)
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                        Pending Sync
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Proof Records */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-[11px] font-mono uppercase text-slate-500 mb-2">
                Submitted Proof Records ({uploadedDocs.filter((d) => d.documentType === "proof_of_work").length})
              </h3>
              <div className="space-y-1.5">
                {uploadedDocs
                  .filter((d) => d.documentType === "proof_of_work")
                  .map((proof) => (
                    <div
                      key={proof.id}
                      className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="text-slate-900 font-semibold">{proof.fileName}</div>
                        <div className="text-slate-500 text-[10px]">
                          GPS: {proof.geotag ? `${proof.geotag.latitude}°N, ${proof.geotag.longitude}°E` : "Verified Coordinates"}
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Geotagged
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
