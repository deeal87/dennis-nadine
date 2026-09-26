import { useMemo, useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import type { OwnershipStatus } from '@/types/models';
import type { Draft } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEditor } from '@/hooks/useEditor';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDetailParam } from '@/hooks/useDetailParam';
import { useRankingActions } from '@/hooks/useRankingActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import { CardGrid } from '@/components/cards/MediaCard';
import { DetailModal, DetailSection, FactList } from '@/components/cards/DetailModal';
import { RankingBoard } from '@/components/collection/RankingBoard';
import { applyFilter, type FilterDef } from '@/lib/filters';
import { resolveRanking } from '@/lib/ranking';
import { cn } from '@/lib/cn';
import { CollectibleCard } from './CollectibleCard';
import { CollectibleForm } from './CollectibleForm';
import { PhotoCapture } from './PhotoCapture';
import { SeriesPanel } from './SeriesPanel';
import { groupOf, type CollectibleItem, type CollectionConfig } from './types';

const STATUS_FILTERS: readonly FilterDef<CollectibleItem>[] = [
  { id: 'all', label: 'Alle', matches: () => true },
  { id: 'owned', label: 'Gesammelt', emoji: '✅', matches: (i) => i.status === 'owned' },
  { id: 'wishlist', label: 'Wunschliste', emoji: '🎀', matches: (i) => i.status === 'wishlist' },
  { id: 'favorites', label: 'Favoriten', emoji: '💖', matches: (i) => i.favorite },
];

type Tab = 'collection' | 'wishlist' | 'series';

