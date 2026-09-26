import type { ReactNode } from 'react';
import { GripVertical, X } from 'lucide-react';
import { SortableList } from '../ui/SortableList';
import { SmartImage } from '../ui/SmartImage';
import { IconButton } from '../ui/Button';
import { inputClass } from '../ui/form';
import { placeLabel } from '@/lib/ranking';
import { cn } from '@/lib/cn';

interface RankingBoardProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  /** Ranked items, already resolved and in order. */
  items: readonly T[];
  limit: number;
  getLabel: (item: T) => string;
  getImage?: (item: T) => string | undefined;
  renderMeta?: (item: T) => ReactNode;
  fallbackEmoji: string;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  /** Items that can still be added. */
  candidates: readonly T[];
  onAdd: (id: string) => void;
  onOpen?: (item: T) => void;
  emptyText: string;
  /** "podium" = up to 3 columns (Top 3), "list" = compact rows (Top 10). */
  layout?: 'podium' | 'list';
}

/** Drag & drop ranking with fixed number of places (Top 3, Wishlist Top 10). */
export function RankingBoard<T extends { id: string }>({
  title,
  subtitle,
  items,
  limit,
  getLabel,
  getImage,
  renderMeta,
  fallbackEmoji,
  onReorder,
  onRemove,
  candidates,
  onAdd,
  onOpen,
  emptyText,
  layout = 'list',
}: RankingBoardProps<T>) {
  const podium = layout === 'podium';
  const freeSlots = Math.max(0, limit - items.length);

  return (
    <section className="card pattern-waves relative overflow-hidden p-4 sm:p-6" aria-label={title}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {freeSlots > 0 && candidates.length > 0 && (
          <select
            aria-label={`Zu „${title}“ hinzufügen`}
            className={cn(inputClass, 'cursor-pointer sm:w-64')}
            value=""
            onChange={(event) => event.target.value && onAdd(event.target.value)}
          >
            <option value="">＋ Platz belegen …</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {getLabel(candidate)}
              </option>
            ))}
          </select>
        )}
      </div>

      {items.length === 0 && <p className="mb-3 text-center font-display text-lg text-muted">✨ {emptyText}</p>}

      <SortableList
        items={items}
        getId={(item) => item.id}
        getLabel={getLabel}
        onReorder={onReorder}
        className={cn('grid gap-3', podium ? 'sm:grid-cols-3' : 'grid-cols-1')}
        renderItem={(item, index, handle, dragging) => (
          <div
            className={cn(
              'flex h-full items-center gap-3 rounded-3xl border border-line bg-surface p-2 pr-1 transition',
              podium && 'sm:flex-col sm:items-stretch sm:p-3',
              dragging ? 'shadow-[var(--shadow-lift)] ring-2 ring-rose' : 'shadow-[var(--shadow-soft)]',
            )}
          >
            <div className={cn('relative shrink-0', podium ? 'w-20 sm:w-full' : 'w-14')}>
              <SmartImage
                src={getImage?.(item)}
                alt={getLabel(item)}
                aspect={podium ? 'aspect-square sm:aspect-[4/3]' : 'aspect-square'}
                fallbackEmoji={fallbackEmoji}
                className="rounded-2xl"
              />
              <span className="absolute -left-1 -top-1 grid size-8 place-items-center rounded-full bg-surface text-lg font-extrabold shadow-[var(--shadow-soft)]">
                {placeLabel(index)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              {onOpen ? (
                <button type="button" onClick={() => onOpen(item)} className="block max-w-full truncate text-left font-bold hover:text-rose">
                  {getLabel(item)}
                </button>
              ) : (
                <p className="truncate font-bold">{getLabel(item)}</p>
              )}
              {renderMeta && <div className="truncate text-sm text-muted">{renderMeta(item)}</div>}
            </div>
            <div className={cn('flex shrink-0 items-center', podium && 'sm:justify-between')}>
              <button
                type="button"
                {...handle}
                className="grid size-11 cursor-grab place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
              >
                <GripVertical className="size-5" aria-hidden />
              </button>
              <IconButton icon={X} label={`${getLabel(item)} aus „${title}“ entfernen`} onClick={() => onRemove(item.id)} />
            </div>
          </div>
        )}
      />

      {freeSlots > 0 && items.length > 0 && (
        <ol className={cn('mt-3 grid gap-3', podium ? 'sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-5')} aria-label="Freie Plätze">
          {Array.from({ length: freeSlots }, (_, i) => (
            <li
              key={i}
              className="grid min-h-14 place-items-center rounded-3xl border-2 border-dashed border-line text-sm font-bold text-muted"
            >
              {placeLabel(items.length + i)} frei
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
