/** Clear service worker caches and reload the page (fixes stuck refresh after deploy). */
export async function hardRefreshPage() {
  if (typeof window === "undefined") return;

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg?.active) {
      reg.active.postMessage({ type: "CLEAR_CACHE" });
    }
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister().catch(() => undefined)));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  window.location.reload();
}

export async function clearServiceWorkerCaches() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.active?.postMessage({ type: "CLEAR_CACHE" });
  }
}
