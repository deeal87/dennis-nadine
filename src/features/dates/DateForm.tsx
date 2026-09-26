import { DATE_CATEGORIES, DATE_TAGS, type DateCategory, type DatePlace, type DateStatus, type DateTag, type Ratings } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { ChipGroup, FormGrid, SelectField, TextAreaField, TextField } from '@/components/ui/form';
import { RatingsEditor } from '@/components/ui/RatingStars';
import { useDraft } from '@/hooks/useDraft';
import { hasErrors, imageError, optional, requiredError, urlError } from '@/lib/validation';
import { ImageField } from '../image-search/ImageField';
import { isGoogleMapsUrl } from '@/lib/maps';
import { DATE_CATEGORY_META, DATE_TAG_META, PRICE_LABELS } from './config';

interface DateFormProps {
  place?: DatePlace;
  onClose: () => void;
  onSave: (draft: Draft<DatePlace>, id?: string) => Promise<unknown>;
}

const CATEGORY_OPTIONS = DATE_CATEGORIES.map((c) => ({ value: c, label: DATE_CATEGORY_META[c].label, emoji: DATE_CATEGORY_META[c].emoji }));
const TAG_OPTIONS = DATE_TAGS.map((t) => ({ value: t, label: DATE_TAG_META[t].label, emoji: DATE_TAG_META[t].emoji }));
const STATUS_OPTIONS = [
  { value: 'todo', label: 'Noch ausprobieren', emoji: '🌱' },
  { value: 'done', label: 'Bereits erlebt', emoji: '❤️' },
] as const;
const PRICE_OPTIONS = [
  { value: '', label: 'Keine Angabe' },
  ...[1, 2, 3, 4].map((p) => ({ value: String(p), label: `${PRICE_LABELS[p]} ${['günstig', 'mittel', 'gehoben', 'besonders'][p - 1]}` })),
];

export function DateForm({ place, onClose, onSave }: DateFormProps) {
  const { draft, set, setDraft, submitted, markSubmitted } = useDraft(() => ({
    name: place?.name ?? '',
    category: place?.category ?? ('restaurant' as DateCategory),
    status: place?.status ?? ('todo' as DateStatus),
    tags: place?.tags ?? ([] as DateTag[]),
    description: place?.description ?? '',
    address: place?.address ?? '',
    city: place?.city ?? '',
    mapsUrl: place?.mapsUrl ?? '',
    date: place?.date ?? '',
    priceRange: place?.priceRange ? String(place.priceRange) : '',
    notes: place?.notes ?? '',
    photoUrl: place?.photoUrl ?? '',
    ratings: { dennisRating: place?.dennisRating, nadineRating: place?.nadineRating, sharedRating: place?.sharedRating } as Ratings,
  }));

  const errors = { name: requiredError(draft.name, 'Der Name'), mapsUrl: urlError(draft.mapsUrl), photoUrl: imageError(draft.photoUrl) };
  const mapsHint =
    draft.mapsUrl && !errors.mapsUrl && !isGoogleMapsUrl(draft.mapsUrl)
      ? 'Das sieht nicht nach Google Maps aus – der Link funktioniert trotzdem.'
      : 'In Google Maps auf „Teilen“ tippen und den Link hier einfügen.';

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    await onSave(
      {
        name: draft.name.trim(),
        category: draft.category,
        status: draft.status,
        tags: draft.tags,
        description: optional(draft.description),
        address: optional(draft.address),
        city: optional(draft.city),
        mapsUrl: optional(draft.mapsUrl),
        date: optional(draft.date),
        priceRange: draft.priceRange ? Number(draft.priceRange) : undefined,
        notes: optional(draft.notes),
        photoUrl: optional(draft.photoUrl),
        ...draft.ratings,
      },
      place?.id,
    );
  };

  return (
    <FormModal open onClose={onClose} title={place ? 'Abenteuer bearbeiten' : 'Neues Abenteuer'} onSubmit={submit}>
      <TextField label="Name" value={draft.name} onChange={(v) => set('name', v)} error={submitted ? errors.name : undefined} autoFocus />
      <FormGrid>
        <SelectField label="Kategorie" value={draft.category} options={CATEGORY_OPTIONS} onChange={(v) => set('category', v)} />
        <SelectField label="Status" value={draft.status} options={STATUS_OPTIONS} onChange={(v) => set('status', v)} />
      </FormGrid>
      <ChipGroup label="Passt zu" options={TAG_OPTIONS} value={draft.tags} onChange={(v) => set('tags', v)} />
      <TextAreaField label="Beschreibung" value={draft.description} onChange={(v) => set('description', v)} />
      <FormGrid>
        <TextField label="Adresse" value={draft.address} onChange={(v) => set('address', v)} autoComplete="street-address" />
        <TextField label="Stadt" value={draft.city} onChange={(v) => set('city', v)} autoComplete="address-level2" />
      </FormGrid>
      <TextField
        label="Google Maps URL"
        type="url"
        inputMode="url"
        placeholder="https://maps.app.goo.gl/…"
        value={draft.mapsUrl}
        onChange={(v) => set('mapsUrl', v)}
        error={submitted ? errors.mapsUrl : undefined}
        hint={mapsHint}
      />
      <FormGrid>
        <TextField label="Datum" type="date" value={draft.date} onChange={(v) => set('date', v)} />
        <SelectField label="Preisbereich" value={draft.priceRange} options={PRICE_OPTIONS} onChange={(v) => set('priceRange', v)} />
      </FormGrid>
      <ImageField
        label="Foto"
        value={draft.photoUrl}
        onChange={(v) => set('photoUrl', v)}
        error={submitted ? errors.photoUrl : undefined}
        fallbackEmoji={DATE_CATEGORY_META[draft.category].emoji}
        search={{ domain: 'place', query: [draft.name, draft.city].filter(Boolean).join(' ') }}
      />
      <RatingsEditor value={draft.ratings} onChange={(ratings) => setDraft((d) => ({ ...d, ratings }))} />
      <TextAreaField label="Notizen" value={draft.notes} onChange={(v) => set('notes', v)} placeholder="Was wir bestellt haben, was wir nächstes Mal machen …" />
    </FormModal>
  );
}
