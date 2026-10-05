const C = 'renfo-1.6.1';
const F = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(F))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))));
  self.clients.claim();
});
// Réseau d'abord ; si le réseau échoue OU si le serveur répond une erreur (ex. 404), on sert le cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (!r.ok) return caches.match(e.request).then(c => c || r);
      const c = r.clone(); caches.open(C).then(x => x.put(e.request, c)); return r;
    }).catch(() => caches.match(e.request))
  );
});
