const CACHE_NAME = 'aurelia-os-v8';
// Paths are declared site-relative ("/workspace.html") and resolved against this
// service worker's own scope, so the same file works at a domain root (local
// Node server) and under a sub-path deploy (e.g. GitHub Pages project sites).
const SCOPE = new URL(self.registration.scope);
const resolveScope = (p) => new URL(p.replace(/^\//, '') || './', SCOPE).href;
const ASSETS = [
  '/',
  '/index.html',
  '/workspace.html',
  '/deck.html',
  '/clients.html',
  '/clients-data.js',
  '/outreach.html',
  '/outreach-engine.js',
  '/outreach-app.js',
  '/privacy.html',
  '/terms.html',
  '/refunds.html',
  '/engine-client.js',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS.map(resolveScope)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match(resolveScope('/index.html')))
      )
  );
});
