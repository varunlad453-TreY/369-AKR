"use client";

import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
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
    setSyncFeedback("Transmitting queued payloads to storage...");

    try {
      const res = await flushOfflineProofQueue();
      if (res.successCount > 0) {
        setSyncFeedback(`Successfully synchronized ${res.successCount} item(s).`);
      } else if (res.failedCount > 0) {
        setSyncFeedback(`Sync failed for ${res.failedCount} item(s). Will retry.`);
      } else {
        setSyncFeedback("All offline items are synchronized.");
      }
    } catch {
      setSyncFeedback("Sync encountered an error. Check connectivity.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const queueCount = queuedItems.length;

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border ${
            isOnline
              ? "bg-slate-50 border-slate-300 text-slate-700"
              : "bg-amber-50 border-amber-300 text-amber-800"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline font-semibold">NETWORK ONLINE</span>
              <span className="md:hidden font-semibold">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-bold">OFFLINE VAULT</span>
            </>
          )}
        </div>

        {/* Offline Queue Counter */}
        {queueCount > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-mono transition-colors"
            title="View unsynced proofs in IndexedDB vault"
          >
            <Database className="w-3 h-3 text-slate-600" />
            <span className="font-bold">{queueCount}</span>
            <span className="hidden sm:inline text-[11px] text-slate-500">queued</span>
          </button>
        )}

        {/* Quick Sync Button */}
        {queueCount > 0 && isOnline && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50"
            title="Synchronize offline vault now"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Offline Vault Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded max-w-lg w-full p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-700" />
                <h3 className="text-slate-900 font-bold uppercase">
                  Offline IndexedDB Vault ({queueCount} Items)
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              Proofs captured during low or zero signal are securely stored locally. They will
              automatically synchronize to cloud storage when connectivity is restored.
            </p>

            {syncFeedback && (
              <div className="p-2 rounded bg-slate-100 border border-slate-300 text-slate-800 text-xs">
                {syncFeedback}
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {queuedItems.map((item) => (
                <div
                  key={item.id}
                  className="pt-2 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-slate-900 font-bold truncate max-w-[240px]">
                      {item.fileName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      GPS: {item.latitude.toFixed(4)}°N, {item.longitude.toFixed(4)}°E (±
                      {item.accuracy || 5}m)
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      Status: <span className="uppercase font-semibold">{item.status}</span>
                      {item.retryCount > 0 && ` (Retries: ${item.retryCount})`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => removeQueuedProof(item.id)}
                      className="text-slate-400 hover:text-red-600 text-xs px-1.5 py-0.5 rounded hover:bg-red-50"
                      title="Discard queued item"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>

              <button
                onClick={handleManualSync}
                disabled={isSyncing || !isOnline}
                className="px-3.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Synchronize Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