export function CollectionPage<T extends CollectibleItem>({ config }: { config: CollectionConfig<T> }) {
  useDocumentTitle(config.title);
  const snapshot = useStore(config.store);
  const items = snapshot.items as unknown as T[];
  const toast = useToast();
  const editor = useEditor<T>();
  const detail = useDetailParam();
  const actions = useEntityActions(config.repository, config.noun);
  const [tab, setTab] = useState<Tab>('collection');
  const [filter, setFilter] = useState('all');
  const [group, setGroup] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [preset, setPreset] = useState<Partial<Record<string, string>> & { status?: OwnershipStatus }>();

  const wishlistIds = useMemo(() => items.filter((i) => i.status === 'wishlist').map((i) => i.id), [items]);
  const wishlist = useRankingActions(config.wishlistRanking, wishlistIds);
  const ranked = useMemo(() => resolveRanking(wishlist.ids, items), [wishlist.ids, items]);
  const candidates = useMemo(() => items.filter((i) => i.status === 'wishlist' && !wishlist.ids.includes(i.id)), [items, wishlist.ids]);

  const groups = useMemo(() => [...new Set(items.map((i) => groupOf(config, i)).filter((g): g is string => !!g))].sort((a, b) => a.localeCompare(b, 'de')), [items, config]);
  const visible = useMemo(
    () =>
      applyFilter(items, STATUS_FILTERS, filter)
        .filter((i) => !group || groupOf(config, i) === group)
        .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'de')),
    [items, filter, group, config],
  );
  const selected = items.find((i) => i.id === detail.id);

  const openNew = (initial?: typeof preset) => {
    setPreset(initial);
    editor.openNew();
  };
  const toggleStatus = (item: T) => {
    const status: OwnershipStatus = item.status === 'owned' ? 'wishlist' : 'owned';
    void actions.patch(item.id, { status } as Partial<Draft<T>>).then((updated) => {
      if (updated && status === 'owned') toast({ message: `🎉 ${item.name} ist jetzt in unserer Sammlung!` });
    });
  };
  const remove = async (item: T) => {
    if (await actions.remove(item, item.name)) detail.close();
  };
  const addMany = async (drafts: Draft<T>[]): Promise<boolean> => {
    try {
      await config.repository.createMany(drafts);
      toast({ message: `${drafts.length} ${drafts.length === 1 ? config.noun : config.nounPlural} hinzugefügt ✨` });
      return true;
    } catch {
      toast({ tone: 'error', message: 'Hinzufügen fehlgeschlagen.' });
      return false;
    }
  };

  const TABS: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'collection', label: `${config.emoji} Sammlung`, count: items.filter((i) => i.status === 'owned').length },
    { id: 'wishlist', label: '🎀 Wishlist Top 10', count: wishlist.ids.length },
    { id: 'series', label: `📚 ${config.groupLabelPlural}` },
  ];

  return (
    <>
      <PageHeader
        emoji={config.emoji}
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Button variant="secondary" icon={Camera} onClick={() => setCapturing(true)}>
              Per Foto erfassen
            </Button>
            <Button icon={Plus} onClick={() => openNew()}>
              {config.noun} hinzufügen
            </Button>
          </>
        }
      />

      <div role="group" aria-label="Ansicht" className="mb-5 flex gap-2 overflow-x-auto rounded-3xl bg-surface-2 p-1.5 [scrollbar-width:none] sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'min-h-11 shrink-0 rounded-2xl px-4 text-sm font-bold transition',
              tab === t.id ? 'bg-surface text-rose shadow-[var(--shadow-soft)]' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-xs opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {tab === 'collection' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterChips label={`${config.nounPlural} filtern`} filters={STATUS_FILTERS} value={filter} onChange={setFilter} items={items} />
            {groups.length > 0 && (
              <select
                aria-label={`Nach ${config.groupLabel} filtern`}
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="min-h-10 cursor-pointer rounded-full border border-line bg-surface px-4 text-sm font-bold"
              >
                <option value="">Alle {config.groupLabelPlural}</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
          {!snapshot.loading && items.length === 0 ? (
            <EmptyState
              emoji={config.empty.emoji}
              title={config.empty.title}
              text={config.empty.text}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button icon={Plus} onClick={() => openNew()}>
                    {config.noun} eintragen
                  </Button>
                  <Button variant="secondary" icon={Camera} onClick={() => setCapturing(true)}>
                    Per Foto erfassen
                  </Button>
                </div>
              }
            />
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-muted">Hier ist gerade nichts. ✨</p>
          ) : (
            <CardGrid className="min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <li key={item.id}>
                  <CollectibleCard
                    config={config}
                    item={item}
                    onOpen={() => detail.open(item.id)}
                    onEdit={() => editor.openEdit(item)}
                    onDelete={() => void remove(item)}
                    onToggleFavorite={() => void actions.patch(item.id, { favorite: !item.favorite } as Partial<Draft<T>>)}
                    onToggleStatus={() => toggleStatus(item)}
                  />
                </li>
              ))}
            </CardGrid>
          )}
        </div>
      )}

      {tab === 'wishlist' && (
        <div className="flex flex-col gap-4">
          <RankingBoard
            title={config.wishlistTitle}
            subtitle="Maximal 10 Herzenswünsche · Ziehen zum Priorisieren"
            items={ranked}
            limit={wishlist.limit}
            getLabel={(i) => i.name}
            getImage={(i) => i.imageUrl}
            renderMeta={(i) => config.describe(i)}
            fallbackEmoji={config.emoji}
            onReorder={wishlist.reorder}
            onRemove={wishlist.remove}
            candidates={candidates}
            onAdd={(id) => wishlist.add(id)}
            onOpen={(i) => detail.open(i.id)}
            emptyText="Noch keine Herzenswünsche priorisiert."
          />
          {wishlistIds.length === 0 && (
            <p className="text-center text-sm text-muted">
              Markiert {config.nounPlural} als „Wunschliste“, um sie hier zu priorisieren.{' '}
              <button type="button" className="font-bold text-rose underline-offset-2 hover:underline" onClick={() => openNew({ status: 'wishlist' })}>
                Wunsch hinzufügen
              </button>
            </p>
          )}
        </div>
      )}

      {tab === 'series' && (
        <SeriesPanel
          config={config}
          items={items}
          onWish={(name, groupName, number) => openNew({ name, status: 'wishlist', [config.groupKey]: groupName, [config.numberKey]: number })}
        />
      )}

      {selected && (
        <DetailModal
          open
          onClose={detail.close}
          title={selected.name}
          image={selected.imageUrl}
          fallbackEmoji={config.emoji}
          badges={
            <>
              {selected.status === 'wishlist' ? <Tag tone="peach">🎀 Wunschliste</Tag> : <Tag tone="mint">✅ Gesammelt</Tag>}
              {selected.favorite && <Tag tone="rose">💖 Favorit</Tag>}
              {wishlist.has(selected.id) && <Tag tone="gold">Wunsch Nr. {wishlist.ids.indexOf(selected.id) + 1}</Tag>}
            </>
          }
          subtitle={config.describe(selected)}
          onEdit={() => editor.openEdit(selected)}
          onDelete={() => void remove(selected)}
          extraActions={
            <Button variant="soft" onClick={() => toggleStatus(selected)}>
              {selected.status === 'wishlist' ? '✓ Haben wir!' : '🎀 Auf Wunschliste'}
            </Button>
          }
        >
          <FactList
            facts={config.extraFields.map((field) => {
              const value = selected[field.key];
              return [field.label, value === undefined || value === null || value === '' ? undefined : String(value)];
            })}
          />
          {selected.notes && (
            <DetailSection title="Notizen">
              <p className="whitespace-pre-line">{selected.notes}</p>
            </DetailSection>
          )}
        </DetailModal>
      )}

      {editor.open && (
        <CollectibleForm
          config={config}
          item={editor.entity}
          preset={preset}
          groups={groups}
          onClose={editor.close}
          onSave={(draft, id) => actions.save(draft, id)}
        />
      )}
      {capturing && <PhotoCapture config={config} existingNames={items.map((i) => i.name)} onClose={() => setCapturing(false)} onAdd={addMany} />}
    </>
  );
}
