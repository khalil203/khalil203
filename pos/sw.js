// Yanisa Shop service worker: network first (revalidated, never a stale HTTP-cache copy), offline falls back to the cached shell.
const CACHE = 'shop-pos-4.3.3';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'display.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'modules.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(x => new Request(x, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // never cache database calls
  e.respondWith(fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request)));
});
