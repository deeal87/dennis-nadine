import { ANIME_STATUSES, type Anime, type AnimeStatus, type Person, type Ratings } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { ChipGroup, FormGrid, NumberField, SelectField, TextAreaField, TextField } from '@/components/ui/form';
import { TagInput } from '@/components/ui/TagInput';
import { RatingsEditor } from '@/components/ui/RatingStars';
import { useDraft } from '@/hooks/useDraft';
import { hasErrors, imageError, optional, requiredError } from '@/lib/validation';
import { ImageField } from '../image-search/ImageField';
import { ANIME_STATUS_META, GENRE_SUGGESTIONS } from './config';

interface AnimeFormProps {
  anime?: Anime;
  onClose: () => void;
  onSave: (draft: Draft<Anime>, id?: string) => Promise<unknown>;
}

const STATUS_OPTIONS = ANIME_STATUSES.map((status) => ({ value: status, label: ANIME_STATUS_META[status].label, emoji: ANIME_STATUS_META[status].emoji }));
const PERSON_OPTIONS = [
  { value: 'dennis', label: 'Dennis (Baby)' },
  { value: 'nadine', label: 'Nadine (Babe)' },
] as const;

export function AnimeForm({ anime, onClose, onSave }: AnimeFormProps) {
  const { draft, set, setDraft, submitted, markSubmitted } = useDraft(() => ({
    title: anime?.title ?? '',
    coverUrl: anime?.coverUrl ?? '',
    genres: anime?.genres ?? [],
    status: anime?.status ?? ('planned' as AnimeStatus),
    episodes: anime?.episodes,
    watchedAt: anime?.watchedAt ?? '',
    notes: anime?.notes ?? '',
    interestedBy: anime?.interestedBy ?? ([] as Person[]),
    ratings: { dennisRating: anime?.dennisRating, nadineRating: anime?.nadineRating, sharedRating: anime?.sharedRating } as Ratings,
  }));

  const errors = { title: requiredError(draft.title, 'Der Titel'), coverUrl: imageError(draft.coverUrl) };

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    await onSave(
      {
        title: draft.title.trim(),
        coverUrl: optional(draft.coverUrl),
        genres: draft.genres,
        status: draft.status,
        episodes: draft.episodes,
        watchedAt: optional(draft.watchedAt),
        notes: optional(draft.notes),
        interestedBy: draft.interestedBy.length ? draft.interestedBy : undefined,
        ...draft.ratings,
      },
      anime?.id,
    );
  };

  return (
    <FormModal open onClose={onClose} title={anime ? 'Anime bearbeiten' : 'Anime hinzufügen'} onSubmit={submit}>
      <TextField label="Titel" value={draft.title} onChange={(v) => set('title', v)} error={submitted ? errors.title : undefined} required autoFocus />
      <FormGrid>
        <SelectField label="Status" value={draft.status} options={STATUS_OPTIONS} onChange={(v) => set('status', v)} />
        <NumberField label="Anzahl Episoden" value={draft.episodes} min={0} onChange={(v) => set('episodes', v)} />
        <TextField label="Gesehen am" type="date" value={draft.watchedAt} onChange={(v) => set('watchedAt', v)} />

      </FormGrid>
      <ImageField
        label="Cover"
        value={draft.coverUrl}
        onChange={(v) => set('coverUrl', v)}
        error={submitted ? errors.coverUrl : undefined}
        fallbackEmoji="🎬"
        search={{
          domain: 'anime',
          query: draft.title,
          onPick: ({ meta }) =>
            setDraft((d) => ({
              ...d,
              episodes: d.episodes ?? meta?.episodes,
              genres: d.genres.length ? d.genres : (meta?.genres ?? []).slice(0, 4),
            })),
        }}
      />
      <TagInput label="Genre" value={draft.genres} onChange={(v) => set('genres', v)} suggestions={GENRE_SUGGESTIONS} />
      <ChipGroup label="Wessen Wunsch?" options={PERSON_OPTIONS} value={draft.interestedBy} onChange={(v) => set('interestedBy', v)} />
      <RatingsEditor value={draft.ratings} onChange={(ratings) => setDraft((d) => ({ ...d, ratings }))} />
      <TextAreaField label="Notizen" value={draft.notes} onChange={(v) => set('notes', v)} placeholder="Lieblingsfolge, Zitate, wo wir aufgehört haben …" />
    </FormModal>
  );
}
