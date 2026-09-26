import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { DatePlace } from '@/types/models';
import { DATE_CATEGORIES } from '@/types/models';
import { dateRepository } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEditor } from '@/hooks/useEditor';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDetailParam } from '@/hooks/useDetailParam';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import { RatingsDetails } from '@/components/ui/RatingStars';
import { CardGrid } from '@/components/cards/MediaCard';
import { DetailModal, DetailSection, FactList } from '@/components/cards/DetailModal';
import { MapPreview } from '@/components/media/MapPreview';
import { applyFilter, type FilterDef } from '@/lib/filters';
import { formatDate, todayIso } from '@/lib/date';
import { cn } from '@/lib/cn';
import { DateRoulette } from '../roulette/DateRoulette';
import { DATE_CATEGORY_META, DATE_TAG_META, PRICE_LABELS } from './config';
import { DateCard } from './DateCard';
import { DateForm } from './DateForm';

const CATEGORY_FILTERS: readonly FilterDef<DatePlace>[] = [
  { id: 'all', label: 'Alle', matches: () => true },
  ...DATE_CATEGORIES.map((category) => ({
    id: category,
    label: DATE_CATEGORY_META[category].plural,
    emoji: DATE_CATEGORY_META[category].emoji,
    matches: (p: DatePlace) => p.category === category,
  })),
];

const STATUS_TABS = [
  { id: 'todo', label: 'Noch ausprobieren', emoji: '🌱' },
  { id: 'done', label: 'Bereits erlebt', emoji: '❤️' },
] as const;

export default function DatesPage() {
  useDocumentTitle('Dates');
  const { items, loading } = useStore('dates');
  const editor = useEditor<DatePlace>();
  const detail = useDetailParam();
  const actions = useEntityActions(dateRepository, 'Abenteuer');
  const [status, setStatus] = useState<'todo' | 'done'>('todo');
  const [category, setCategory] = useState('all');
  const [rouletteOpen, setRouletteOpen] = useState(false);

  const byStatus = useMemo(() => items.filter((p) => p.status === status), [items, status]);
  const visible = useMemo(
    () =>
      applyFilter(byStatus, CATEGORY_FILTERS, category).sort((a, b) =>
        status === 'done' ? (b.date ?? '').localeCompare(a.date ?? '') : a.name.localeCompare(b.name, 'de'),
      ),
    [byStatus, category, status],
  );
  const selected = items.find((p) => p.id === detail.id);

  const toggleStatus = (place: DatePlace) => {
    const done = place.status === 'todo';
    void actions.patch(place.id, { status: done ? 'done' : 'todo', date: done ? (place.date ?? todayIso()) : place.date });
  };
  const remove = async (place: DatePlace) => {
    if (await actions.remove(place, place.name)) detail.close();
  };

  return (
    <>
      <PageHeader
        emoji="📍"
        title="Unsere Abenteuer"
        subtitle="Orte, Restaurants, Ausflüge – wo wir waren und wo wir noch hinwollen."
        actions={
          <Button icon={Plus} onClick={editor.openNew}>
            Ort hinzufügen
          </Button>
        }
      />

      <button
        type="button"
        onClick={() => setRouletteOpen(true)}
        className="card group mb-6 flex w-full items-center gap-4 overflow-hidden bg-gradient-to-r from-rose-soft via-violet-soft to-peach-soft p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
      >
        <span className="text-5xl transition group-hover:rotate-12" aria-hidden>
          🎲
        </span>
        <span>
          <span className="block font-display text-2xl font-semibold">Überrasche uns ❤️</span>
          <span className="block text-sm text-muted">Das Date-Roulette sucht euer nächstes Abenteuer aus.</span>
        </span>
      </button>

      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Date-Historie" className="grid grid-cols-2 gap-2 rounded-3xl bg-surface-2 p-1.5 sm:inline-grid sm:self-start">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={status === tab.id}
              onClick={() => setStatus(tab.id)}
              className={cn(
                'min-h-11 rounded-2xl px-4 text-sm font-bold transition',
                status === tab.id ? 'bg-surface text-rose shadow-[var(--shadow-soft)]' : 'text-muted hover:text-ink',
              )}
            >
              <span aria-hidden>{tab.emoji}</span> {tab.label}{' '}
              <span className="text-xs opacity-70">({items.filter((p) => p.status === tab.id).length})</span>
            </button>
          ))}
        </div>
        <FilterChips label="Nach Kategorie filtern" filters={CATEGORY_FILTERS} value={category} onChange={setCategory} items={byStatus} />

        {!loading && items.length === 0 ? (
          <EmptyState
            emoji="❤️"
            title="Wo waren wir schon?"
            text="Fügt euren ersten gemeinsamen Ort hinzu."
            action={
              <Button icon={Plus} onClick={editor.openNew}>
                Ersten Ort eintragen
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-muted">
            {status === 'todo' ? 'Keine offenen Ideen hier – Zeit für neue Pläne! 🌱' : 'Hier habt ihr noch nichts erlebt – noch nicht! ✨'}
          </p>
        ) : (
          <CardGrid>
            {visible.map((place) => (
              <li key={place.id}>
                <DateCard
                  place={place}
                  onOpen={() => detail.open(place.id)}
                  onEdit={() => editor.openEdit(place)}
                  onDelete={() => void remove(place)}
                  onToggleStatus={() => toggleStatus(place)}
                />
              </li>
            ))}
          </CardGrid>
        )}
      </div>

      {selected && (
        <DetailModal
          open
          onClose={detail.close}
          title={selected.name}
          image={selected.photoUrl}
          fallbackEmoji={DATE_CATEGORY_META[selected.category].emoji}
          badges={
            <>
              <Tag tone="violet">
                {DATE_CATEGORY_META[selected.category].emoji} {DATE_CATEGORY_META[selected.category].label}
              </Tag>
              {selected.status === 'done' ? <Tag tone="rose">❤️ Bereits erlebt</Tag> : <Tag tone="mint">🌱 Noch ausprobieren</Tag>}
              {selected.tags.map((tag) => (
                <Tag key={tag}>
                  {DATE_TAG_META[tag].emoji} {DATE_TAG_META[tag].label}
                </Tag>
              ))}
            </>
          }
          subtitle={[selected.address, selected.city].filter(Boolean).join(', ')}
          onEdit={() => editor.openEdit(selected)}
          onDelete={() => void remove(selected)}
          extraActions={
            <Button variant="soft" onClick={() => toggleStatus(selected)}>
              {selected.status === 'done' ? '↩︎ Auf „Noch ausprobieren“' : '✓ Als erlebt markieren'}
            </Button>
          }
        >
          <MapPreview mapsUrl={selected.mapsUrl} address={[selected.address, selected.city].filter(Boolean).join(', ')} name={selected.name} />
          <FactList
            facts={[
              ['Datum', formatDate(selected.date)],
              ['Preis', selected.priceRange ? PRICE_LABELS[selected.priceRange] : undefined],
            ]}
          />
          <RatingsDetails ratings={selected} />
          {selected.description && (
            <DetailSection title="Beschreibung">
              <p className="whitespace-pre-line">{selected.description}</p>
            </DetailSection>
          )}
          {selected.notes && (
            <DetailSection title="Notizen">
              <p className="whitespace-pre-line">{selected.notes}</p>
            </DetailSection>
          )}
        </DetailModal>
      )}

      {editor.open && <DateForm place={editor.entity} onClose={editor.close} onSave={(draft, id) => actions.save(draft, id)} />}
      <DateRoulette open={rouletteOpen} onClose={() => setRouletteOpen(false)} places={items} />
    </>
  );
}
