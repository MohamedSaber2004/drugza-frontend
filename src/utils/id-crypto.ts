// Custom symmetric cipher for obscuring entity ids in route URLs.
// encryptId is non-deterministic (random salt per call); decryptId falls back
// to the raw value when the input is not one of our payloads, so plain or
// non-GUID ids keep working untouched.

const APP_SECRET = 'drugza-route-cipher-v1';
const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function keyStream(seed: number, length: number): Uint8Array {
  const rand = mulberry32(seed);
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * 256);
  return out;
}

function saltToSeed(salt: Uint8Array): number {
  const n = (salt[0] | (salt[1] << 8) | (salt[2] << 16) | (salt[3] << 24)) >>> 0;
  return (hashSeed(APP_SECRET) ^ n) >>> 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]{10,}$/.test(value)) return null;
  try {
    const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export function encryptId(id: string): string {
  const plain = new TextEncoder().encode(id);
  const salt = new Uint8Array(4);
  crypto.getRandomValues(salt);
  const stream = keyStream(saltToSeed(salt), plain.length);
  const out = new Uint8Array(4 + plain.length);
  out.set(salt, 0);
  for (let i = 0; i < plain.length; i++) out[4 + i] = plain[i] ^ stream[i];
  return bytesToBase64Url(out);
}

export function decryptId(value: string): string {
  const bytes = base64UrlToBytes(value);
  if (!bytes || bytes.length <= 4) return value;
  const salt = bytes.slice(0, 4);
  const cipher = bytes.slice(4);
  const stream = keyStream(saltToSeed(salt), cipher.length);
  const plainBytes = new Uint8Array(cipher.length);
  for (let i = 0; i < cipher.length; i++) plainBytes[i] = cipher[i] ^ stream[i];
  let plain: string;
  try {
    plain = new TextDecoder().decode(plainBytes);
  } catch {
    return value;
  }
  return GUID_REGEX.test(plain) ? plain : value;
}
