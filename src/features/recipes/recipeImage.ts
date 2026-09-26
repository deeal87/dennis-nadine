import type { Recipe } from '@/types/models';
import { getDerivedThumbnail } from '@/lib/social';

/** Stored image, otherwise a thumbnail derivable from the social link. */
export function recipeImage(recipe: Recipe): string | undefined {
  return recipe.imageUrl ?? getDerivedThumbnail(recipe.socialUrl);
}
