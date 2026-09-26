import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { BUCKET_CATEGORIES, type BucketItem } from '@/types/models';
import { bucketRepository } from '@/data/repositories';
import { useStore } from '@/hooks/useStore';
import { useEditor } from '@/hooks/useEditor';
import { useEntityActions } from '@/hooks/useEntityActions';
import { useDetailParam } from '@/hooks/useDetailParam';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tag } from '@/components/ui/Tag';
import { burstAt } from '@/components/animations/burst';
import { applyFilter, type FilterDef } from '@/lib/filters';
import { formatDate, todayIso } from '@/lib/date';
import { cn } from '@/lib/cn';
import { BUCKET_CATEGORY_META, PRIORITY_META } from './config';
import { BucketForm } from './BucketForm';

const FILTERS: readonly FilterDef<BucketItem>[] = [
  { id: 'all', label: 'Alle', matches: () => true },
  ...BUCKET_CATEGORIES.map((c) => ({ id: c, label: BUCKET_CATEGORY_META[c].label, emoji: BUCKET_CATEGORY_META[c].emoji, matches: (b: BucketItem) => b.category === c })),
];

const PRIORITY_TONE = { high: 'rose', medium: 'violet', low: 'neutral' } as const;

export default function BucketListPage() {
  useDocumentTitle('Bucket List');
  const { items, loading } = useStore('bucket');
  const editor = useEditor<BucketItem>();
  const detail = useDetailParam();
  const actions = useEntityActions(bucketRepository, 'Eintrag');
  const [filter, setFilter] = useState('all');

  const done = items.filter((b) => b.done).length;
  const visible = useMemo(
    () =>
      applyFilter(items, FILTERS, filter).sort(
        (a, b) => Number(a.done) - Number(b.done) || PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order || a.title.localeCompare(b.title, 'de'),
      ),
    [items, filter],
  );

  useEffect(() => {
    if (detail.id && !loading) document.getElementById(`bucket-${detail.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [detail.id, loading]);

  const toggle = (item: BucketItem, x: number, y: number) => {
    if (!item.done) burstAt(x, y, ['🎉', '✨', '💖', '⭐']);
    void actions.patch(item.id, { done: !item.done, date: !item.done ? todayIso() : item.date });
  };

  return (
    <>
      <PageHeader
        emoji="🌠"
        title="Dinge, die wir zusammen erleben wollen"
        subtitle="Unsere Bucket List – groß, klein, verrückt und wunderschön."
        actions={
          <Button icon={Plus} onClick={editor.openNew}>
            Traum hinzufügen
          </Button>
        }
      />

      {items.length > 0 && (
        <div className="card mb-6 p-5">
          <ProgressBar value={done} max={items.length} label="erledigt" />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <FilterChips label="Nach Kategorie filtern" filters={FILTERS} value={filter} onChange={setFilter} items={items} />
        {!loading && items.length === 0 ? (
          <EmptyState
            emoji="🌠"
            title="Wovon träumen wir?"
            text="Reisen, Essen, Abenteuer – schreibt eure ersten gemeinsamen Träume auf."
            action={
              <Button icon={Plus} onClick={editor.openNew}>
                Ersten Traum eintragen
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-muted">In dieser Kategorie ist noch nichts geplant. ✨</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((item) => {
              const meta = BUCKET_CATEGORY_META[item.category];
              return (
                <li
                  key={item.id}
                  id={`bucket-${item.id}`}
                  className={cn('card flex items-start gap-3 p-3 pr-2 transition sm:p-4', item.done && 'bg-surface-2/70', detail.id === item.id && 'ring-4 ring-rose/40')}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={item.done}
                    aria-label={`${item.title} ${item.done ? 'als offen markieren' : 'als erledigt markieren'}`}
                    onClick={(e) => toggle(item, e.clientX, e.clientY)}
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-2xl border-2 text-xl transition active:scale-90',
                      item.done ? 'border-mint bg-mint-soft' : 'border-line hover:border-rose',
                    )}
                  >
                    {item.done ? '✅' : <span aria-hidden>{meta.emoji}</span>}
                  </button>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className={cn('font-bold', item.done && 'text-muted line-through decoration-rose/60 decoration-2')}>{item.title}</p>
                    {item.description && <p className="text-sm text-muted">{item.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Tag>
                        {meta.emoji} {meta.label}
                      </Tag>
                      <Tag tone={PRIORITY_TONE[item.priority]}>Priorität: {PRIORITY_META[item.priority].label}</Tag>
                      {item.date && <Tag tone={item.done ? 'mint' : 'peach'}>{item.done ? `Erledigt ${formatDate(item.date)}` : `Ziel ${formatDate(item.date)}`}</Tag>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col sm:flex-row">
                    <IconButton icon={Pencil} label={`${item.title} bearbeiten`} onClick={() => editor.openEdit(item)} />
                    <IconButton icon={Trash2} label={`${item.title} löschen`} onClick={() => void actions.remove(item, item.title)} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {editor.open && <BucketForm item={editor.entity} onClose={editor.close} onSave={(draft, id) => actions.save(draft, id)} />}
    </>
  );
}
