const CACHE = "spec-finance-v3";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(CORE_ASSETS).catch(err => {
        // Don't fail install if one asset is missing, log and continue
        console.warn("Some core assets failed to cache:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("message", e => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin GET requests, caching everything that loads successfully
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      if (cached) {
        // Serve cached immediately, refresh in background if online
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
        return new Response("Offline — contenu non disponible", { status: 503 });
      }
    })
  );
});
