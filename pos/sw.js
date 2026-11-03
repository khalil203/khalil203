// Shop POS service worker: app shell cached, always tries network first so updates arrive immediately.
const CACHE = 'shop-pos-v16';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'display.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'modules.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // never cache database calls
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request)));
});
