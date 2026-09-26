/**
 * Random pickers for "Was machen wir heute?". Pure: they take data + a random
 * source and return a presentation model for the roulette dialog.
 */
import type { Anime, BucketItem, DatePlace, Recipe } from '@/types/models';
import { pickRandom, type RandomSource } from '@/lib/random';
import { PATHS, withDetail } from '@/app/paths';
import { DATE_CATEGORY_META } from '../dates/config';
import { RECIPE_CATEGORY_META } from '../recipes/config';
import { BUCKET_CATEGORY_META } from '../bucket-list/config';
import { ANIME_STATUS_META } from '../anime/config';
import { recipeImage } from '../recipes/recipeImage';
import type { PickResult } from './RouletteDialog';

export function dateToPick(place: DatePlace): PickResult {
  const meta = DATE_CATEGORY_META[place.category];
  return {
    id: place.id,
    title: place.name,
    emoji: meta.emoji,
    kindLabel: `${meta.emoji} ${meta.label}`,
    lines: [
      ...(place.city || place.address ? [`📍 ${place.city ?? place.address}`] : []),
      place.status === 'todo' ? '❤️ Ihr wart noch nicht dort' : '🔁 Schon erlebt – Zeit für ein Wiedersehen',
    ],
    imageUrl: place.photoUrl,
    href: withDetail(PATHS.dates, place.id),
    mapsUrl: place.mapsUrl,
    address: place.address,
  };
}

export function animeToPick(anime: Anime): PickResult {
  const status = ANIME_STATUS_META[anime.status];
  return {
    id: anime.id,
    title: anime.title,
    emoji: '🎬',
    kindLabel: '🎬 Anime-Abend',
    lines: [`${status.emoji} ${status.label}`, ...(anime.genres.length ? [anime.genres.join(' · ')] : [])],
    imageUrl: anime.coverUrl,
    href: withDetail(PATHS.anime, anime.id),
  };
}

export function recipeToPick(recipe: Recipe): PickResult {
  const meta = RECIPE_CATEGORY_META[recipe.category];
  return {
    id: recipe.id,
    title: recipe.title,
    emoji: meta.emoji,
    kindLabel: '🍜 Heute kochen wir',
    lines: [`${meta.emoji} ${meta.label}`, ...(recipe.prepMinutes !== undefined ? [`⏱️ ${recipe.prepMinutes} Minuten`] : [])],
    imageUrl: recipeImage(recipe),
    href: PATHS.recipe(recipe.id),
  };
}

export function bucketToPick(item: BucketItem): PickResult {
  const meta = BUCKET_CATEGORY_META[item.category];
  return {
    id: item.id,
    title: item.title,
    emoji: meta.emoji,
    kindLabel: '🌠 Von unserer Bucket List',
    lines: item.description ? [item.description] : [],
    href: withDetail(PATHS.bucket, item.id),
  };
}

function pickAvoiding<T extends { id: string }>(items: readonly T[], previousId: string | undefined, random?: RandomSource): T | undefined {
  const pool = items.length > 1 && previousId ? items.filter((i) => i.id !== previousId) : items;
  return pickRandom(pool, random);
}

/** Anime we could start or continue (not finished, not dropped). */
export function pickAnime(anime: readonly Anime[], previousId?: string, random?: RandomSource): PickResult | undefined {
  const open = anime.filter((a) => a.status === 'planned' || a.status === 'watching' || a.status === 'paused');
  const picked = pickAvoiding(open, previousId, random);
  return picked && animeToPick(picked);
}

export function pickRecipe(recipes: readonly Recipe[], previousId?: string, random?: RandomSource): PickResult | undefined {
  const picked = pickAvoiding(recipes, previousId, random);
  return picked && recipeToPick(picked);
}

export interface SurpriseSource {
  anime: readonly Anime[];
  recipes: readonly Recipe[];
  dates: readonly DatePlace[];
  bucket: readonly BucketItem[];
}

/** Anything goes: an open anime, a recipe, a new date or an open bucket list dream. */
export function pickSurprise(source: SurpriseSource, previousId?: string, random?: RandomSource): PickResult | undefined {
  const all: PickResult[] = [
    ...source.anime.filter((a) => a.status !== 'completed' && a.status !== 'dropped').map(animeToPick),
    ...source.recipes.map(recipeToPick),
    ...source.dates.filter((d) => d.status === 'todo').map(dateToPick),
    ...source.bucket.filter((b) => !b.done).map(bucketToPick),
  ];
  return pickAvoiding(all, previousId, random);
}
