import type { LegoSet } from '@/types/models';
import { legoRepository } from '@/data/repositories';
import { CollectionPage } from '../collection/CollectionPage';
import type { CollectionConfig } from '../collection/types';

export const LEGO_CONFIG: CollectionConfig<LegoSet> = {
  domain: 'lego',
  store: 'lego',
  repository: legoRepository,
  wishlistRanking: 'lego-wishlist',
  title: 'Unsere LEGO Welt',
  subtitle: 'Stein auf Stein – gebaute Träume und Sets, die noch kommen.',
  wishlistTitle: 'Unsere LEGO Wishlist',
  emoji: '🧱',
  noun: 'Set',
  nounPlural: 'Sets',
  groupKey: 'theme',
  groupLabel: 'Theme',
  groupLabelPlural: 'Themes',
  numberKey: 'setNumber',
  numberLabel: 'Set-Nr.',
  extraFields: [
    { key: 'setNumber', label: 'Set Nummer', type: 'text', placeholder: 'z. B. 10280' },
    { key: 'theme', label: 'Theme', type: 'text', placeholder: 'z. B. Botanicals', groupSuggestions: true },
    { key: 'pieces', label: 'Anzahl Teile', type: 'number', min: 0 },
  ],
  describe: (l) => [l.theme, l.setNumber && `#${l.setNumber}`, l.pieces !== undefined && `${l.pieces.toLocaleString('de-DE')} Teile`].filter(Boolean).join(' · '),
  empty: { emoji: '🧱', title: 'Der erste Stein fehlt noch', text: 'Noch kein LEGO Set eingetragen. Welches bauen wir zuerst?' },
};

export default function LegoPage() {
  return <CollectionPage config={LEGO_CONFIG} />;
}
