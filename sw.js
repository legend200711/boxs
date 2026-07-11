/* ══════════════════════════════════════════
   SHADOWS MIDNIGHT HUB — Service Worker
   Caches the app shell for offline / fast load
══════════════════════════════════════════ */

const CACHE = "shadow-nexus-v1";

// App-shell files to pre-cache (Firebase is CDN; we cache the HTML only)
const PRECACHE = [
  "./shodows midnight hub.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* ── Install: pre-cache app shell ── */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: network-first for Firebase, cache-first for app shell ── */
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Always go network-first for Firebase/Firestore/Auth requests
  if (
    url.hostname.includes("firebaseapp.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("firebaseio.com")
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for everything else (app shell, icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Only cache valid GET responses
        if (!response || response.status !== 200 || e.request.method !== "GET") {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => {
        // If offline and no cache, return the app HTML as fallback
        return caches.match("./shodows midnight hub.html");
      });
    })
  );
});
