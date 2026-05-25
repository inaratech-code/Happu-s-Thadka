/* Happus Tadka — offline-first service worker */
const CACHE_VERSION = "happus-tadka-v7";

const SYNC_CACHE_NAME = "happus-tadka-sync-v1";
const SYNC_QUEUE_KEY = "/__happus_sync_queue__";
const BACKGROUND_SYNC_TAG = "happus-background-sync";
const PERIODIC_SYNC_TAG = "happus-periodic-refresh";

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/screenshots/mobile-390x844.png",
  "/screenshots/desktop-1280x720.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    );
  }
});

function isNavigation(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

function isNextStatic(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo.png" ||
    url.pathname === "/manifest.json"
  );
}

function isSameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch {
    return false;
  }
}

/** Network first — never serve stale HTML/JS when online */
async function networkFirst(request, { cacheName = CACHE_VERSION } = {}) {
  const response = await fetch(request, { cache: "no-store" });
  if (response.ok && response.type !== "opaque") {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationResponse(event) {
  const { request } = event;
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
    return await networkFirst(request);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staticResponse(request) {
  try {
    return await networkFirst(request);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return Response.error();
  }
}

async function readSyncQueue() {
  const cache = await caches.open(SYNC_CACHE_NAME);
  const res = await cache.match(SYNC_QUEUE_KEY);
  if (!res) return [];
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeSyncQueue(entries) {
  const cache = await caches.open(SYNC_CACHE_NAME);
  await cache.put(SYNC_QUEUE_KEY, new Response(JSON.stringify(entries)));
}

async function flushBackgroundSyncQueue() {
  const queue = await readSyncQueue();
  if (queue.length === 0) return;

  const remaining = [];
  for (const entry of queue) {
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.state),
      });
      if (!res.ok) remaining.push(entry);
    } catch {
      remaining.push(entry);
    }
  }
  await writeSyncQueue(remaining);
  if (remaining.length > 0) throw new Error("sync incomplete");
}

async function periodicRefresh() {
  await caches.open(CACHE_VERSION).then((cache) =>
    cache.addAll(["/manifest.json", "/offline.html"]).catch(() => {})
  );
  try {
    await flushBackgroundSyncQueue();
  } catch {
    /* retry on next period */
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(periodicRefresh());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(flushBackgroundSyncQueue());
  }
});

function pushPayload(event) {
  if (!event.data) {
    return { title: "Happus Tadka", body: "You have updates", url: "/" };
  }
  try {
    return event.data.json();
  } catch {
    return { title: "Happus Tadka", body: event.data.text(), url: "/" };
  }
}

self.addEventListener("push", (event) => {
  const payload = pushPayload(event);
  const title = payload.title ?? "Happus Tadka";
  const options = {
    body: payload.body ?? "Tap to open the app",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url ?? "/" },
    tag: payload.tag ?? "happus-notification",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request)) return;

  if (isNavigation(request)) {
    event.respondWith(navigationResponse(event));
    return;
  }

  if (isNextStatic(request)) {
    event.respondWith(staticResponse(request));
    return;
  }

  /* Let Next.js handle RSC, HMR, and API — do not respondWith(undefined) */
});
