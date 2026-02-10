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

// Fetch-Event: Einfach durchreichen, KEIN Caching
self.addEventListener('fetch', (event) => {
    // Alle Requests gehen direkt ins Netzwerk
    event.respondWith(fetch(event.request));
});
