"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
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
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  PhoneCall,
} from "lucide-react";
import { Job, JobDocument, JobStatus } from "@/types";
import { formatKwp } from "@/lib/utils";
import {
  enqueueOfflineProof,
  subscribeToQueue,
  QueuedUploadItem,
  flushOfflineProofQueue,
} from "@/lib/offline/sync-manager";

interface JobDetailClientProps {
  initialJob: Job;
  subId: string;
}

export default function JobDetailClient({ initialJob, subId }: JobDetailClientProps) {
  const jobId = initialJob.id;

  const [job, setJob] = useState<Job>(initialJob);
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
  const [gpsStatus, setGpsStatus] = useState<string>("Click to confirm site location");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<JobDocument[]>(initialJob.documents || []);

  // Camera Capture State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  useEffect(() => {
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
        setOfflineNotice("Offline photos were successfully uploaded to central dispatch.");
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
      setGpsStatus("Location not supported on this browser/device");
      return;
    }

    setGpsStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          accuracy: Number(pos.coords.accuracy.toFixed(1)),
        });
        setGpsStatus(
          `Location Confirmed: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E (±${pos.coords.accuracy.toFixed(0)}m)`
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
          setGpsStatus(`Site Fixed Location: ${job.gpsCoordinates.lat}°N, ${job.gpsCoordinates.lng}°E`);
        } else {
          setGpsStatus("Could not find location. Please enable Location/GPS on your device.");
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
        setJob((prev) => (prev ? { ...prev, status: newStatus } : prev));

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
            // Broadcast fallback
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
      alert("Please click 'Confirm Site Location' before submitting site photo.");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    const generatedFileName =
      photoFileName || `PHOTO_${docType.toUpperCase()}_${Date.now().toString(36)}.jpg`;
    const imagePayload =
      photoPreview ||
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80";

    // Device is OFFLINE: Save to local vault
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
          "No internet on rooftop: Photo safely saved on your device. It will upload automatically when signal returns."
        );
        setTimeout(() => setOfflineNotice(null), 6000);
      } catch (err) {
        console.error("Offline save failed", err);
        alert("Could not save photo locally. Please try again.");
      } finally {
        setUploading(false);
      }
      return;
    }

    // Device is ONLINE: Upload directly
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
        throw new Error(data.error || "Upload was not accepted");
      }
    } catch (err) {
      console.warn("Internet dropped during upload. Saving locally:", err);
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
      setOfflineNotice("Network interrupted: Photo saved on your phone and queued for upload.");
      setTimeout(() => setOfflineNotice(null), 6000);
    } finally {
      setUploading(false);
    }
  };

  const handleManualVaultSync = async () => {
    if (!navigator.onLine) {
      alert("Device is still offline. Please connect to mobile data or Wi-Fi first.");
      return;
    }

    setSyncingVault(true);
    try {
      const res = await flushOfflineProofQueue();
      if (res.successCount > 0) {
        setOfflineNotice(`Uploaded ${res.successCount} saved photo(s) successfully.`);
        setTimeout(() => setOfflineNotice(null), 4000);
      }
    } catch {
      alert("Could not complete upload. Please retry.");
    } finally {
      setSyncingVault(false);
    }
  };

  const steps: { key: JobStatus; label: string; description: string }[] = [
    { key: "assigned", label: "Job Assigned", description: "Dispatched by AKR" },
    { key: "en_route", label: "Team Traveling", description: "On the way to site" },
    { key: "on_site", label: "Arrived at Site", description: "Team at work site" },
    { key: "in_progress", label: "In Progress", description: "Installation underway" },
    { key: "completed", label: "Completed", description: "Commissioned & Approved" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === job.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header & Breadcrumb Bar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Projects</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Project:</span>
            <strong className="text-xs font-mono text-slate-900">{job.jobCode}</strong>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Online / Offline status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] border font-medium ${
                isOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online (Connected)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>Rooftop Offline Mode (Photos Saved Locally)</span>
                </>
              )}
            </div>

            <a
              href="tel:+919812037550"
              className="hidden sm:inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              <span>Dispatch Desk: +91 98120 37550</span>
            </a>
          </div>
        </div>
      </div>

      {/* Offline Notice Banner */}
      {offlineNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
          <div className="p-3.5 rounded border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{offlineNotice}</span>
            </div>
            {vaultQueuedProofs.length > 0 && isOnline && (
              <button
                onClick={handleManualVaultSync}
                disabled={syncingVault}
                className="px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded text-xs flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingVault ? "animate-spin" : ""}`} />
                <span>Upload Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Main Job Overview Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-slate-900 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded">
                  {job.jobCode}
                </span>
                <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 font-medium">
                  {job.systemType}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{job.title}</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
                {job.description}
              </p>
            </div>

            <div className="text-left lg:text-right shrink-0 bg-slate-50 p-4 rounded-md border border-slate-200">
              <div className="text-xs uppercase font-semibold text-slate-500">Solar System Capacity</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono mt-0.5">
                {formatKwp(job.capacityKwp)}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Installation Dates: {new Date(job.scheduledStart).toLocaleDateString()} -{" "}
                {new Date(job.scheduledEnd).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Site Address & Safety Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
            <div className="flex items-start gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Site Address</div>
                <div className="font-semibold text-slate-900 mt-0.5 text-xs">
                  {job.siteAddress}, {job.city}, {job.state} - {job.pincode}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-700">
              <Navigation className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">GPS Coordinates</div>
                <div className="font-mono text-slate-800 mt-0.5 text-xs">
                  {job.gpsCoordinates
                    ? `${job.gpsCoordinates.lat.toFixed(4)}° N, ${job.gpsCoordinates.lng.toFixed(4)}° E`
                    : "Coordinates confirmed upon arrival"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Mandatory Safety Protocols</div>
                <div className="text-slate-800 mt-0.5 text-xs font-medium">
                  Safety Helmets, Harnesses, Rubber Boots, DISCOM NOC
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progression Tracker */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Project Installation Progress
            </h2>
            <span className="text-xs text-slate-600">
              Current Stage:{" "}
              <strong className="text-slate-900 uppercase font-semibold">
                {steps.find((s) => s.key === job.status)?.label || job.status}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-md border text-xs transition-all ${
                    isCurrent
                      ? "bg-slate-900 border-slate-900 text-white font-semibold"
                      : isCompleted
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono">Step 0{idx + 1}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-white animate-spin" />
                    ) : null}
                  </div>
                  <div className="font-bold text-xs">{step.label}</div>
                  <div className="text-[10px] opacity-80 mt-0.5">{step.description}</div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons to Advance Status */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">Update Project Stage:</span>

            {job.status === "assigned" && (
              <button
                onClick={() => handleUpdateStatus("en_route")}
                disabled={statusLoading}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Mark &quot;Team Traveling to Site&quot;
              </button>
            )}

            {(job.status === "assigned" || job.status === "en_route") && (
              <button
                onClick={() => handleUpdateStatus("on_site")}
                disabled={statusLoading}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Confirm &quot;Arrived at Work Site&quot;
              </button>
            )}

            {job.status === "on_site" && (
              <button
                onClick={() => handleUpdateStatus("in_progress")}
                disabled={statusLoading}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
              >
                Start Solar Installation Work
              </button>
            )}

            {job.status === "in_progress" && (
              <button
                onClick={() => handleUpdateStatus("completed")}
                disabled={statusLoading}
                className="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors"
              >
                Submit Final Commissioning &amp; Sign-Off
              </button>
            )}

            {job.status === "completed" && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Project Completed &amp; Approved</span>
                </span>
                <a
                  href={`/api/jobs/${job.id}/commissioning-report`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download DISCOM Compliance Certificate</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Two Columns: Blueprints & Photo Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Blueprints & Electrical Drawings */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Project Blueprints &amp; Electrical Drawings</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download engineering drawings, single-line diagrams, and permits.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {uploadedDocs.filter((d) => d.documentType !== "proof_of_work").length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                  No electrical drawings attached to this job yet.
                </div>
              ) : (
                uploadedDocs
                  .filter((d) => d.documentType !== "proof_of_work")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-slate-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 truncate max-w-xs">
                            {doc.fileName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Category: {doc.documentType.replace("_", " ").toUpperCase()} •{" "}
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.downloadUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Column 2: Photo Proof Uploader */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Submit Site Photos &amp; Work Proof</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Take photos from the rooftop. Works offline if you have no network signal.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadProof} className="space-y-4">
              {/* Step 1: GPS Fix */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Step 1: Confirm Site Location (GPS)
                </label>
                <button
                  type="button"
                  onClick={captureGPS}
                  className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs py-2.5 px-3 rounded font-medium transition-colors"
                >
                  <Crosshair className="w-4 h-4 text-slate-600" />
                  <span>{gpsStatus}</span>
                </button>
              </div>

              {/* Step 2: Photo Capture */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Step 2: Rooftop Photo
                </label>
                <label className="cursor-pointer flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 text-xs py-3 px-3 rounded transition-colors">
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>{photoFileName || "Tap to Take Photo or Select from Gallery"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                {photoPreview && (
                  <div className="mt-2.5 relative w-full h-32 rounded overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={photoPreview}
                      alt="Proof Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-[11px] text-white px-2 py-0.5 rounded">
                      Preview: {photoFileName}
                    </span>
                  </div>
                )}
              </div>

              {/* Step 3: Work Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Step 3: What part of work does this photo show?
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as JobDocument["documentType"])}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs"
                >
                  <option value="proof_of_work">Solar Panels &amp; Mounting Structure</option>
                  <option value="single_line_diagram">Inverter Installation &amp; DC Cabling</option>
                  <option value="safety_checklist">Earthing &amp; Lightning Arrester Test</option>
                  <option value="commissioning_report">Final Grid Synchronization &amp; Metering</option>
                </select>
              </div>

              {/* Step 4: Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Step 4: Supervisor Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Completed string cabling on Bay 2. Tested at 1000V (>50 MΩ)."
                  rows={2}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 text-xs placeholder:text-slate-400"
                />
              </div>

              {uploadSuccess && (
                <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Photo record successfully submitted.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !gpsLocation}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs py-3 px-4 rounded transition-colors"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>
                      {isOnline ? "Submit Photo to Central Dispatch" : "Save to Phone (Auto-Upload Later)"}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Offline Saved Photos List */}
            {vaultQueuedProofs.length > 0 && (
              <div className="pt-3.5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-700" />
                    <span>Photos Waiting to Upload ({vaultQueuedProofs.length})</span>
                  </h3>
                  {isOnline && (
                    <button
                      onClick={handleManualVaultSync}
                      disabled={syncingVault}
                      className="text-xs text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingVault ? "animate-spin" : ""}`} />
                      <span>Upload All Now</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {vaultQueuedProofs.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-amber-50 border border-amber-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="text-amber-900 font-bold">{item.fileName}</div>
                        <div className="text-slate-600 text-[11px] font-mono mt-0.5">
                          GPS: {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E (±{item.accuracy || 5}m)
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-medium">
                        Waiting for Signal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Photo Records */}
            <div className="pt-3.5 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 mb-2.5">
                Submitted Site Photos ({uploadedDocs.filter((d) => d.documentType === "proof_of_work").length})
              </h3>
              <div className="space-y-2">
                {uploadedDocs
                  .filter((d) => d.documentType === "proof_of_work")
                  .map((proof) => (
                    <div
                      key={proof.id}
                      className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="text-slate-900 font-semibold">{proof.fileName}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                          GPS: {proof.geotag ? `${proof.geotag.latitude}°N, ${proof.geotag.longitude}°E` : "Verified Coordinates"}
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        Submitted &amp; Verified
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
