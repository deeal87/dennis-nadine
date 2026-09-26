import { BUCKET_CATEGORIES, PRIORITIES, type BucketCategory, type BucketItem, type Priority } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { ChipGroup, FormGrid, SelectField, SwitchField, TextAreaField, TextField } from '@/components/ui/form';
import { useDraft } from '@/hooks/useDraft';
import { hasErrors, optional, requiredError } from '@/lib/validation';
import { BUCKET_CATEGORY_META, PRIORITY_META } from './config';

interface BucketFormProps {
  item?: BucketItem;
  onClose: () => void;
  onSave: (draft: Draft<BucketItem>, id?: string) => Promise<unknown>;
}

const CATEGORY_OPTIONS = BUCKET_CATEGORIES.map((c) => ({ value: c, label: BUCKET_CATEGORY_META[c].label, emoji: BUCKET_CATEGORY_META[c].emoji }));
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }));

export function BucketForm({ item, onClose, onSave }: BucketFormProps) {
  const { draft, set, submitted, markSubmitted } = useDraft(() => ({
    title: item?.title ?? '',
    description: item?.description ?? '',
    category: item?.category ?? ('reisen' as BucketCategory),
    priority: item?.priority ?? ('medium' as Priority),
    done: item?.done ?? false,
    date: item?.date ?? '',
  }));
  const errors = { title: requiredError(draft.title, 'Der Titel') };

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    await onSave(
      { title: draft.title.trim(), description: optional(draft.description), category: draft.category, priority: draft.priority, done: draft.done, date: optional(draft.date) },
      item?.id,
    );
  };

  return (
    <FormModal open onClose={onClose} title={item ? 'Traum bearbeiten' : 'Neuer Traum'} onSubmit={submit} size="md">
      <TextField label="Titel" value={draft.title} onChange={(v) => set('title', v)} error={submitted ? errors.title : undefined} placeholder="z. B. Kirschblüten in Kyoto sehen" autoFocus />
      <TextAreaField label="Beschreibung" value={draft.description} onChange={(v) => set('description', v)} />
      <ChipGroup label="Kategorie" options={CATEGORY_OPTIONS} value={[draft.category]} onChange={([v]) => v && set('category', v)} single />
      <FormGrid>
        <SelectField label="Priorität" value={draft.priority} options={PRIORITY_OPTIONS} onChange={(v) => set('priority', v)} />
        <TextField label={draft.done ? 'Erledigt am' : 'Wunschdatum'} type="date" value={draft.date} onChange={(v) => set('date', v)} />
      </FormGrid>
      <SwitchField label="✅ Erledigt" checked={draft.done} onChange={(v) => set('done', v)} />
    </FormModal>
  );
}
