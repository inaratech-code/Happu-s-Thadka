import type { AppState } from "@/lib/types";
import { isDatabaseConfiguredClient } from "@/lib/env";
import { enqueueStateForBackgroundSync } from "@/lib/pwa-sync-queue";

const STORAGE_KEY = "happus-tadka-state";
const KEEPALIVE_MAX_BYTES = 60_000;

export type SaveAppStateOptions = {
  /** Use fetch keepalive for tab close / page hide (size-limited). */
  keepalive?: boolean;
  retries?: number;
};

async function putAppState(
  state: AppState,
  options: SaveAppStateOptions
): Promise<Response> {
  const body = JSON.stringify(state);
  const useKeepalive = Boolean(options.keepalive && body.length <= KEEPALIVE_MAX_BYTES);

  return fetch("/api/state", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
    keepalive: useKeepalive,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Client-side: load app state from API or localStorage */
export async function loadAppStateClient(): Promise<AppState | null> {
  if (typeof window === "undefined") return null;

  if (isDatabaseConfiguredClient()) {
    const res = await fetch("/api/state", { credentials: "include", cache: "no-store" });
    if (res.status === 401) return null;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? "Failed to load data from server");
    }
    return (await res.json()) as AppState;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AppState;
}

/** Client-side: persist app state to API or localStorage */
export async function saveAppStateClient(
  state: AppState,
  options: SaveAppStateOptions = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  if (isDatabaseConfiguredClient()) {
    const retries = options.retries ?? 2;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await putAppState(state, options);
        if (res.status === 401) return;
        if (res.ok) return;

        const body = await res.json().catch(() => ({}));
        const message = (body as { error?: string }).error ?? "Failed to save data to server";

        if (res.status >= 500 && attempt < retries) {
          await sleep(400 * (attempt + 1));
          continue;
        }

        if (!navigator.onLine) {
          await enqueueStateForBackgroundSync(state);
          return;
        }

        throw new Error(message);
      } catch (e) {
        if (attempt < retries && navigator.onLine) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        if (!navigator.onLine) {
          await enqueueStateForBackgroundSync(state);
          return;
        }
        if (e instanceof Error) throw e;
        throw new Error("Failed to save data to server");
      }
    }
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isRemoteDataSource(): boolean {
  return isDatabaseConfiguredClient();
}
