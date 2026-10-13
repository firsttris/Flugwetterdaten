// Erzeugt ein VAPID-Schlüsselpaar für den Wind-Alarm.
import { webcrypto as crypto } from "node:crypto";

const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const raw = Buffer.from(await crypto.subtle.exportKey("raw", keys.publicKey)).toString("base64url");
const jwk = await crypto.subtle.exportKey("jwk", keys.privateKey);

console.log("VAPID_PUBLIC_KEY (in wrangler.toml eintragen):\n" + raw + "\n");
console.log("VAPID_PRIVATE_KEY (mit `npx wrangler secret put VAPID_PRIVATE_KEY` speichern):\n" + JSON.stringify(jwk));
