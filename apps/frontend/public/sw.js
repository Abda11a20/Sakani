// apps/frontend/public/sw.js
// Service Worker بسيط لدعم PWA — navigation فقط

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // نتعامل فقط مع طلبات التنقل (navigation)
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
  }
});
