// =====================================================================
// SERVICE WORKER — RumahDesign3D PWA
//   Navigations: network-first (so updates show), cache fallback offline.
//   Same-origin assets: stale-while-revalidate.
//   Cross-origin CDN (three.js / jspdf / supabase / fonts): cache-on-success.
//   Bump CACHE_VERSION whenever you ship changes to force a refresh.
// =====================================================================
const CACHE_VERSION = 'rd3d-v33';
const CORE = [
  './',
  './Floor%20Planner%202.0.html',
  './Akun.html',
  './styles.css?v=18',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) =>
      // tolerate individual 404s (e.g. filename differences) — don't fail whole install
      Promise.allSettled(CORE.map((u) => c.add(u)))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // HTML navigations → network-first
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { cachePut(req, res.clone()); return res; })
        .catch(() => caches.match(req).then((m) => m || caches.match('./Floor%20Planner%202.0.html')))
    );
    return;
  }

  if (sameOrigin) {
    // App code (js/css/html) → NETWORK-FIRST so updates show immediately.
    // Other same-origin assets (images/fonts) → stale-while-revalidate.
    const isCode = /\.(js|css|html|webmanifest)(\?|$)/i.test(url.pathname);
    if (isCode) {
      e.respondWith(
        fetch(req).then((res) => { cachePut(req, res.clone()); return res; })
          .catch(() => caches.match(req))
      );
    } else {
      e.respondWith(
        caches.match(req).then((cached) => {
          const net = fetch(req).then((res) => { cachePut(req, res.clone()); return res; }).catch(() => cached);
          return cached || net;
        })
      );
    }
  } else {
    // cross-origin (CDN) → cache-first, fill on success
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.status === 200) cachePut(req, res.clone());
        return res;
      }).catch(() => cached))
    );
  }
});

function cachePut(req, res) {
  if (!res || res.status !== 200) return;
  caches.open(CACHE_VERSION).then((c) => c.put(req, res)).catch(() => {});
}
