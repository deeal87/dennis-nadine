/**
 * Central domain model. Every persisted entity extends BaseEntity.
 * Dates are ISO strings (YYYY-MM-DD for calendar dates, full ISO for timestamps).
 */

export type Person = 'dennis' | 'nadine';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Ratings from 0 (not rated) to 5. */
export interface Ratings {
  dennisRating?: number;
  nadineRating?: number;
  sharedRating?: number;
}

// ---------- Anime ----------
export const ANIME_STATUSES = ['planned', 'watching', 'completed', 'paused', 'dropped'] as const;
export type AnimeStatus = (typeof ANIME_STATUSES)[number];

export interface Anime extends BaseEntity, Ratings {
  title: string;
  coverUrl?: string;
  genres: string[];
  status: AnimeStatus;
  episodes?: number;
  watchedAt?: string;
  notes?: string;
  /** Who brought this anime in as an interest. */
  interestedBy?: Person[];
}

// ---------- Recipes ----------
export const RECIPE_CATEGORIES = [
  'hauptgericht',
  'vorspeise',
  'suppe',
  'dessert',
  'snack',
  'fruehstueck',
  'getraenk',
  'sonstiges',
] as const;
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
export type RecipeKind = 'social' | 'manual';

export interface Recipe extends BaseEntity {
  kind: RecipeKind;
  title: string;
  description?: string;
  imageUrl?: string;
  category: RecipeCategory;
  vegetarian: boolean;
  favorite: boolean;
  servings?: number;
  prepMinutes?: number;
  ingredients: string[];
  steps: string[];
  notes?: string;
  source?: string;
  socialUrl?: string;
}

// ---------- Dates ----------
export const DATE_CATEGORIES = ['place', 'stay', 'shopping', 'restaurant', 'activity'] as const;
export type DateCategory = (typeof DATE_CATEGORIES)[number];

export const DATE_TAGS = ['romantic', 'food', 'outdoor', 'indoor', 'cheap', 'special'] as const;
export type DateTag = (typeof DATE_TAGS)[number];

export type DateStatus = 'done' | 'todo';

export interface DatePlace extends BaseEntity, Ratings {
  name: string;
  category: DateCategory;
  status: DateStatus;
  tags: DateTag[];
  description?: string;
  address?: string;
  city?: string;
  mapsUrl?: string;
  date?: string;
  /** 1 = günstig … 4 = besonders teuer */
  priceRange?: number;
  notes?: string;
  photoUrl?: string;
}

// ---------- Collections (Funko & LEGO) ----------
export type OwnershipStatus = 'owned' | 'wishlist';

interface Collectible extends BaseEntity {
  name: string;
  imageUrl?: string;
  status: OwnershipStatus;
  favorite: boolean;
  notes?: string;
}

export interface Funko extends Collectible {
  series?: string;
  number?: string;
  character?: string;
  releaseYear?: number;
}

export interface LegoSet extends Collectible {
  setNumber?: string;
  theme?: string;
  pieces?: number;
}

export type CollectionDomain = 'funko' | 'lego';

/** User-extendable catalog of a known series / theme, used for "7 / 15" progress. */
export interface SeriesCatalog extends BaseEntity {
  domain: CollectionDomain;
  name: string;
  items: SeriesCatalogItem[];
}

export interface SeriesCatalogItem {
  id: string;
  name: string;
  number?: string;
}

// ---------- Memories ----------
export const MEMORY_CATEGORIES = ['date', 'urlaub', 'alltag', 'essen', 'besonders', 'sonstiges'] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export interface Memory extends BaseEntity {
  title: string;
  date?: string;
  description?: string;
  category: MemoryCategory;
  instagramUrl?: string;
  tiktokUrl?: string;
  imageUrl?: string;
}

// ---------- Timeline ----------
export const TIMELINE_CATEGORIES = ['date', 'urlaub', 'anime', 'essen', 'besonders', 'sonstiges'] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export interface TimelineEvent extends BaseEntity {
  date: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category: TimelineCategory;
}

// ---------- Bucket list ----------
export const BUCKET_CATEGORIES = ['reisen', 'essen', 'anime', 'dates', 'abenteuer', 'sonstiges'] as const;
export type BucketCategory = (typeof BUCKET_CATEGORIES)[number];
export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface BucketItem extends BaseEntity {
  title: string;
  description?: string;
  category: BucketCategory;
  priority: Priority;
  done: boolean;
  /** Target date, or the day it was done. */
  date?: string;
}

// ---------- Rankings (Top 3 / Wishlists) ----------
export const RANKING_IDS = ['anime-top3', 'funko-wishlist', 'lego-wishlist'] as const;
export type RankingId = (typeof RANKING_IDS)[number];

/** Ordered list of entity ids; index 0 = place 1. */
export interface Ranking {
  id: RankingId;
  itemIds: string[];
  updatedAt: string;
}

export const RANKING_LIMITS: Record<RankingId, number> = {
  'anime-top3': 3,
  'funko-wishlist': 10,
  'lego-wishlist': 10,
};

// ---------- Settings ----------
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  id: 'settings';
  theme: ThemePreference;
  /** Set once the initial seed has been written. */
  seededAt?: string;
  /** Suggest matching online images while typing (default: on). */
  autoImageSuggestions?: boolean;
  /** Last used Bundesland for "Neu entdecken" (ISO 3166-2, e.g. DE-NW). */
  discoverRegion?: string;
  /** Sync (device-only, never exported): AES key from the shared password, its salt, last synced version. */
  syncKey?: CryptoKey;
  syncSalt?: string;
  syncVersion?: number;
  syncSavedAt?: string;
  /** GitHub token for saving – only on devices that save. */
  githubToken?: string;
}
