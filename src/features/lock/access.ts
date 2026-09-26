/**
 * Site password. There is one fixed password for everybody; the code only
 * contains a slow PBKDF2 hash of it, never the password itself. Unlocking
 * stores that hash as a token (for the session, or permanently on this
 * device). To change the password, replace SITE_PASSWORD_HASH with the output
 * of: node -e "console.log(require('crypto').pbkdf2Sync(process.argv[1], 'dennis-nadine|site-password', 210000, 32, 'sha256').toString('hex'))" NEW_PASSWORD
 */

export const PASSWORD_SALT = 'dennis-nadine|site-password';
export const PBKDF2_ITERATIONS = 210_000;
export const SITE_PASSWORD_HASH = 'd99b435677c259bc9f5d5476100be9fc5ae0dc72db2abc0393e4ee39257b7639';
const TOKEN_KEY = 'dn-access';

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function derivePasswordHash(password: string, salt = PASSWORD_SALT, iterations = PBKDF2_ITERATIONS): Promise<string> {
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

export async function verifyPassword(password: string): Promise<boolean> {
  return safeEqual(await derivePasswordHash(password), SITE_PASSWORD_HASH);
}

function storages(): Storage[] {
  const list: Storage[] = [];
  for (const get of [() => localStorage, () => sessionStorage]) {
    try {
      list.push(get());
    } catch {
      // Storage blocked (private mode) – skip.
    }
  }
  return list;
}

export function hasAccess(): boolean {
  return storages().some((storage) => {
    const token = storage.getItem(TOKEN_KEY);
    return token !== null && safeEqual(token, SITE_PASSWORD_HASH);
  });
}

export function lock(): void {
  for (const storage of storages()) storage.removeItem(TOKEN_KEY);
}

export async function unlock(password: string, permanently: boolean): Promise<boolean> {
  if (!(await verifyPassword(password))) return false;
  lock();
  try {
    (permanently ? localStorage : sessionStorage).setItem(TOKEN_KEY, SITE_PASSWORD_HASH);
  } catch {
    // Without storage, access holds until the page is reloaded.
  }
  return true;
}
