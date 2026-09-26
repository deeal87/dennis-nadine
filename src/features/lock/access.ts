/**
 * Device password for the app. There is no server, so the password is set on
 * the website itself and lives in this browser: a slow PBKDF2 hash with a
 * random salt is stored in the settings; unlocking keeps that hash as a token
 * (for the session, or permanently on this device). Changing the password
 * invalidates the token everywhere on this device.
 */
import { settingsRepository } from '@/data/repositories';
import type { Settings } from '@/types/models';

export const PBKDF2_ITERATIONS = 210_000;
export const MIN_PASSWORD_LENGTH = 4;
const TOKEN_KEY = 'dn-access';

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function derivePasswordHash(password: string, salt: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
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

export function passwordError(password: string, repeat: string): string | undefined {
  if (password.trim().length < MIN_PASSWORD_LENGTH) return `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen, bitte.`;
  if (password.trim() !== repeat.trim()) return 'Die beiden Passwörter sind nicht gleich.';
  return undefined;
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

export function hasAccess(settings: Pick<Settings, 'accessHash'>): boolean {
  const hash = settings.accessHash;
  if (!hash) return false;
  return storages().some((storage) => {
    const token = storage.getItem(TOKEN_KEY);
    return token !== null && safeEqual(token, hash);
  });
}

function remember(hash: string, permanently: boolean): void {
  lock();
  try {
    (permanently ? localStorage : sessionStorage).setItem(TOKEN_KEY, hash);
  } catch {
    // Without storage access holds only until the page is reloaded.
  }
}

export function lock(): void {
  for (const storage of storages()) storage.removeItem(TOKEN_KEY);
}

/** Sets (or replaces) the device password and unlocks. */
export async function setPassword(password: string, permanently = true): Promise<void> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await derivePasswordHash(password, salt);
  await settingsRepository.update({ accessHash: hash, accessSalt: salt });
  remember(hash, permanently);
}

export async function verifyPassword(password: string, settings: Pick<Settings, 'accessHash' | 'accessSalt'>): Promise<boolean> {
  if (!settings.accessHash || !settings.accessSalt) return false;
  return safeEqual(await derivePasswordHash(password, settings.accessSalt), settings.accessHash);
}

export async function unlock(password: string, settings: Pick<Settings, 'accessHash' | 'accessSalt'>, permanently: boolean): Promise<boolean> {
  if (!(await verifyPassword(password, settings))) return false;
  remember(settings.accessHash!, permanently);
  return true;
}
