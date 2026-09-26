import { describe, expect, it } from 'vitest';
import type { DatePlace } from '@/types/models';
import { getRouletteCandidates, ROULETTE_FILTERS, spinRoulette } from './roulette';

const place = (id: string, patch: Partial<DatePlace> = {}): DatePlace => ({
  id,
  name: id,
  category: 'place',
  status: 'todo',
  tags: [],
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
  ...patch,
});

const places = [
  place('ramen', { category: 'restaurant', tags: ['romantic'], priceRange: 2 }),
  place('park', { tags: ['outdoor', 'cheap'], status: 'done' }),
  place('mall', { category: 'shopping', priceRange: 3 }),
  place('onsen', { category: 'stay', tags: ['special'] }),
  place('kart', { category: 'activity', tags: ['indoor'], priceRange: 1 }),
];

const ids = (list: DatePlace[]) => list.map((p) => p.id).sort();

describe('date roulette filters', () => {
  it.each([
    ['all', ['kart', 'mall', 'onsen', 'park', 'ramen']],
    ['romantic', ['ramen']],
    ['food', ['ramen']],
    ['activity', ['kart']],
    ['outdoor', ['park']],
    ['indoor', ['kart', 'mall']],
    ['cheap', ['kart', 'park']],
    ['special', ['onsen']],
  ])('%s', (filterId, expected) => {
    expect(ids(getRouletteCandidates(places, { filterId }))).toEqual(expected);
  });

  it('has a unique id per registered filter', () => {
    expect(new Set(ROULETTE_FILTERS.map((f) => f.id)).size).toBe(ROULETTE_FILTERS.length);
  });

  it('falls back to "all" for unknown filters', () => {
    expect(getRouletteCandidates(places, { filterId: 'nope' })).toHaveLength(places.length);
  });

  it('can restrict to places we have not been to yet', () => {
    expect(ids(getRouletteCandidates(places, { onlyNew: true }))).not.toContain('park');
  });
});

describe('spinRoulette', () => {
  it('picks deterministically with an injected random source', () => {
    expect(spinRoulette(places, { random: () => 0 })?.id).toBe('ramen');
    expect(spinRoulette(places, { random: () => 0.999 })?.id).toBe('kart');
  });

  it('avoids repeating the previous result when possible', () => {
    const romantic = [place('a', { tags: ['romantic'] }), place('b', { tags: ['romantic'] })];
    for (let i = 0; i < 10; i++) expect(spinRoulette(romantic, { excludeId: 'a' })?.id).toBe('b');
    expect(spinRoulette([romantic[0]!], { excludeId: 'a' })?.id).toBe('a');
  });

  it('returns undefined when nothing matches', () => {
    expect(spinRoulette([], {})).toBeUndefined();
    expect(spinRoulette(places, { filterId: 'special', onlyNew: true, random: () => 0 })?.id).toBe('onsen');
    expect(spinRoulette([place('x')], { filterId: 'romantic' })).toBeUndefined();
  });
});
