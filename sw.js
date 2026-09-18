/* Runner Legends PWA — cache-first static, network-first API fallback */
const CACHE_VERSION = 'rl-v8-7-choose';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './js/worlds.js',
  './js/portal.js',
  './js/content-v6.js',
  './js/messages-v7.js',
  './js/spectator-messages.js',
  './js/power-system.js',
  './js/power-log.js',
  './js/combat-v8.js',
  './js/enemies-v8.js',
  './js/nova-protocol.js',
  './js/power-fx.js',
  './js/game.js',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './vercel.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isApi = /\/api\//.test(url.pathname) || url.hostname.includes('tournament');
  if (isApi) {
    event.respondWith(
      fetch(req).then((res) => res).catch(() => caches.match(req).then((c) => c || new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok && url.origin === self.location.origin) {
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
