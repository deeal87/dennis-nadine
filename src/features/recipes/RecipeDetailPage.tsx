import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Clock, Pencil, Trash2, Users } from 'lucide-react';
import { recipeRepository } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button, buttonClasses } from '@/components/ui/Button';
import { SmartImage } from '@/components/ui/SmartImage';
import { Tag } from '@/components/ui/Tag';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { MediaPreview } from '@/components/media/MediaPreview';
import { PATHS } from '@/app/paths';
import { cn } from '@/lib/cn';
import { RECIPE_CATEGORY_META } from './config';
import { RecipeForm } from './RecipeForm';
import { recipeImage } from './recipeImage';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, loading } = useStore('recipes');
  const actions = useEntityActions(recipeRepository, 'Rezept');
  const [editing, setEditing] = useState(false);
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());
  const recipe = items.find((r) => r.id === id);
  useDocumentTitle(recipe?.title ?? 'Rezept');

  if (loading) return <PageSkeleton />;
  if (!recipe) {
    return (
      <EmptyState
        emoji="🥡"
        title="Rezept nicht gefunden"
        text="Vielleicht wurde es gelöscht?"
        action={
          <Link to={PATHS.recipes} className={buttonClasses()}>
            Zu allen Rezepten
          </Link>
        }
      />
    );
  }

  const category = RECIPE_CATEGORY_META[recipe.category];
  const toggleIngredient = (index: number) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={PATHS.recipes} className={buttonClasses('ghost', 'md', '-ml-3')}>
          <ArrowLeft className="size-5" aria-hidden /> Alle Rezepte
        </Link>
        <div className="flex gap-2">
          <Button variant={recipe.favorite ? 'soft' : 'secondary'} onClick={() => void actions.patch(recipe.id, { favorite: !recipe.favorite })} aria-pressed={recipe.favorite}>
            💖 {recipe.favorite ? 'Favorit' : 'Merken'}
          </Button>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
            Bearbeiten
          </Button>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={async () => {
              if (await actions.remove(recipe, recipe.title)) navigate(PATHS.recipes);
            }}
          >
            <span className="sr-only sm:not-sr-only">Löschen</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <SmartImage src={recipeImage(recipe)} alt={recipe.title} aspect="aspect-[4/3]" fallbackEmoji={category.emoji} className="card" eager />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Tag tone="peach">
              {category.emoji} {category.label}
            </Tag>
            {recipe.vegetarian && <Tag tone="mint">🌱 Vegetarisch</Tag>}
            {recipe.favorite && <Tag tone="rose">💖 Favorit</Tag>}
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{recipe.title}</h1>
          {recipe.description && <p className="text-muted">{recipe.description}</p>}
          <div className="flex flex-wrap gap-3 text-sm font-bold">
            {recipe.prepMinutes !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5">
                <Clock className="size-4 text-violet" aria-hidden /> {recipe.prepMinutes} Minuten
              </span>
            )}
            {recipe.servings !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5">
                <Users className="size-4 text-violet" aria-hidden /> {recipe.servings} Portionen
              </span>
            )}
          </div>
          {recipe.source && <p className="text-sm text-muted">Quelle: {recipe.source}</p>}
          {recipe.socialUrl && <MediaPreview url={recipe.socialUrl} title={recipe.title} thumbnailUrl={recipe.imageUrl} />}
        </div>
      </div>

      {(recipe.ingredients.length > 0 || recipe.steps.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {recipe.ingredients.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-2xl font-semibold">Zutaten</h2>
              <ol className="flex flex-col gap-1">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-2 hover:bg-surface-2">
                      <input type="checkbox" className="size-5 accent-[var(--rose)]" checked={checked.has(index)} onChange={() => toggleIngredient(index)} />
                      <span className="w-6 text-sm font-extrabold text-rose">{index + 1}.</span>
                      <span className={cn('transition', checked.has(index) && 'text-muted line-through')}>{ingredient}</span>
                    </label>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {recipe.steps.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="mb-3 text-2xl font-semibold">Zubereitung</h2>
              <ol className="flex flex-col gap-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="font-display text-3xl font-bold text-rose/70" aria-hidden>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="whitespace-pre-line pt-1.5 leading-relaxed">
                      <span className="sr-only">Schritt {index + 1}: </span>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}

      {recipe.notes && (
        <section className="card bg-peach-soft p-5">
          <h2 className="mb-1 text-lg font-semibold">📝 Unsere Notizen</h2>
          <p className="whitespace-pre-line">{recipe.notes}</p>
        </section>
      )}

      {editing && <RecipeForm recipe={recipe} onClose={() => setEditing(false)} onSave={(draft, rid) => actions.save(draft, rid)} />}
    </article>
  );
}
