/**
 * Date roulette: filter registry + random pick. Add a filter by appending to
 * ROULETTE_FILTERS – the UI renders whatever is registered here.
 */
import type { DatePlace } from '@/types/models';
import { pickRandom, type RandomSource } from '@/lib/random';
import type { FilterDef } from '@/lib/filters';

export const ROULETTE_FILTERS: readonly FilterDef<DatePlace>[] = [
  { id: 'all', label: 'Alle', emoji: '✨', matches: () => true },
  { id: 'romantic', label: 'Romantisch', emoji: '💕', matches: (p) => p.tags.includes('romantic') },
  { id: 'food', label: 'Essen', emoji: '🍜', matches: (p) => p.category === 'restaurant' || p.tags.includes('food') },
  { id: 'activity', label: 'Aktivität', emoji: '🎢', matches: (p) => p.category === 'activity' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌳', matches: (p) => p.tags.includes('outdoor') },
  { id: 'indoor', label: 'Indoor', emoji: '🏠', matches: (p) => p.tags.includes('indoor') || p.category === 'shopping' },
  { id: 'cheap', label: 'Günstig', emoji: '🪙', matches: (p) => p.tags.includes('cheap') || p.priceRange === 1 },
  { id: 'special', label: 'Besondere Dates', emoji: '🌟', matches: (p) => p.tags.includes('special') || p.category === 'stay' },
];

export interface SpinOptions {
  filterId?: string;
  /** Only places we have not been to yet. */
  onlyNew?: boolean;
  /** Avoid repeating the previous result when there is an alternative. */
  excludeId?: string;
  random?: RandomSource;
}

export function getRouletteCandidates(places: readonly DatePlace[], { filterId = 'all', onlyNew = false }: SpinOptions = {}): DatePlace[] {
  const filter = ROULETTE_FILTERS.find((f) => f.id === filterId) ?? ROULETTE_FILTERS[0]!;
  return places.filter((place) => filter.matches(place) && (!onlyNew || place.status === 'todo'));
}

export function spinRoulette(places: readonly DatePlace[], options: SpinOptions = {}): DatePlace | undefined {
  const candidates = getRouletteCandidates(places, options);
  const pool = candidates.length > 1 && options.excludeId ? candidates.filter((p) => p.id !== options.excludeId) : candidates;
  return pickRandom(pool, options.random);
}
