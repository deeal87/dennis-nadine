import type { BucketCategory, Priority } from '@/types/models';

export const BUCKET_CATEGORY_META: Record<BucketCategory, { label: string; emoji: string }> = {
  reisen: { label: 'Reisen', emoji: '✈️' },
  essen: { label: 'Essen', emoji: '🍜' },
  anime: { label: 'Anime', emoji: '🎬' },
  dates: { label: 'Dates', emoji: '❤️' },
  abenteuer: { label: 'Abenteuer', emoji: '🎢' },
  sonstiges: { label: 'Sonstiges', emoji: '🌎' },
};

export const PRIORITY_META: Record<Priority, { label: string; order: number }> = {
  high: { label: 'Hoch', order: 0 },
  medium: { label: 'Mittel', order: 1 },
  low: { label: 'Niedrig', order: 2 },
};
