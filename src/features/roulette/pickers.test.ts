import { describe, expect, it } from 'vitest';
import type { Anime } from '@/types/models';
import { pickAnime, pickSurprise } from './pickers';

const base = { createdAt: '', updatedAt: '', genres: [] };
const anime: Anime[] = [
  { ...base, id: 'done', title: 'Fertig', status: 'completed' },
  { ...base, id: 'open', title: 'Offen', status: 'planned' },
];

describe('what do we do today', () => {
  it('only suggests anime that are not finished', () => {
    for (let i = 0; i < 5; i++) expect(pickAnime(anime)?.id).toBe('open');
  });

  it('returns undefined when there is nothing to pick', () => {
    expect(pickSurprise({ anime: [], recipes: [], dates: [], bucket: [] })).toBeUndefined();
  });
});
