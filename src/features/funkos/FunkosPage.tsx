import type { Funko } from '@/types/models';
import { funkoRepository } from '@/data/repositories';
import { CollectionPage } from '../collection/CollectionPage';
import type { CollectionConfig } from '../collection/types';

export const FUNKO_CONFIG: CollectionConfig<Funko> = {
  domain: 'funko',
  store: 'funkos',
  repository: funkoRepository,
  wishlistRanking: 'funko-wishlist',
  title: 'Unsere Funko Pops',
  subtitle: 'Kleine Köpfe, große Liebe – unsere Sammlung und Wünsche.',
  wishlistTitle: 'Unsere Funko Wishlist',
  emoji: '🎁',
  noun: 'Funko',
  nounPlural: 'Funkos',
  groupKey: 'series',
  groupLabel: 'Serie',
  groupLabelPlural: 'Serien',
  numberKey: 'number',
  numberLabel: 'Nummer',
  extraFields: [
    { key: 'series', label: 'Serie', type: 'text', placeholder: 'z. B. Dragon Ball', groupSuggestions: true },
    { key: 'number', label: 'Nummer', type: 'text', placeholder: 'z. B. 121' },
    { key: 'character', label: 'Character', type: 'text' },
    { key: 'releaseYear', label: 'Release Year', type: 'number', min: 1998, max: 2100 },
  ],
  describe: (f) => [f.series, f.number && `#${f.number}`, f.character !== f.name ? f.character : undefined].filter(Boolean).join(' · '),
  empty: { emoji: '✨', title: 'Unsere Sammlung beginnt hier', text: 'Noch kein Funko eingetragen. Vielleicht wird das unser erster?' },
};

export default function FunkosPage() {
  return <CollectionPage config={FUNKO_CONFIG} />;
}
