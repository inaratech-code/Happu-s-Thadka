/** Sign out after this much time without user interaction. */
export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

const LAST_ACTIVITY_KEY = "happus-last-activity";

export function readLastActivity(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function touchLastActivity(at = Date.now()) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    /* ignore quota errors */
  }
}

export function clearLastActivity() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
}

export function isIdleExpired(now = Date.now()): boolean {
  const last = readLastActivity();
  if (last === null) return false;
  return now - last > IDLE_TIMEOUT_MS;
}
