// crypto.ts – wrapper semplice AES-GCM con Web Crypto

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function deriveKey(password: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("future-molding-salt"), // fisso per ora
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

export async function encryptJson(key: CryptoKey, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = encoder.encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plain
  );
  const buffer = new Uint8Array(iv.byteLength + cipher.byteLength);
  buffer.set(iv, 0);
  buffer.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...buffer));
}

export async function decryptJson<T>(key: CryptoKey, payload: string): Promise<T> {
  const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return JSON.parse(decoder.decode(plain)) as T;
}
