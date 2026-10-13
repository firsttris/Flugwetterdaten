/**
 * Web Push ohne Inhalt (RFC 8030) mit VAPID-Anmeldung (RFC 8292).
 * Der Service Worker holt den Text danach über /message ab, deshalb ist keine
 * Verschlüsselung des Inhalts nötig.
 */
import type { Env } from "./index";

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const encodeJson = (obj: unknown) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

let keyCache: { jwk: string; key: CryptoKey } | null = null;

async function signingKey(jwk: string) {
  if (keyCache?.jwk === jwk) return keyCache.key;
  const key = await crypto.subtle.importKey("jwk", JSON.parse(jwk), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  keyCache = { jwk, key };
  return key;
}

/** Signiertes VAPID-JWT für den Push-Dienst (Audience = Origin des Endpunkts). */
export async function vapidJwt(audience: string, subject: string, privateJwk: string, now = Date.now()) {
  const header = encodeJson({ typ: "JWT", alg: "ES256" });
  const claims = encodeJson({ aud: audience, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject });
  const unsigned = `${header}.${claims}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    await signingKey(privateJwk),
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${b64url(signature)}`;
}

/** Schickt einen leeren Push und gibt den HTTP-Status des Push-Dienstes zurück. */
export async function sendPush(endpoint: string, env: Env): Promise<number> {
  const jwt = await vapidJwt(new URL(endpoint).origin, env.VAPID_SUBJECT, env.VAPID_PRIVATE_KEY);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      TTL: "3600",
      Urgency: "high",
      "Content-Length": "0",
    },
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error("Push-Dienst antwortet", res.status, await res.text());
  }
  return res.status;
}
