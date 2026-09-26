import { useState } from 'react';
import { LoaderCircle, WandSparkles } from 'lucide-react';
import { RECIPE_CATEGORIES, type Recipe, type RecipeCategory, type RecipeKind } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { FormGrid, ListEditor, NumberField, SelectField, SwitchField, TextAreaField, TextField } from '@/components/ui/form';
import { Button } from '@/components/ui/Button';
import { MediaPreview } from '@/components/media/MediaPreview';
import { useDraft } from '@/hooks/useDraft';
import { canFetchPreview, fetchOEmbedPreview } from '@/lib/social';
import { hasErrors, imageError, optional, requiredError, urlError } from '@/lib/validation';
import { ImageField } from '../image-search/ImageField';
import { cn } from '@/lib/cn';
import { RECIPE_CATEGORY_META } from './config';

interface RecipeFormProps {
  recipe?: Recipe;
  onClose: () => void;
  onSave: (draft: Draft<Recipe>, id?: string) => Promise<unknown>;
}

const CATEGORY_OPTIONS = RECIPE_CATEGORIES.map((c) => ({ value: c, label: RECIPE_CATEGORY_META[c].label, emoji: RECIPE_CATEGORY_META[c].emoji }));

const KIND_TABS: Array<{ value: RecipeKind; label: string; emoji: string }> = [
  { value: 'social', label: 'TikTok / Social Link', emoji: '📱' },
  { value: 'manual', label: 'Manuelles Rezept', emoji: '✍️' },
];

const cleanList = (items: string[]) => items.map((i) => i.trim()).filter(Boolean);

