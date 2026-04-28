// Web Crypto AES-GCM encryption for secure: true fields.
// Keys are derived via PBKDF2 and held in memory only — never persisted.

import { loadSalt, saveSalt } from "@/lib/persistence/idb";

const PBKDF2_ITERATIONS = 600_000;
const IV_LENGTH = 12; // bytes, per AES-GCM spec

export async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, hash: "SHA-256", iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(
  key: CryptoKey,
  plaintext: string,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH) as Uint8Array<ArrayBuffer>);
  const enc = new TextEncoder();
  const ciphertextBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext),
  );
  return {
    iv: uint8ToBase64(iv),
    ciphertext: uint8ToBase64(new Uint8Array(ciphertextBuf)),
  };
}

export async function decrypt(
  key: CryptoKey,
  iv: string,
  ciphertext: string,
): Promise<string> {
  const plaintextBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToUint8(iv) },
    key,
    base64ToUint8(ciphertext),
  );
  return new TextDecoder().decode(plaintextBuf);
}

export async function getOrCreateSalt(): Promise<Uint8Array<ArrayBuffer>> {
  const existing = await loadSalt();
  if (existing) return existing as Uint8Array<ArrayBuffer>;
  const salt = crypto.getRandomValues(new Uint8Array(16) as Uint8Array<ArrayBuffer>);
  await saveSalt(salt);
  return salt;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function uint8ToBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

function base64ToUint8(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
}
