// Minimaler Service Worker nur für PWA-Installation
// KEIN Caching - alle Requests gehen direkt ins Netzwerk

self.addEventListener('install', (event) => {
    // Sofort aktivieren, kein Warten
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Alle alten Caches löschen
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch-Event: Nur same-origin Requests behandeln, externe ignorieren
self.addEventListener('fetch', (event) => {
    // Externe Requests (wie Cloudflare Analytics) ignorieren
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== location.origin) {
        return; // Nicht behandeln, Browser macht das normal
    }

    // Same-origin Requests direkt durchreichen (kein Caching)
    event.respondWith(fetch(event.request));
});
