import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { SeriesCatalog } from '@/types/models';
import { seriesRepository } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useEditor } from '@/hooks/useEditor';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CatalogEditor } from './CatalogEditor';
import { computeSeriesProgress, formatCatalogLine, type SeriesProgress } from './seriesProgress';
import { groupOf, numberOf, type CollectibleItem, type CollectionConfig } from './types';

interface SeriesPanelProps<T extends CollectibleItem> {
  config: CollectionConfig<T>;
  items: readonly T[];
  /** Put a missing catalog entry on the wishlist. */
  onWish: (name: string, group: string, number?: string) => void;
}

export function SeriesPanel<T extends CollectibleItem>({ config, items, onWish }: SeriesPanelProps<T>) {
  const allCatalogs = useStore('series').items;
  const catalogs = useMemo(() => allCatalogs.filter((c) => c.domain === config.domain), [allCatalogs, config.domain]);
  const actions = useEntityActions(seriesRepository, config.groupLabel);
  const editor = useEditor<SeriesCatalog>();
  const [preset, setPreset] = useState<{ name: string; lines: string[] } | undefined>();

  const progress = useMemo(
    () =>
      computeSeriesProgress(
        items.map((item) => ({ name: item.name, group: groupOf(config, item), number: numberOf(config, item), owned: item.status === 'owned' })),
        catalogs,
      ),
    [items, catalogs, config],
  );

  const createFor = (entry?: SeriesProgress) => {
    const lines = entry
      ? items
          .filter((item) => groupOf(config, item)?.toLowerCase() === entry.name.toLowerCase())
          .map((item) => formatCatalogLine({ id: item.id, name: item.name, number: numberOf(config, item) }))
      : [];
    setPreset(entry ? { name: entry.name, lines } : undefined);
    editor.openNew();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Legt für eine {config.groupLabel} fest, welche {config.nounPlural} es gibt – dann zeigen wir euren Fortschritt und was noch fehlt.
        </p>
        <Button variant="soft" icon={Plus} onClick={() => createFor()}>
          {config.groupLabel} anlegen
        </Button>
      </div>

      {progress.length === 0 ? (
        <EmptyState
          emoji="📚"
          title={`Noch keine ${config.groupLabelPlural}`}
          text={`Sobald ${config.nounPlural} eine ${config.groupLabel} haben oder ihr eine anlegt, erscheint sie hier.`}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {progress.map((entry) => (
            <li key={entry.name} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold">{entry.name}</h3>
                {entry.catalog && (
                  <div className="-mr-2 -mt-2 flex">
                    <IconButton icon={Pencil} label={`${entry.name} bearbeiten`} onClick={() => editor.openEdit(entry.catalog!)} />
                    <IconButton icon={Trash2} label={`${entry.name} löschen`} onClick={() => void actions.remove(entry.catalog!, entry.name)} />
                  </div>
                )}
              </div>
              {entry.total !== undefined ? (
                <>
                  <ProgressBar value={entry.owned} max={entry.total} label="gesammelt" />
                  {entry.missing.length > 0 ? (
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-bold text-violet">Noch nicht in unserer Sammlung ({entry.missing.length})</summary>
                      <ul className="mt-2 flex flex-col gap-1">
                        {entry.missing.map((missing) => (
                          <li key={missing.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 py-1 pl-3 pr-1 text-sm">
                            <span className="min-w-0 truncate">
                              {missing.number && <span className="mr-1 font-bold text-muted">#{missing.number}</span>}
                              {missing.name}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => onWish(missing.name, entry.name, missing.number)}>
                              🎀 Wünschen
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="text-sm font-bold text-mint">🎉 Komplett! Alles gesammelt.</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    {entry.owned} {entry.owned === 1 ? config.noun : config.nounPlural} gesammelt · Gesamtzahl noch unbekannt
                  </p>
                  <Button size="sm" variant="secondary" onClick={() => createFor(entry)} className="self-start">
                    Komplette {config.groupLabel} eintragen
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {editor.open && (
        <CatalogEditor
          config={config}
          catalog={editor.entity}
          preset={preset}
          onClose={editor.close}
          onSave={(draft, id) => actions.save(draft, id)}
        />
      )}
    </div>
  );
}
