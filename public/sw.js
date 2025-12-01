// SW minimale: cache-first per asset statici, network-first per HTML.
// Versiona per forzare refresh quando cambi build:
const CACHE_STATIC = "fm-static-v1";
const STATIC_ASSETS = [
  "/", "/manifest.json",
  // Aggiungi qui eventuali asset critici (CSS/JS se con path stabile)
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_STATIC).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k.startsWith("fm-static-") && k !== CACHE_STATIC ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// Strategia: HTML network-first; asset statici cache-first
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const isHTML = req.headers.get("accept")?.includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_STATIC).then((c) => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // Cache asset GET con risposta OK
      if (req.method === "GET" && res.ok) {
        const copy = res.clone();
        caches.open(CACHE_STATIC).then((c) => c.put(req, copy)).catch(()=>{});
      }
      return res;
    }))
  );
});