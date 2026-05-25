import type { AppState } from "@/lib/types";
import { isSupabaseConfiguredClient } from "@/lib/env";
import { enqueueStateForBackgroundSync } from "@/lib/pwa-sync-queue";

const STORAGE_KEY = "happus-tadka-state";

/** Client-side: load app state from API or localStorage */
export async function loadAppStateClient(): Promise<AppState | null> {
  if (typeof window === "undefined") return null;

  if (isSupabaseConfiguredClient()) {
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
export async function saveAppStateClient(state: AppState): Promise<void> {
  if (typeof window === "undefined") return;

  if (isSupabaseConfiguredClient()) {
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error((body as { error?: string }).error ?? "Failed to save data to server");
        if (!navigator.onLine) await enqueueStateForBackgroundSync(state);
        throw err;
      }
    } catch (e) {
      if (!navigator.onLine) await enqueueStateForBackgroundSync(state);
      if (e instanceof Error) throw e;
      throw new Error("Failed to save data to server");
    }
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function isRemoteDataSource(): boolean {
  return isSupabaseConfiguredClient();
}
