// Service Worker: kein Offline-Cache (Wetterdaten sollen immer frisch sein), aber Push für den Wind-Alarm.
const API_BASE = new URL(self.location.href).searchParams.get("api") || "";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// Der Worker schickt Pushes ohne Inhalt; den Text holen wir uns selbst ab.
self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let message = { title: "Rheinmünster Wind", body: "Neue Windmeldung" };
      try {
        if (event.data) {
          message = { ...message, ...event.data.json() };
        } else {
          const sub = await self.registration.pushManager.getSubscription();
          if (sub && API_BASE) {
            const res = await fetch(`${API_BASE}/message?endpoint=${encodeURIComponent(sub.endpoint)}`);
            if (res.ok) message = { ...message, ...(await res.json()) };
          }
        }
      } catch (err) {
        console.warn("Push-Text konnte nicht geladen werden", err);
      }
      await self.registration.showNotification(message.title, {
        body: message.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "wind",
        renotify: true,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.focus();
      return self.clients.openWindow("/");
    })(),
  );
});
