import type { Recipe, RecipeCategory } from '@/types/models';
import type { FilterDef } from '@/lib/filters';

export const RECIPE_CATEGORY_META: Record<RecipeCategory, { label: string; emoji: string }> = {
  hauptgericht: { label: 'Hauptgericht', emoji: '🍛' },
  vorspeise: { label: 'Vorspeise', emoji: '🥗' },
  suppe: { label: 'Suppe', emoji: '🍜' },
  dessert: { label: 'Dessert', emoji: '🍰' },
  snack: { label: 'Snack', emoji: '🍙' },
  fruehstueck: { label: 'Frühstück', emoji: '🥞' },
  getraenk: { label: 'Getränk', emoji: '🧋' },
  sonstiges: { label: 'Sonstiges', emoji: '🍽️' },
};

/** Recipes up to this many minutes count as "Schnell". */
export const QUICK_RECIPE_MINUTES = 30;

export const RECIPE_FILTERS: readonly FilterDef<Recipe>[] = [
  { id: 'all', label: 'Alle', matches: () => true },
  { id: 'favorites', label: 'Favoriten', emoji: '💖', matches: (r) => r.favorite },
  { id: 'quick', label: 'Schnell', emoji: '⚡', matches: (r) => r.prepMinutes !== undefined && r.prepMinutes <= QUICK_RECIPE_MINUTES },
  { id: 'vegetarian', label: 'Vegetarisch', emoji: '🌱', matches: (r) => r.vegetarian },
  { id: 'dessert', label: 'Dessert', emoji: '🍰', matches: (r) => r.category === 'dessert' },
  { id: 'main', label: 'Hauptgericht', emoji: '🍛', matches: (r) => r.category === 'hauptgericht' },
  { id: 'social', label: 'Aus Social Media', emoji: '📱', matches: (r) => r.kind === 'social' },
];
