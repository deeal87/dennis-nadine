import { pbkdf2Sync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { derivePasswordHash, PASSWORD_SALT, PBKDF2_ITERATIONS, safeEqual, SITE_PASSWORD_HASH, verifyPassword } from './access';

describe('site password', () => {
  it('derives the same PBKDF2-SHA256 hash as Node (used to generate SITE_PASSWORD_HASH)', async () => {
    const expected = pbkdf2Sync('Baby&Babe', 'salt', 1000, 32, 'sha256').toString('hex');
    expect(await derivePasswordHash('  Baby&Babe ', 'salt', 1000)).toBe(expected);
    expect(PASSWORD_SALT).toBeTruthy();
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100_000);
  });

  it('stores only a hash and rejects wrong passwords', async () => {
    expect(SITE_PASSWORD_HASH).toMatch(/^[0-9a-f]{64}$/);
    expect(await verifyPassword('falsch')).toBe(false);
    expect(await verifyPassword('')).toBe(false);
  });

  it('compares tokens safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
