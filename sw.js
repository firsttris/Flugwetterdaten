const CACHE_NAME = 'wetter-rampe-v1';
const ASSETS = [
    '.',
    'index.html',
    'manifest.json',
    'icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Nur GET-Requests behandeln
    if (event.request.method !== 'GET') return;

    // Strategie: Network First (Netzwerk zuerst, dann Cache)
    // Das verhindert, dass alte Versionen hängen bleiben.
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Wenn Netzwerk erfolgreich: Cache aktualisieren für das nächste Mal Offline sein
                // Wir müssen die Response klonen, da sie nur einmal gelesen werden kann
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return networkResponse;
            })
            .catch(() => {
                // Wenn Netzwerk fehlgeschlagen (Offline): Aus dem Cache laden
                return caches.match(event.request);
            })
    );
});
