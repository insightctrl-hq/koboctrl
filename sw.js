/* KoboCTRL offline support. The app is fetched fresh when there is a network, and served from the phone when there is not. */
const CACHE = "koboctrl-v6";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png?v=2", "icon-512.png?v=2", "icon-maskable-512.png?v=2", "apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { if (r && r.ok){ const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
});
