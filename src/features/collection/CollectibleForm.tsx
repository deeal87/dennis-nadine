import { useId } from 'react';
import type { OwnershipStatus } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { Field, FormGrid, SelectField, SwitchField, TextAreaField, TextField, inputClass } from '@/components/ui/form';
import { useDraft } from '@/hooks/useDraft';
import { hasErrors, optional, requiredError, urlError } from '@/lib/validation';
import type { CollectibleItem, CollectionConfig, ExtraField } from './types';

interface CollectibleFormProps<T extends CollectibleItem> {
  config: CollectionConfig<T>;
  item?: T;
  /** Prefill for new items (e.g. "add missing figure to wishlist"). */
  preset?: Partial<Record<string, string>> & { status?: OwnershipStatus };
  groups: string[];
  onClose: () => void;
  onSave: (draft: Draft<T>, id?: string) => Promise<unknown>;
}

export const STATUS_OPTIONS = [
  { value: 'owned', label: 'In unserer Sammlung', emoji: '✅' },
  { value: 'wishlist', label: 'Wunschliste', emoji: '🎀' },
] as const;

function initialExtras<T extends CollectibleItem>(fields: ExtraField<T>[], item?: T, preset?: Partial<Record<string, string>>) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = item?.[field.key];
      return [field.key, value === undefined || value === null ? (preset?.[field.key] ?? '') : String(value)];
    }),
  ) as Record<string, string>;
}

export function CollectibleForm<T extends CollectibleItem>({ config, item, preset, groups, onClose, onSave }: CollectibleFormProps<T>) {
  const listId = useId();
  const { draft, set, submitted, markSubmitted } = useDraft(() => ({
    name: item?.name ?? preset?.name ?? '',
    imageUrl: item?.imageUrl ?? '',
    status: item?.status ?? preset?.status ?? ('owned' as OwnershipStatus),
    favorite: item?.favorite ?? false,
    notes: item?.notes ?? '',
    extras: initialExtras(config.extraFields, item, preset),
  }));

  const errors = { name: requiredError(draft.name, 'Der Name'), imageUrl: urlError(draft.imageUrl) };
  const setExtra = (key: string, value: string) => set('extras', { ...draft.extras, [key]: value });

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    const extras = Object.fromEntries(
      config.extraFields.map((field) => {
        const raw = draft.extras[field.key]?.trim() ?? '';
        const value = field.type === 'number' ? (raw && Number.isFinite(Number(raw)) ? Math.round(Number(raw)) : undefined) : optional(raw);
        return [field.key, value];
      }),
    );
    await onSave(
      {
        name: draft.name.trim(),
        imageUrl: optional(draft.imageUrl),
        status: draft.status,
        favorite: draft.favorite,
        notes: optional(draft.notes),
        ...extras,
      } as Draft<T>,
      item?.id,
    );
  };

  return (
    <FormModal open onClose={onClose} title={item ? `${config.noun} bearbeiten` : `${config.noun} hinzufügen`} onSubmit={submit}>
      <TextField label="Name" value={draft.name} onChange={(v) => set('name', v)} error={submitted ? errors.name : undefined} autoFocus />
      <FormGrid>
        {config.extraFields.map((field) => (
          <Field key={field.key} label={field.label}>
            {(a11y) => (
              <input
                {...a11y}
                className={inputClass}
                type={field.type === 'number' ? 'number' : 'text'}
                inputMode={field.type === 'number' ? 'numeric' : undefined}
                min={field.min}
                max={field.max}
                placeholder={field.placeholder}
                list={field.groupSuggestions ? listId : undefined}
                value={draft.extras[field.key] ?? ''}
                onChange={(e) => setExtra(field.key, e.target.value)}
              />
            )}
          </Field>
        ))}
        <SelectField label="Besitzstatus" value={draft.status} options={STATUS_OPTIONS} onChange={(v) => set('status', v)} />
        <TextField
          label="Bild URL"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={draft.imageUrl}
          onChange={(v) => set('imageUrl', v)}
          error={submitted ? errors.imageUrl : undefined}
        />
      </FormGrid>
      <datalist id={listId}>
        {groups.map((group) => (
          <option key={group} value={group} />
        ))}
      </datalist>
      <SwitchField label="💖 Favorit" checked={draft.favorite} onChange={(v) => set('favorite', v)} />
      <TextAreaField label="Notizen" value={draft.notes} onChange={(v) => set('notes', v)} />
    </FormModal>
  );
}
