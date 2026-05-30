/** Web Push helpers (requires VAPID keys in env). */

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let cachedPublicKey: string | null | undefined;

/** Inline at build when set; otherwise loaded from /api/push/config at runtime. */
export async function getVapidPublicKey(): Promise<string | null> {
  const inlined = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (inlined) return inlined;

  if (typeof window === "undefined") return null;

  if (cachedPublicKey !== undefined) return cachedPublicKey;

  try {
    const res = await fetch("/api/push/config", { credentials: "same-origin" });
    if (!res.ok) {
      cachedPublicKey = null;
      return null;
    }
    const data = (await res.json()) as { publicKey?: string | null };
    const key = data.publicKey?.trim() || null;
    cachedPublicKey = key;
    return key;
  } catch {
    cachedPublicKey = null;
    return null;
  }
}

export async function isPushConfigured(): Promise<boolean> {
  const key = await getVapidPublicKey();
  return Boolean(key);
}

export async function subscribeToPushNotifications(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Not available on server" };
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "This browser does not support alerts." };
  }

  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    return { ok: false, error: "Alerts are not available on this device yet." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Allow notifications in your browser to continue." };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to subscribe";
    return { ok: false, error: message };
  }
}
