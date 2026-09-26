import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import type { Recipe } from '@/types/models';
import { recipeRepository } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEditor } from '@/hooks/useEditor';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardGrid } from '@/components/cards/MediaCard';
import { applyFilter } from '@/lib/filters';
import { PATHS } from '@/app/paths';
import { RECIPE_FILTERS } from './config';
import { RecipeCard } from './RecipeCard';
import { RecipeForm } from './RecipeForm';

export default function RecipesPage() {
  useDocumentTitle('Rezepte');
  const navigate = useNavigate();
  const { items, loading } = useStore('recipes');
  const editor = useEditor<Recipe>();
  const actions = useEntityActions(recipeRepository, 'Rezept');
  const [filter, setFilter] = useState('all');

  const visible = useMemo(
    () => applyFilter(items, RECIPE_FILTERS, filter).sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.createdAt.localeCompare(a.createdAt)),
    [items, filter],
  );

  return (
    <>
      <PageHeader
        emoji="🍜"
        title="Unsere Rezepte"
        subtitle="Alles, was wir zusammen kochen wollen – vom TikTok-Fund bis zum Familienrezept."
        actions={
          <Button icon={Plus} onClick={editor.openNew}>
            Rezept hinzufügen
          </Button>
        }
      />
      <div className="flex flex-col gap-4">
        <FilterChips label="Rezepte filtern" filters={RECIPE_FILTERS} value={filter} onChange={setFilter} items={items} />
        {!loading && items.length === 0 ? (
          <EmptyState
            emoji="🍳"
            title="Unsere Küche wartet"
            text="Noch kein Rezept gespeichert. Einfach einen TikTok-Link einfügen oder ein Rezept selbst schreiben."
            action={
              <Button icon={Plus} onClick={editor.openNew}>
                Erstes Rezept speichern
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-muted">Hier passt gerade kein Rezept. 🥢</p>
        ) : (
          <CardGrid>
            {visible.map((recipe) => (
              <li key={recipe.id}>
                <RecipeCard
                  recipe={recipe}
                  onOpen={() => navigate(PATHS.recipe(recipe.id))}
                  onEdit={() => editor.openEdit(recipe)}
                  onDelete={() => void actions.remove(recipe, recipe.title)}
                  onToggleFavorite={() => void actions.patch(recipe.id, { favorite: !recipe.favorite })}
                />
              </li>
            ))}
          </CardGrid>
        )}
      </div>
      {editor.open && <RecipeForm recipe={editor.entity} onClose={editor.close} onSave={(draft, id) => actions.save(draft, id)} />}
    </>
  );
}
