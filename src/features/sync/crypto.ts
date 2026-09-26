/**
 * End-to-end encryption of the synced state. The file on GitHub is public, so
 * it only ever contains AES-256-GCM ciphertext; the key is derived from the
 * shared password (PBKDF2-SHA256) and never leaves the device.
 */

export const SYNC_FORMAT = 1;
export const SYNC_ITERATIONS = 310_000;

export interface SyncFile {
  app: 'dennis-nadine-sync';
  format: number;
  /** Increases with every save – used to detect newer states. */
  version: number;
  savedAt: string;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: { name: 'AES-GCM'; iv: string; compression: 'gzip' | 'none' };
  data: string;
}

export function isSyncFile(value: unknown): value is SyncFile {
  const file = value as Partial<SyncFile> | null;
  return (
    !!file &&
    file.app === 'dennis-nadine-sync' &&
    typeof file.version === 'number' &&
    typeof file.data === 'string' &&
    typeof file.kdf?.salt === 'string' &&
    typeof file.kdf.iterations === 'number' &&
    typeof file.cipher?.iv === 'string'
  );
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(length = 16): string {
  return toHex(crypto.getRandomValues(new Uint8Array(length)));
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Non-extractable AES key – can be stored in IndexedDB but never read back as bytes. */
export async function deriveSyncKey(password: string, salt: string, iterations = SYNC_ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(password.trim()), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

export async function encryptState(plaintext: string, key: CryptoKey, salt: string, version: number, iterations = SYNC_ITERATIONS): Promise<SyncFile> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = encoder.encode(plaintext);
  const compression = canCompress() ? 'gzip' : 'none';
  const payload = compression === 'gzip' ? await pipe(raw, new CompressionStream('gzip')) : raw;
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload));
  return {
    app: 'dennis-nadine-sync',
    format: SYNC_FORMAT,
    version,
    savedAt: new Date().toISOString(),
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations, salt },
    cipher: { name: 'AES-GCM', iv: toBase64(iv), compression },
    data: toBase64(encrypted),
  };
}

/** Throws when the key is wrong (GCM authentication fails) or the file is damaged. */
export async function decryptState(file: SyncFile, key: CryptoKey): Promise<string> {
  const decrypted = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(file.cipher.iv) }, key, fromBase64(file.data)));
  const raw = file.cipher.compression === 'gzip' ? await pipe(decrypted, new DecompressionStream('gzip')) : decrypted;
  return decoder.decode(raw);
}

/** Tries a password against a remote file: the key if it opens it, otherwise null. */
export async function unlockSyncFile(file: SyncFile, password: string): Promise<{ key: CryptoKey; plaintext: string } | null> {
  const key = await deriveSyncKey(password, file.kdf.salt, file.kdf.iterations);
  try {
    return { key, plaintext: await decryptState(file, key) };
  } catch {
    return null;
  }
}
