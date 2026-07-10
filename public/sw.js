const CACHE = "kajy-v5";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/fonts.css",
];

// Google Fonts domains to cache separately
const FONT_DOMAINS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(CORE_ASSETS).catch(err => {
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

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // ── Google Fonts — cache-first, long-lived ──────────────────────────────
  if (FONT_DOMAINS.includes(url.hostname)) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const res = await fetch(e.request);
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        } catch {
          return new Response("Font unavailable offline", { status: 503 });
        }
      })
    );
    return;
  }

  // ── Same-origin assets — stale-while-revalidate ─────────────────────────
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
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
      } catch {
        if (e.request.mode === "navigate") {
          const fallback = await cache.match("/index.html") || await cache.match("/");
          if (fallback) return fallback;
        }
        return new Response("Offline — contenu non disponible", { status: 503 });
      }
    })
  );
});
