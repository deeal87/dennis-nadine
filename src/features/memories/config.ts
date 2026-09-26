import type { MemoryCategory } from '@/types/models';

export const MEMORY_CATEGORY_META: Record<MemoryCategory, { label: string; emoji: string }> = {
  date: { label: 'Date', emoji: '❤️' },
  urlaub: { label: 'Urlaub', emoji: '✈️' },
  alltag: { label: 'Alltag', emoji: '☕' },
  essen: { label: 'Essen', emoji: '🍜' },
  besonders: { label: 'Besonderer Moment', emoji: '🌟' },
  sonstiges: { label: 'Sonstiges', emoji: '📸' },
};
