import { describe, expect, it } from 'vitest';
import type { SeriesCatalog } from '@/types/models';
import { computeSeriesProgress, formatCatalogLine, parseCatalogLine } from './seriesProgress';

const catalog: SeriesCatalog = {
  id: 'db',
  domain: 'funko',
  name: 'Dragon Ball',
  createdAt: '',
  updatedAt: '',
  items: [
    { id: '1', name: 'Goku', number: '121' },
    { id: '2', name: 'Vegeta', number: '122' },
    { id: '3', name: 'Piccolo' },
  ],
};

describe('series progress', () => {
  it('counts owned figures by number or name and lists missing ones', () => {
    const [progress] = computeSeriesProgress(
      [
        { name: 'Son Goku', group: 'dragon ball', number: '121', owned: true },
        { name: 'piccolo', group: 'Dragon Ball', owned: true },
        { name: 'Vegeta', group: 'Dragon Ball', number: '122', owned: false },
      ],
      [catalog],
    );
    expect(progress).toMatchObject({ name: 'Dragon Ball', owned: 2, total: 3 });
    expect(progress?.missing.map((m) => m.name)).toEqual(['Vegeta']);
  });

  it('shows groups without catalog with an unknown total', () => {
    const result = computeSeriesProgress([{ name: 'Luffy', group: 'One Piece', owned: true }], [catalog]);
    expect(result.map((r) => [r.name, r.owned, r.total])).toEqual([
      ['Dragon Ball', 0, 3],
      ['One Piece', 1, undefined],
    ]);
  });

  it('parses and formats catalog lines', () => {
    expect(parseCatalogLine('#121 Goku')).toMatchObject({ number: '121', name: 'Goku' });
    expect(parseCatalogLine('10280 Blumenstrauß')).toMatchObject({ number: '10280', name: 'Blumenstrauß' });
    expect(parseCatalogLine('Piccolo')).toMatchObject({ name: 'Piccolo' });
    expect(parseCatalogLine('Piccolo')?.number).toBeUndefined();
    expect(parseCatalogLine('   ')).toBeNull();
    expect(formatCatalogLine({ id: 'x', name: 'Goku', number: '121' })).toBe('121 Goku');
  });
});
