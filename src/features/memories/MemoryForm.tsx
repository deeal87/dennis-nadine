import { MEMORY_CATEGORIES, type Memory, type MemoryCategory } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { FormGrid, SelectField, TextAreaField, TextField } from '@/components/ui/form';
import { useDraft } from '@/hooks/useDraft';
import { detectPlatform } from '@/lib/social';
import { hasErrors, imageError, optional, requiredError, urlError } from '@/lib/validation';
import { ImageField } from '../image-search/ImageField';
import { MEMORY_CATEGORY_META } from './config';

interface MemoryFormProps {
  memory?: Memory;
  onClose: () => void;
  onSave: (draft: Draft<Memory>, id?: string) => Promise<unknown>;
}

const CATEGORY_OPTIONS = MEMORY_CATEGORIES.map((c) => ({ value: c, label: MEMORY_CATEGORY_META[c].label, emoji: MEMORY_CATEGORY_META[c].emoji }));

function platformError(value: string, platform: 'instagram' | 'tiktok', label: string): string | undefined {
  return urlError(value) ?? (value.trim() && detectPlatform(value) !== platform ? `Das ist kein ${label}-Link.` : undefined);
}

export function MemoryForm({ memory, onClose, onSave }: MemoryFormProps) {
  const { draft, set, submitted, markSubmitted } = useDraft(() => ({
    title: memory?.title ?? '',
    date: memory?.date ?? '',
    description: memory?.description ?? '',
    category: memory?.category ?? ('date' as MemoryCategory),
    instagramUrl: memory?.instagramUrl ?? '',
    tiktokUrl: memory?.tiktokUrl ?? '',
    imageUrl: memory?.imageUrl ?? '',
  }));

  const errors = {
    title: requiredError(draft.title, 'Der Titel'),
    instagramUrl: platformError(draft.instagramUrl, 'instagram', 'Instagram'),
    tiktokUrl: platformError(draft.tiktokUrl, 'tiktok', 'TikTok'),
    imageUrl: imageError(draft.imageUrl),
  };
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : undefined);

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    await onSave(
      {
        title: draft.title.trim(),
        date: optional(draft.date),
        description: optional(draft.description),
        category: draft.category,
        instagramUrl: optional(draft.instagramUrl),
        tiktokUrl: optional(draft.tiktokUrl),
        imageUrl: optional(draft.imageUrl),
      },
      memory?.id,
    );
  };

  return (
    <FormModal open onClose={onClose} title={memory ? 'Erinnerung bearbeiten' : 'Neue Erinnerung'} onSubmit={submit}>
      <TextField label="Titel" value={draft.title} onChange={(v) => set('title', v)} error={show('title')} autoFocus />
      <FormGrid>
        <TextField label="Datum" type="date" value={draft.date} onChange={(v) => set('date', v)} />
        <SelectField label="Kategorie" value={draft.category} options={CATEGORY_OPTIONS} onChange={(v) => set('category', v)} />
      </FormGrid>
      <TextAreaField label="Beschreibung" value={draft.description} onChange={(v) => set('description', v)} rows={4} />
      <ImageField label="Foto" value={draft.imageUrl} onChange={(v) => set('imageUrl', v)} error={show('imageUrl')} fallbackEmoji="📸" />
      <FormGrid>
        <TextField
          label="Instagram URL"
          type="url"
          inputMode="url"
          placeholder="https://www.instagram.com/p/…"
          value={draft.instagramUrl}
          onChange={(v) => set('instagramUrl', v)}
          error={show('instagramUrl')}
        />
        <TextField
          label="TikTok URL"
          type="url"
          inputMode="url"
          placeholder="https://www.tiktok.com/@…/video/…"
          value={draft.tiktokUrl}
          onChange={(v) => set('tiktokUrl', v)}
          error={show('tiktokUrl')}
        />
      </FormGrid>
    </FormModal>
  );
}
