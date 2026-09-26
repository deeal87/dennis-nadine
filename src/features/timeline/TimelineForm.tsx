import { TIMELINE_CATEGORIES, type TimelineCategory, type TimelineEvent } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { FormGrid, SelectField, TextAreaField, TextField } from '@/components/ui/form';
import { useDraft } from '@/hooks/useDraft';
import { isIsoDate, todayIso } from '@/lib/date';
import { hasErrors, imageError, optional, requiredError } from '@/lib/validation';
import { ImageField } from '../image-search/ImageField';
import { TIMELINE_CATEGORY_META } from './config';

interface TimelineFormProps {
  event?: TimelineEvent;
  onClose: () => void;
  onSave: (draft: Draft<TimelineEvent>, id?: string) => Promise<unknown>;
}

const CATEGORY_OPTIONS = TIMELINE_CATEGORIES.map((c) => ({ value: c, label: TIMELINE_CATEGORY_META[c].label, emoji: TIMELINE_CATEGORY_META[c].emoji }));

export function TimelineForm({ event, onClose, onSave }: TimelineFormProps) {
  const { draft, set, submitted, markSubmitted } = useDraft(() => ({
    date: event?.date ?? todayIso(),
    title: event?.title ?? '',
    description: event?.description ?? '',
    imageUrl: event?.imageUrl ?? '',
    category: event?.category ?? ('date' as TimelineCategory),
  }));
  const errors = {
    title: requiredError(draft.title, 'Der Titel'),
    date: isIsoDate(draft.date) ? undefined : 'Bitte ein Datum wählen.',
    imageUrl: imageError(draft.imageUrl),
  };

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    await onSave(
      { date: draft.date, title: draft.title.trim(), description: optional(draft.description), imageUrl: optional(draft.imageUrl), category: draft.category },
      event?.id,
    );
  };

  return (
    <FormModal open onClose={onClose} title={event ? 'Moment bearbeiten' : 'Neuer Moment'} onSubmit={submit} size="md">
      <FormGrid>
        <TextField label="Datum" type="date" value={draft.date} onChange={(v) => set('date', v)} error={submitted ? errors.date : undefined} />
        <SelectField label="Kategorie" value={draft.category} options={CATEGORY_OPTIONS} onChange={(v) => set('category', v)} />
      </FormGrid>
      <TextField label="Titel" value={draft.title} onChange={(v) => set('title', v)} error={submitted ? errors.title : undefined} autoFocus />
      <TextAreaField label="Beschreibung" value={draft.description} onChange={(v) => set('description', v)} rows={4} />
      <ImageField label="Foto" value={draft.imageUrl} onChange={(v) => set('imageUrl', v)} error={submitted ? errors.imageUrl : undefined} fallbackEmoji="💞" />
    </FormModal>
  );
}
