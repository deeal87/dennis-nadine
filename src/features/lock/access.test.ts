import { pbkdf2Sync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import access from '../../../access.config.json';
import { derivePasswordHash, safeEqual } from './access';

describe('password gate', () => {
  it('derives exactly the hash the build injects', async () => {
    const expected = pbkdf2Sync('Baby&Babe 09.09.', access.salt, access.iterations, 32, 'sha256').toString('hex');
    expect(await derivePasswordHash('Baby&Babe 09.09.')).toBe(expected);
    expect(await derivePasswordHash('  Baby&Babe 09.09.  ')).toBe(expected);
    expect(await derivePasswordHash('baby&babe 09.09.')).not.toBe(expected);
  });

  it('compares tokens safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
