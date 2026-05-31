"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { clearServiceWorkerCaches } from "@/lib/app-refresh";
import { useStore } from "@/lib/store";

export function useAppSync() {
  const router = useRouter();
  const { refreshData, flushPendingSave } = useStore();
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await flushPendingSave();
      refreshData();
      await clearServiceWorkerCaches();
      router.refresh();
    } finally {
      window.setTimeout(() => setSyncing(false), 600);
    }
  }, [flushPendingSave, refreshData, router, syncing]);

  return { sync, syncing };
}
