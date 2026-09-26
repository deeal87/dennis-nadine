import { describe, expect, it } from 'vitest';
import { buildSearchIndex, searchEntries } from './searchIndex';

const base = { createdAt: '', updatedAt: '' };
const index = buildSearchIndex({
  anime: [{ ...base, id: 'a', title: 'Dragon Ball', genres: ['Action'], status: 'planned' }],
  recipes: [{ ...base, id: 'r', kind: 'manual', title: 'Miso Ramen', category: 'suppe', vegetarian: false, favorite: false, ingredients: ['Drachenfrucht'], steps: [] }],
  dates: [{ ...base, id: 'd', name: 'Ramen Bar', category: 'restaurant', status: 'todo', tags: [], city: 'Düsseldorf' }],
  funkos: [],
  lego: [],
  memories: [],
  timeline: [],
  bucket: [{ ...base, id: 'b', title: 'Kyoto', category: 'reisen', priority: 'high', done: false }],
});

describe('global search', () => {
  it('finds across stores, title matches first', () => {
    expect(searchEntries(index, 'dra').map((e) => e.key)).toEqual(['Anime:a', 'Rezepte:r']);
  });

  it('requires every word and ignores accents and case', () => {
    expect(searchEntries(index, 'ramen dusseldorf').map((e) => e.key)).toEqual(['Dates:d']);
    expect(searchEntries(index, 'KYOTO')[0]?.href).toBe('/bucket-list?id=b');
  });

  it('returns nothing for blank queries', () => {
    expect(searchEntries(index, '   ')).toEqual([]);
  });
});
