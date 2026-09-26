import { Clock } from 'lucide-react';
import type { Recipe } from '@/types/models';
import { CornerToggle, EditDeleteActions, MediaCard } from '@/components/cards/MediaCard';
import { Tag } from '@/components/ui/Tag';
import { PlatformBadge } from '@/components/media/MediaPreview';
import { RECIPE_CATEGORY_META } from './config';
import { recipeImage } from './recipeImage';

interface RecipeCardProps {
  recipe: Recipe;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

export function RecipeCard({ recipe, onOpen, onEdit, onDelete, onToggleFavorite }: RecipeCardProps) {
  const category = RECIPE_CATEGORY_META[recipe.category];
  return (
    <MediaCard
      title={recipe.title}
      onOpen={onOpen}
      image={recipeImage(recipe)}
      fallbackEmoji={category.emoji}
      badges={
        <>
          {recipe.kind === 'social' && <PlatformBadge url={recipe.socialUrl} />}
          {recipe.vegetarian && <Tag tone="mint">🌱 Veggie</Tag>}
        </>
      }
      corner={
        <CornerToggle active={recipe.favorite} label={recipe.favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'} onClick={onToggleFavorite}>
          💖
        </CornerToggle>
      }
      footer={<EditDeleteActions label={recipe.title} onEdit={onEdit} onDelete={onDelete} />}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          {category.emoji} {category.label}
        </span>
        {recipe.prepMinutes !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {recipe.prepMinutes} Min.
          </span>
        )}
      </div>
      {recipe.source && <p className="truncate text-xs">Quelle: {recipe.source}</p>}
    </MediaCard>
  );
}
