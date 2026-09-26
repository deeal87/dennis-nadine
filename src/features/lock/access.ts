/**
 * Light-weight access gate for the public static site. The bundle only knows a
 * slow PBKDF2 hash of the password; unlocking stores that hash as a token
 * (per session, or permanently on this device). Changing the password
 * invalidates every stored token.
 *
 * This keeps casual visitors out – it is not server-side security. The data
 * itself never leaves the browser anyway.
 */
import access from '../../../access.config.json';

export const ACCESS_HASH: string = typeof __ACCESS_HASH__ === 'string' ? __ACCESS_HASH__ : '';
export const ACCESS_HINT: string = typeof __ACCESS_HINT__ === 'string' ? __ACCESS_HINT__ : '';
export const ACCESS_ENABLED = ACCESS_HASH.length > 0;

const TOKEN_KEY = 'dn-access';

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Same derivation as the build (vite.config.ts): PBKDF2-SHA256, 32 bytes, hex. */
export async function derivePasswordHash(password: string, salt = access.salt, iterations = access.iterations): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password.trim()), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations }, key, 256);
  return toHex(bits);
}

/** Constant-time comparison of two hex strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function read(storage: () => Storage): string | null {
  try {
    return storage().getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function hasAccess(): boolean {
  if (!ACCESS_ENABLED) return true;
  const token = read(() => localStorage) ?? read(() => sessionStorage);
  return token !== null && safeEqual(token, ACCESS_HASH);
}

export async function unlock(password: string, remember: boolean): Promise<boolean> {
  const hash = await derivePasswordHash(password);
  if (!safeEqual(hash, ACCESS_HASH)) return false;
  try {
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, hash);
  } catch {
    // Storage blocked (private mode): access holds until the tab is closed.
  }
  return true;
}

export function lock(): void {
  for (const storage of [() => localStorage, () => sessionStorage]) {
    try {
      storage().removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }
}
