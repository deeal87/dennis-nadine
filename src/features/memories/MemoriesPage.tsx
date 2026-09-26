import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { MEMORY_CATEGORIES, type Memory } from '@/types/models';
import { memoryRepository } from '@/data/repositories';
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
import { EditDeleteActions, MediaCard } from '@/components/cards/MediaCard';
import { DetailModal, DetailSection } from '@/components/cards/DetailModal';
import { MediaPreview, PlatformBadge } from '@/components/media/MediaPreview';
import { applyFilter, type FilterDef } from '@/lib/filters';
import { formatDate } from '@/lib/date';
import { MEMORY_CATEGORY_META } from './config';
import { MemoryForm } from './MemoryForm';

const FILTERS: readonly FilterDef<Memory>[] = [
  { id: 'all', label: 'Alle', matches: () => true },
  ...MEMORY_CATEGORIES.map((c) => ({ id: c, label: MEMORY_CATEGORY_META[c].label, emoji: MEMORY_CATEGORY_META[c].emoji, matches: (m: Memory) => m.category === c })),
  { id: 'social', label: 'Social Media', emoji: '📱', matches: (m) => !!(m.instagramUrl || m.tiktokUrl) },
];

/** Varying, deterministic aspect ratios give the gallery its masonry rhythm without layout shift. */
const ASPECTS = ['aspect-[4/5]', 'aspect-square', 'aspect-[4/3]', 'aspect-[3/4]'];
const aspectFor = (id: string) => ASPECTS[[...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % ASPECTS.length];

export default function MemoriesPage() {
  useDocumentTitle('Memories');
  const { items, loading } = useStore('memories');
  const editor = useEditor<Memory>();
  const detail = useDetailParam();
  const actions = useEntityActions(memoryRepository, 'Erinnerung');
  const [filter, setFilter] = useState('all');

  const visible = useMemo(
    () => applyFilter(items, FILTERS, filter).sort((a, b) => (b.date ?? b.createdAt).localeCompare(a.date ?? a.createdAt)),
    [items, filter],
  );
  const selected = items.find((m) => m.id === detail.id);
  const remove = async (memory: Memory) => {
    if (await actions.remove(memory, memory.title)) detail.close();
  };

  return (
    <>
      <PageHeader
        emoji="📸"
        title="Unsere Erinnerungen"
        subtitle="Fotos, Reels und kleine Momente, die wir nie vergessen wollen."
        actions={
          <Button icon={Plus} onClick={editor.openNew}>
            Erinnerung hinzufügen
          </Button>
        }
      />
      <div className="flex flex-col gap-4">
        <FilterChips label="Erinnerungen filtern" filters={FILTERS} value={filter} onChange={setFilter} items={items} />
        {!loading && items.length === 0 ? (
          <EmptyState
            emoji="📷"
            title="Unser Album ist noch leer"
            text="Haltet euren ersten gemeinsamen Moment fest – mit Foto, Instagram- oder TikTok-Link."
            action={
              <Button icon={Plus} onClick={editor.openNew}>
                Erste Erinnerung speichern
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-muted">In dieser Kategorie gibt es noch keine Erinnerung. 💭</p>
        ) : (
          <ul className="columns-1 gap-4 min-[480px]:columns-2 lg:columns-3">
            {visible.map((memory) => {
              const category = MEMORY_CATEGORY_META[memory.category];
              return (
                <li key={memory.id} className="mb-4 break-inside-avoid">
                  <MediaCard
                    title={memory.title}
                    onOpen={() => detail.open(memory.id)}
                    image={memory.imageUrl}
                    fallbackEmoji={memory.instagramUrl || memory.tiktokUrl ? '📱' : category.emoji}
                    aspect={aspectFor(memory.id)}
                    badges={
                      <>
                        <Tag tone="rose">
                          {category.emoji} {category.label}
                        </Tag>
                        <PlatformBadge url={memory.instagramUrl ?? memory.tiktokUrl} />
                      </>
                    }
                    footer={
                      <>
                        {memory.date && <span className="text-sm font-bold text-muted">{formatDate(memory.date)}</span>}
                        <EditDeleteActions label={memory.title} onEdit={() => editor.openEdit(memory)} onDelete={() => void remove(memory)} />
                      </>
                    }
                  >
                    {memory.description && <p className="line-clamp-2">{memory.description}</p>}
                  </MediaCard>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <DetailModal
          open
          onClose={detail.close}
          title={selected.title}
          image={selected.imageUrl}
          hideImage={!selected.imageUrl}
          fallbackEmoji={MEMORY_CATEGORY_META[selected.category].emoji}
          badges={
            <Tag tone="rose">
              {MEMORY_CATEGORY_META[selected.category].emoji} {MEMORY_CATEGORY_META[selected.category].label}
            </Tag>
          }
          subtitle={formatDate(selected.date, true)}
          onEdit={() => editor.openEdit(selected)}
          onDelete={() => void remove(selected)}
        >
          {selected.description && (
            <DetailSection title="Beschreibung">
              <p className="whitespace-pre-line">{selected.description}</p>
            </DetailSection>
          )}
          {[selected.instagramUrl, selected.tiktokUrl].filter(Boolean).map((url) => (
            <MediaPreview key={url} url={url} title={selected.title} date={selected.date} />
          ))}
        </DetailModal>
      )}

      {editor.open && <MemoryForm memory={editor.entity} onClose={editor.close} onSave={(draft, id) => actions.save(draft, id)} />}
    </>
  );
}
