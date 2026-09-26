import type { TimelineCategory } from '@/types/models';

export const TIMELINE_CATEGORY_META: Record<TimelineCategory, { label: string; emoji: string }> = {
  date: { label: 'Date', emoji: '❤️' },
  urlaub: { label: 'Urlaub', emoji: '✈️' },
  anime: { label: 'Anime', emoji: '🎬' },
  essen: { label: 'Essen', emoji: '🍜' },
  besonders: { label: 'Besonderer Moment', emoji: '🌟' },
  sonstiges: { label: 'Sonstiges', emoji: '✨' },
};
