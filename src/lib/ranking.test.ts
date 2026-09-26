import { describe, expect, it } from 'vitest';
import { addToRanking, moveInRanking, placeLabel, removeFromRanking, resolveRanking, sanitizeRanking } from './ranking';
import { RANKING_LIMITS } from '@/types/models';

describe('Top 3 ranking', () => {
  const limit = RANKING_LIMITS['anime-top3'];

  it('fills exactly three places and rejects a fourth', () => {
    let ids: string[] = [];
    for (const id of ['a', 'b', 'c']) {
      const result = addToRanking(ids, id, limit);
      expect(result.ok).toBe(true);
      if (result.ok) ids = result.ids;
    }
    expect(ids).toEqual(['a', 'b', 'c']);
    expect(addToRanking(ids, 'd', limit)).toEqual({ ok: false, reason: 'full' });
  });

  it('rejects duplicates', () => {
    expect(addToRanking(['a'], 'a', limit)).toEqual({ ok: false, reason: 'duplicate' });
  });

  it('inserts at a given place', () => {
    expect(addToRanking(['a', 'b'], 'x', limit, 0)).toEqual({ ok: true, ids: ['x', 'a', 'b'] });
  });

  it('moves place 1 to place 3 (drag & drop)', () => {
    expect(moveInRanking(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveInRanking(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('clamps out-of-range targets and ignores invalid sources', () => {
    expect(moveInRanking(['a', 'b', 'c'], 1, 99)).toEqual(['a', 'c', 'b']);
    expect(moveInRanking(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });

  it('labels places with medals, then numbers', () => {
    expect([0, 1, 2, 3, 9].map(placeLabel)).toEqual(['🥇', '🥈', '🥉', '4.', '10.']);
  });
});

describe('Wishlist Top 10', () => {
  const limit = RANKING_LIMITS['funko-wishlist'];
  const ten = Array.from({ length: 10 }, (_, i) => `w${i}`);

  it('allows at most 10 entries', () => {
    expect(addToRanking(ten.slice(0, 9), 'new', limit).ok).toBe(true);
    expect(addToRanking(ten, 'new', limit)).toEqual({ ok: false, reason: 'full' });
  });

  it('reorders deep in the list', () => {
    const moved = moveInRanking(ten, 9, 0);
    expect(moved[0]).toBe('w9');
    expect(moved).toHaveLength(10);
  });

  it('removes and sanitizes stale / duplicate ids', () => {
    expect(removeFromRanking(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    expect(sanitizeRanking(['a', 'gone', 'b', 'a'], new Set(['a', 'b']), limit)).toEqual(['a', 'b']);
    expect(sanitizeRanking(ten, new Set(ten), 3)).toEqual(['w0', 'w1', 'w2']);
  });

  it('resolves ids to entities in ranking order', () => {
    const items = [{ id: 'b' }, { id: 'a' }];
    expect(resolveRanking(['a', 'missing', 'b'], items)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});