export function RecipeForm({ recipe, onClose, onSave }: RecipeFormProps) {
  const { draft, set, setDraft, submitted, markSubmitted } = useDraft(() => ({
    kind: recipe?.kind ?? ('social' as RecipeKind),
    title: recipe?.title ?? '',
    description: recipe?.description ?? '',
    socialUrl: recipe?.socialUrl ?? '',
    imageUrl: recipe?.imageUrl ?? '',
    category: recipe?.category ?? ('hauptgericht' as RecipeCategory),
    vegetarian: recipe?.vegetarian ?? false,
    favorite: recipe?.favorite ?? false,
    servings: recipe?.servings,
    prepMinutes: recipe?.prepMinutes,
    ingredients: recipe?.ingredients.length ? recipe.ingredients : [''],
    steps: recipe?.steps.length ? recipe.steps : [''],
    notes: recipe?.notes ?? '',
    source: recipe?.source ?? '',
  }));
  const [preview, setPreview] = useState<'idle' | 'loading' | 'failed' | 'done'>('idle');
  const social = draft.kind === 'social';

  const errors = {
    title: requiredError(draft.title, social ? 'Der Titel' : 'Der Name'),
    socialUrl: social ? (requiredError(draft.socialUrl, 'Der Link') ?? urlError(draft.socialUrl)) : urlError(draft.socialUrl),
    imageUrl: imageError(draft.imageUrl),
  };

  const loadPreview = async () => {
    setPreview('loading');
    const result = await fetchOEmbedPreview(draft.socialUrl);
    if (!result) return setPreview('failed');
    setDraft((d) => ({
      ...d,
      title: d.title || result.title?.slice(0, 120) || d.title,
      imageUrl: d.imageUrl || result.thumbnailUrl || d.imageUrl,
      source: d.source || (result.author ? `@${result.author}` : d.source),
    }));
    setPreview('done');
  };

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    await onSave(
      {
        kind: draft.kind,
        title: draft.title.trim(),
        description: optional(draft.description),
        socialUrl: optional(draft.socialUrl),
        imageUrl: optional(draft.imageUrl),
        category: draft.category,
        vegetarian: draft.vegetarian,
        favorite: draft.favorite,
        servings: draft.servings,
        prepMinutes: draft.prepMinutes,
        ingredients: cleanList(draft.ingredients),
        steps: cleanList(draft.steps),
        notes: optional(draft.notes),
        source: optional(draft.source),
      },
      recipe?.id,
    );
  };

  const details = (
    <>
      <ListEditor label="Zutaten" items={draft.ingredients} onChange={(v) => set('ingredients', v)} placeholder="z. B. 200 g Udon-Nudeln" addLabel="Zutat hinzufügen" />
      <ListEditor
        label="Zubereitung"
        items={draft.steps}
        onChange={(v) => set('steps', v)}
        placeholder="Was passiert in diesem Schritt?"
        addLabel="Schritt hinzufügen"
        numbered
        multiline
      />
    </>
  );

  return (
    <FormModal open onClose={onClose} title={recipe ? 'Rezept bearbeiten' : 'Rezept hinzufügen'} onSubmit={submit}>
      <div role="radiogroup" aria-label="Art des Rezepts" className="grid grid-cols-2 gap-2 rounded-3xl bg-surface-2 p-1.5">
        {KIND_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="radio"
            aria-checked={draft.kind === tab.value}
            onClick={() => set('kind', tab.value)}
            className={cn(
              'min-h-11 rounded-2xl px-3 text-sm font-bold transition',
              draft.kind === tab.value ? 'bg-surface text-rose shadow-[var(--shadow-soft)]' : 'text-muted hover:text-ink',
            )}
          >
            <span aria-hidden>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      {social && (
        <>
          <TextField
            label="URL"
            type="url"
            inputMode="url"
            placeholder="https://www.tiktok.com/@…/video/…"
            value={draft.socialUrl}
            onChange={(v) => {
              set('socialUrl', v);
              setPreview('idle');
            }}
            error={submitted ? errors.socialUrl : undefined}
            hint="TikTok, Instagram, YouTube, Pinterest oder jede andere Rezeptseite."
            autoFocus={!recipe}
          />
          {canFetchPreview(draft.socialUrl) && !errors.socialUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="soft" size="sm" icon={preview === 'loading' ? LoaderCircle : WandSparkles} onClick={loadPreview} disabled={preview === 'loading'}>
                Titel & Vorschaubild von TikTok holen
              </Button>
              <span className="text-xs text-muted" role="status">
                {preview === 'failed' && 'TikTok hat keine Vorschau geliefert – einfach selbst ausfüllen.'}
                {preview === 'done' && 'Vorschau übernommen ✨'}
                {preview === 'idle' && 'Fragt einmalig bei TikTok nach.'}
              </span>
            </div>
          )}
          {!errors.socialUrl && draft.socialUrl && (
            <MediaPreview url={draft.socialUrl} title={draft.title || undefined} thumbnailUrl={optional(draft.imageUrl)} allowEmbed={false} />
          )}
        </>
      )}

      <TextField
        label={social ? 'Titel' : 'Name'}
        value={draft.title}
        onChange={(v) => set('title', v)}
        error={submitted ? errors.title : undefined}
        autoFocus={!social && !recipe}
      />
      {social && <TextAreaField label="Beschreibung" value={draft.description} onChange={(v) => set('description', v)} />}

      <FormGrid>
        <SelectField label="Kategorie" value={draft.category} options={CATEGORY_OPTIONS} onChange={(v) => set('category', v)} />

        <NumberField label="Portionen" value={draft.servings} min={0} onChange={(v) => set('servings', v)} />
        <NumberField label="Zubereitungszeit (Minuten)" value={draft.prepMinutes} min={0} onChange={(v) => set('prepMinutes', v)} />
      </FormGrid>

      <ImageField
        label={social ? 'Vorschaubild' : 'Bild'}
        value={draft.imageUrl}
        onChange={(v) => set('imageUrl', v)}
        error={submitted ? errors.imageUrl : undefined}
        fallbackEmoji={RECIPE_CATEGORY_META[draft.category].emoji}
        search={{ domain: 'recipe', query: draft.title }}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <SwitchField label="🌱 Vegetarisch" checked={draft.vegetarian} onChange={(v) => set('vegetarian', v)} />
        <SwitchField label="💖 Favorit" checked={draft.favorite} onChange={(v) => set('favorite', v)} />
      </div>

      {social ? (
        <details className="rounded-3xl border border-line p-4 [&[open]>summary]:mb-4">
          <summary className="cursor-pointer font-bold">Zutaten & Zubereitung ergänzen (optional)</summary>
          <div className="flex flex-col gap-4">{details}</div>
        </details>
      ) : (
        details
      )}

      <TextAreaField label="Notizen" value={draft.notes} onChange={(v) => set('notes', v)} placeholder="Nächstes Mal mehr Knoblauch 🧄" />
      <TextField
        label="Quelle"
        value={draft.source}
        onChange={(v) => set('source', v)}
        placeholder={social ? '@kanal oder Name' : 'Oma, Kochbuch, Website …'}
      />
    </FormModal>
  );
}
