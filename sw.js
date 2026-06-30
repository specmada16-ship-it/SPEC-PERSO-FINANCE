const CACHE = "spec-finance-v2";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin GET requests, falling back to network,
// and caching whatever successfully loads (JS, CSS, HTML, icons, manifest...)
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      if (cached) {
        fetch(e.request).then(res => {
          if (res && res.ok) cache.put(e.request, res.clone());
        }).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(e.request);
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      } catch (err) {
        if (e.request.mode === "navigate") {
          const fallback = await cache.match("/index.html") || await cache.match("/");
          if (fallback) return fallback;
        }
        throw err;
      }
    })
  );
});
