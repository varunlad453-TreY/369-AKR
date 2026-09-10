"use client";

import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  subscribeToQueue,
  flushOfflineProofQueue,
  QueuedUploadItem,
  removeQueuedProof,
} from "@/lib/offline/sync-manager";

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedItems, setQueuedItems] = useState<QueuedUploadItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Subscribe to IndexedDB queue updates
    const unsubscribe = subscribeToQueue((items) => {
      setQueuedItems(items);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      alert("Device is offline. Connect to network before syncing vault.");
      return;
    }

    setIsSyncing(true);
    setSyncFeedback("Transmitting queued payloads to Supabase Storage...");

    try {
      const res = await flushOfflineProofQueue();
      if (res.successCount > 0) {
        setSyncFeedback(`Successfully synced ${res.successCount} proof(s)!`);
      } else if (res.failedCount > 0) {
        setSyncFeedback(`Sync failed for ${res.failedCount} item(s). Will retry.`);
      } else {
        setSyncFeedback("All items already synchronized.");
      }
    } catch {
      setSyncFeedback("Sync encounter error. Check connectivity.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const queueCount = queuedItems.length;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
            isOnline
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
              : "bg-amber-950/80 border-[#FFD23F]/80 text-[#FFD23F] animate-pulse"
          }`}
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-3.5 h-3.5 ml-0.5" />
              <span className="hidden sm:inline">FIELD NETWORK ACTIVE</span>
              <span className="sm:hidden">ONLINE</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <WifiOff className="w-3.5 h-3.5 ml-0.5" />
              <span className="font-bold">ROOFTOP OFFLINE VAULT</span>
            </>
          )}
        </div>

        {/* Offline Queue Badge & Trigger */}
        {queueCount > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-[#FFD23F] text-xs font-mono transition-colors"
            title="View unsynced proofs in IndexedDB"
          >
            <Database className="w-3 h-3 text-[#FFD23F]" />
            <span className="font-bold">{queueCount}</span>
            <span className="hidden md:inline">in vault</span>
          </button>
        )}

        {/* Quick Sync Button if items in vault and device is online */}
        {queueCount > 0 && isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1.5 rounded-full bg-[#FFD23F] hover:bg-amber-300 text-black transition-transform active:scale-95 disabled:opacity-50"
            title="Flush queue to Supabase now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Offline Vault Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B0F19] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#FFD23F]" />
                <h3 className="text-white text-sm font-bold">
                  IndexedDB Field Vault ({queueCount} Items)
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Proofs captured during low/zero signal are securely hashed and stored locally in browser
              storage. They will auto-sync once network connection is verified.
            </p>

            {syncFeedback && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 text-xs">
                {syncFeedback}
              </div>
            )}

            {/* List of Queued Items */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {queuedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-white font-bold truncate max-w-[240px]">
                      {item.fileName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      GPS: {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E (±{item.accuracy || 5}m)
                    </div>
                    <div className="text-[10px] text-amber-400 mt-0.5">
                      Status: <span className="uppercase">{item.status}</span>
                      {item.retryCount > 0 && ` (Retries: ${item.retryCount})`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Tamper-Evident
                    </span>
                    <button
                      onClick={() => removeQueuedProof(item.id)}
                      className="text-slate-500 hover:text-red-400 text-xs"
                      title="Discard queued item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close Window
              </button>

              <button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="px-4 py-2 rounded-lg bg-[#FFD23F] hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync Vault to Supabase Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
