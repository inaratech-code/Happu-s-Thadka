import type { AppState } from "@/lib/types";

export const SYNC_CACHE_NAME = "happus-tadka-sync-v1";
export const SYNC_QUEUE_KEY = "/__happus_sync_queue__";
export const BACKGROUND_SYNC_TAG = "happus-background-sync";
export const PERIODIC_SYNC_TAG = "happus-periodic-refresh";

type QueueEntry = {
  id: string;
  state: AppState;
  at: string;
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
    const reg = await navigator.serviceWorker.ready;
    if ("sync" in reg) {
      await reg.sync.register(BACKGROUND_SYNC_TAG);
    }
  } catch {
    /* Background Sync not supported */
  }
}

export async function registerPeriodicSync() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (!("periodicSync" in reg)) return;

    const tags = await reg.periodicSync.getTags();
    if (tags.includes(PERIODIC_SYNC_TAG)) return;

    await reg.periodicSync.register(PERIODIC_SYNC_TAG, {
      minInterval: 12 * 60 * 60 * 1000,
    });
  } catch {
    /* Permission denied or unsupported */
  }
}
