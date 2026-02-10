// Minimaler Service Worker nur für PWA-Installation
// KEIN Caching, KEIN Fetch-Handling - nur Installation ermöglichen

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

// KEIN fetch-Event-Listener = Browser behandelt alle Requests normal
