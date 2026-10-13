import { API_BASE } from "./config";
import type { Settings } from "@/hooks/use-settings";

export const pushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Nur die Einstellungen, die der Worker für den Alarm braucht. */
const prefsFor = (s: Settings) => ({
  minWind: s.minWind,
  daytime: s.daytime,
  freq: Number(s.freq),
  forecastAlarm: s.forecastAlarm,
  unit: s.unit,
});

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Server antwortet mit ${res.status}`);
}

/** Fragt die Erlaubnis an, meldet das Gerät beim Worker an und speichert die Einstellungen. */
export async function enablePush(settings: Settings): Promise<void> {
  if (!pushSupported()) throw new Error("Dieser Browser unterstützt keine Push-Nachrichten.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Benachrichtigungen wurden nicht erlaubt.");

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) throw new Error("Wind-Alarm ist auf dem Server noch nicht eingerichtet.");
    const { vapidPublicKey } = (await res.json()) as { vapidPublicKey?: string };
    if (!vapidPublicKey) throw new Error("Wind-Alarm ist auf dem Server noch nicht eingerichtet.");
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(vapidPublicKey) });
  }
  await post("/subscribe", { subscription: sub.toJSON(), prefs: prefsFor(settings) });
}

/** Schickt geänderte Einstellungen an den Worker, falls das Gerät angemeldet ist. */
export async function syncPushPrefs(settings: Settings): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await post("/subscribe", { subscription: sub.toJSON(), prefs: prefsFor(settings) });
}

export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await post("/unsubscribe", { endpoint: sub.endpoint }).catch(() => undefined);
  await sub.unsubscribe();
}

/** Zeigt lokal eine Benachrichtigung, so wie der Alarm sie schicken würde. */
export async function showTestNotification(body: string): Promise<void> {
  if (!pushSupported()) throw new Error("Dieser Browser unterstützt keine Benachrichtigungen.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Benachrichtigungen wurden nicht erlaubt.");
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification("Rheinmünster Wind", { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "wind-test" });
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?api=${encodeURIComponent(API_BASE)}`).catch((err) => {
      console.warn("ServiceWorker-Registrierung fehlgeschlagen", err);
    });
  });
}

/** Service Worker abmelden, Caches leeren und neu laden. */
export async function resetApp() {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
  }
  window.location.href = `${window.location.pathname}?reset=${Date.now()}`;
}
