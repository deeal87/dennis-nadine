import { pbkdf2Sync } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { freshDatabase } from '@/test/db';
import { settingsRepository } from '@/data/repositories';
import { derivePasswordHash, passwordError, PBKDF2_ITERATIONS, safeEqual, setPassword, verifyPassword } from './access';

describe('device password', () => {
  beforeEach(freshDatabase);

  it('derives a standard PBKDF2-SHA256 hash', async () => {
    const expected = pbkdf2Sync('Baby&Babe', 'salt', 1000, 32, 'sha256').toString('hex');
    expect(await derivePasswordHash('  Baby&Babe ', 'salt', 1000)).toBe(expected);
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100_000);
  });

  it('stores only a salted hash and verifies it', async () => {
    await setPassword('Kirschblüte');
    const settings = await settingsRepository.get();
    expect(settings.accessHash).toMatch(/^[0-9a-f]{64}$/);
    expect(settings.accessSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(settings)).not.toContain('Kirschblüte');
    expect(await verifyPassword('Kirschblüte', settings)).toBe(true);
    expect(await verifyPassword('kirschblüte', settings)).toBe(false);
    expect(await verifyPassword('Kirschblüte', {})).toBe(false);
  });

  it('validates new passwords', () => {
    expect(passwordError('abc', 'abc')).toMatch(/Mindestens/);
    expect(passwordError('abcd', 'abce')).toMatch(/nicht gleich/);
    expect(passwordError('abcd', 'abcd')).toBeUndefined();
  });

  it('compares tokens safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
