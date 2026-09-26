import type { DateCategory, DateTag } from '@/types/models';

export const DATE_CATEGORY_META: Record<DateCategory, { label: string; plural: string; emoji: string }> = {
  place: { label: 'Ort', plural: 'Orte', emoji: '📍' },
  stay: { label: 'Übernachtung', plural: 'Übernachtungen', emoji: '🏨' },
  shopping: { label: 'Shopping Center', plural: 'Shopping', emoji: '🛍️' },
  restaurant: { label: 'Restaurant', plural: 'Restaurants', emoji: '🍜' },
  activity: { label: 'Aktivität', plural: 'Aktivitäten', emoji: '🎢' },
};

export const DATE_TAG_META: Record<DateTag, { label: string; emoji: string }> = {
  romantic: { label: 'Romantisch', emoji: '💕' },
  food: { label: 'Essen', emoji: '🍽️' },
  outdoor: { label: 'Outdoor', emoji: '🌳' },
  indoor: { label: 'Indoor', emoji: '🏠' },
  cheap: { label: 'Günstig', emoji: '🪙' },
  special: { label: 'Besonders', emoji: '🌟' },
};

export const PRICE_LABELS = ['', '€', '€€', '€€€', '€€€€'] as const;
