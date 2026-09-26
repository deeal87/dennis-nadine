import type { SeriesCatalog } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { FormModal } from '@/components/ui/FormModal';
import { ListEditor, TextField } from '@/components/ui/form';
import { useDraft } from '@/hooks/useDraft';
import { hasErrors, requiredError } from '@/lib/validation';
import { formatCatalogLine, parseCatalogLine } from './seriesProgress';
import type { CollectibleItem, CollectionConfig } from './types';

interface CatalogEditorProps<T extends CollectibleItem> {
  config: CollectionConfig<T>;
  catalog?: SeriesCatalog;
  /** Prefill for a new catalog (group name + what we already own). */
  preset?: { name: string; lines: string[] };
  onClose: () => void;
  onSave: (draft: Draft<SeriesCatalog>, id?: string) => Promise<unknown>;
}

/** Defines the full list of a series/theme so progress and missing items can be shown. */
export function CatalogEditor<T extends CollectibleItem>({ config, catalog, preset, onClose, onSave }: CatalogEditorProps<T>) {
  const { draft, set, submitted, markSubmitted } = useDraft(() => ({
    name: catalog?.name ?? preset?.name ?? '',
    lines: catalog ? catalog.items.map(formatCatalogLine) : preset?.lines.length ? preset.lines : [''],
  }));
  const errors = { name: requiredError(draft.name, `Der ${config.groupLabel}-Name`) };

  const submit = async () => {
    markSubmitted();
    if (hasErrors(errors)) return false;
    const previous = new Map(catalog?.items.map((item) => [formatCatalogLine(item), item.id]));
    const items = draft.lines.flatMap((line) => {
      const parsed = parseCatalogLine(line);
      if (!parsed) return [];
      return [{ ...parsed, id: previous.get(formatCatalogLine(parsed)) ?? parsed.id }];
    });
    await onSave({ domain: config.domain, name: draft.name.trim(), items }, catalog?.id);
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={catalog ? `${config.groupLabel} bearbeiten` : `${config.groupLabel} anlegen`}
      description={`Tragt alle ${config.nounPlural} ein, die es in dieser ${config.groupLabel} gibt – so sehen wir, was uns noch fehlt.`}
      onSubmit={submit}
    >
      <TextField label={`Name der ${config.groupLabel}`} value={draft.name} onChange={(v) => set('name', v)} error={submitted ? errors.name : undefined} autoFocus />
      <ListEditor
        label={`${config.nounPlural} (${config.numberLabel} optional vorne)`}
        items={draft.lines}
        onChange={(v) => set('lines', v)}
        placeholder={config.domain === 'funko' ? 'z. B. 121 Figurname' : 'z. B. 10280 Setname'}
        addLabel="Eintrag hinzufügen"
      />
    </FormModal>
  );
}
