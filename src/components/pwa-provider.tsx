"use client";

import { useEffect, useState } from "react";
import { flushOfflineProofQueue } from "@/lib/offline/sync-manager";
import { RefreshCw, CheckCircle2, Wifi, WifiOff } from "lucide-react";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [syncToast, setSyncToast] = useState<{
    show: boolean;
    type: "syncing" | "success" | "offline";
    message: string;
  }>({
    show: false,
    type: "syncing",
    message: "",
  });

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);

            // Check for service worker updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("[PWA] New version available; refreshing cache in background.");
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });
      });

      // Listen for message from service worker background sync
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "TRIGGER_OFFLINE_SYNC") {
          handleAutoSync("Background Service Worker Sync");
        }
      });
    }

    // 2. Network connectivity listeners
    const handleOnline = () => {
      setSyncToast({
        show: true,
        type: "syncing",
        message: "Network restored! Auto-flushing offline vault to Supabase...",
      });
      handleAutoSync("Network Online Event");
    };

    const handleOffline = () => {
      setSyncToast({
        show: true,
        type: "offline",
        message: "Rooftop signal lost. Offline Vault is active for tamper-evident photo caching.",
      });
      setTimeout(() => {
        setSyncToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleAutoSync = async (origin: string) => {
    try {
      console.log(`[PWA] Flushing offline queue triggered by ${origin}`);
      const result = await flushOfflineProofQueue();
      if (result.successCount > 0) {
        setSyncToast({
          show: true,
          type: "success",
          message: `Successfully synchronized ${result.successCount} geotagged proof(s) to Supabase Storage!`,
        });
        setTimeout(() => {
          setSyncToast((prev) => ({ ...prev, show: false }));
        }, 5000);
      } else {
        setSyncToast((prev) => ({ ...prev, show: false }));
      }
    } catch (err) {
      console.error("[PWA] Auto-sync encountered error:", err);
      setSyncToast((prev) => ({ ...prev, show: false }));
    }
  };

  return (
    <>
      {children}

      {/* Global Sync Notification Toast */}
      {syncToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 font-mono text-xs ${
              syncToast.type === "offline"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-200"
                : syncToast.type === "syncing"
                ? "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
                : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
            } backdrop-blur-md`}
          >
            {syncToast.type === "offline" ? (
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
            ) : syncToast.type === "syncing" ? (
              <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div className="flex-1">{syncToast.message}</div>
            <button
              onClick={() => setSyncToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
