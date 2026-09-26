import type { Anime, TimelineEvent } from '@/types/models';
import type { Draft } from '../repositories';

/** Our day. Used across the app (hero, timeline, countdown). */
export const COUPLE = {
  dennis: { name: 'Dennis', nickname: 'Baby' },
  nadine: { name: 'Nadine', nickname: 'Babe' },
  specialDate: '2026-09-09',
} as const;

/**
 * Initial anime interests – deliberately "planned", nothing is marked as watched.
 * No cover images: the UI renders its own illustrated placeholder.
 */
export const SEED_ANIME: Draft<Anime>[] = [
  { title: 'Dragon Ball', genres: ['Action', 'Abenteuer'], status: 'planned', interestedBy: ['dennis'] },
  { title: 'Chihiros Reise ins Zauberland', genres: ['Fantasy', 'Abenteuer'], status: 'planned', interestedBy: ['nadine'] },
  { title: 'Prinzessin Mononoke', genres: ['Fantasy', 'Abenteuer'], status: 'planned', interestedBy: ['nadine'] },
  { title: 'Bubble', genres: ['Sci-Fi', 'Romantik'], status: 'planned', interestedBy: ['nadine'] },
  { title: 'One Piece', genres: ['Abenteuer', 'Action'], status: 'planned', interestedBy: ['nadine'] },
  { title: 'Die Apothekerin', genres: ['Mystery', 'Drama'], status: 'planned', interestedBy: ['nadine'] },
];

export const SEED_TIMELINE: Draft<TimelineEvent>[] = [
  { date: COUPLE.specialDate, title: '❤️ Dennis & Nadine', description: 'Baby & Babe – hier beginnt unsere Geschichte.', category: 'besonders' },
];
