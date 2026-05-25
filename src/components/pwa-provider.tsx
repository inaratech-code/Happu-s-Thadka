"use client";

import { useEffect, type ReactNode } from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) return Promise.resolve();
  return navigator.serviceWorker.getRegistrations().then((regs) =>
    Promise.all(regs.map((r) => r.unregister()))
  );
}

function isLocalDevHost() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  /* Dev: SW breaks HMR — keep disabled on localhost */
  if (isLocalDevHost()) {
    void unregisterServiceWorkers();
    if ("caches" in window) {
      void caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
    return;
  }

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        const onNewWorker = () => {
          if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        };
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              onNewWorker();
            }
          });
        });
        if (reg.waiting) onNewWorker();
      })
      .catch(() => {
        /* unsupported — fail silently */
      });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const online = useOnlineStatus();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <>
      {!online && (
        <div
          role="status"
          className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500/95 text-charcoal-950 safe-top"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          Offline mode — changes save on this device
        </div>
      )}

      <div className={cn(!online && "pt-10")}>{children}</div>
    </>
  );
}
