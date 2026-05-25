// PWABuilder offline navigation service worker (Happus Tadka)
// Production registers /sw.js — this file is the PWABuilder-compatible template.

importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

const CACHE = "pwabuilder-page";
const offlineFallbackPage = "/offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage)));
});

if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

const BACKGROUND_SYNC_TAG = "happus-background-sync";
const PERIODIC_SYNC_TAG = "happus-periodic-refresh";

self.addEventListener("periodicsync", (event) => {
  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(
      caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage).catch(() => {}))
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("push", (event) => {
  const title = "Happus Tadka";
  const body = event.data?.text() ?? "You have updates";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow ? self.clients.openWindow("/") : Promise.resolve()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch {
          const cache = await caches.open(CACHE);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  }
});
