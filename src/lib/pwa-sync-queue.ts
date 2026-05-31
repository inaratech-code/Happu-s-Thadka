import type { AppState } from "@/lib/types";
import { isDatabaseConfiguredClient } from "@/lib/env";

export const SYNC_CACHE_NAME = "happus-tadka-sync-v1";
export const SYNC_QUEUE_KEY = "/__happus_sync_queue__";
export const BACKGROUND_SYNC_TAG = "happus-background-sync";
export const PERIODIC_SYNC_TAG = "happus-periodic-refresh";

type QueueEntry = {
  id: string;
  state: AppState;
  at: string;
};

type SyncManager = {
  register: (tag: string) => Promise<void>;
  getTags: () => Promise<string[]>;
};

type PeriodicSyncManager = {
  register: (tag: string, options?: { minInterval: number }) => Promise<void>;
  getTags: () => Promise<string[]>;
};

type ServiceWorkerRegistrationWithSync = ServiceWorkerRegistration & {
  sync?: SyncManager;
  periodicSync?: PeriodicSyncManager;
};

async function openSyncCache() {
  return caches.open(SYNC_CACHE_NAME);
}

export async function readSyncQueue(): Promise<QueueEntry[]> {
  if (typeof caches === "undefined") return [];
  const cache = await openSyncCache();
  const res = await cache.match(SYNC_QUEUE_KEY);
  if (!res) return [];
  try {
    const data = (await res.json()) as QueueEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeSyncQueue(entries: QueueEntry[]) {
  if (typeof caches === "undefined") return;
  const cache = await openSyncCache();
  await cache.put(SYNC_QUEUE_KEY, new Response(JSON.stringify(entries)));
}

export async function enqueueStateForBackgroundSync(state: AppState) {
  const queue = await readSyncQueue();
  queue.push({
    id: `sync-${Date.now()}`,
    state,
    at: new Date().toISOString(),
  });
  await writeSyncQueue(queue);

  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync;
    if (reg.sync) {
      await reg.sync.register(BACKGROUND_SYNC_TAG);
    }
  } catch {
    /* Background Sync not supported */
  }
}

export async function registerPeriodicSync() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync;
    const periodic = reg.periodicSync;
    if (!periodic) return;

    const tags = await periodic.getTags();
    if (tags.includes(PERIODIC_SYNC_TAG)) return;

    await periodic.register(PERIODIC_SYNC_TAG, {
      minInterval: 12 * 60 * 60 * 1000,
    });
  } catch {
    /* Permission denied or unsupported */
  }
}

/** Drain queued offline saves when the app is back online. */
export async function flushClientSyncQueue(): Promise<void> {
  if (!isDatabaseConfiguredClient() || !navigator.onLine) return;

  const queue = await readSyncQueue();
  if (queue.length === 0) return;

  const remaining: QueueEntry[] = [];
  for (const entry of queue) {
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.state),
        cache: "no-store",
      });
      if (!res.ok && res.status !== 401) remaining.push(entry);
    } catch {
      remaining.push(entry);
    }
  }

  await writeSyncQueue(remaining);
}
