import { MapPinned } from 'lucide-react';
import type { DatePlace } from '@/types/models';
import { EditDeleteActions, MediaCard } from '@/components/cards/MediaCard';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { RatingsSummary } from '@/components/ui/RatingStars';
import { formatDate } from '@/lib/date';
import { DATE_CATEGORY_META, PRICE_LABELS } from './config';

interface DateCardProps {
  place: DatePlace;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export function DateCard({ place, onOpen, onEdit, onDelete, onToggleStatus }: DateCardProps) {
  const category = DATE_CATEGORY_META[place.category];
  const done = place.status === 'done';
  return (
    <MediaCard
      title={place.name}
      onOpen={onOpen}
      image={place.photoUrl}
      fallbackEmoji={category.emoji}
      badges={
        <>
          <Tag tone="violet">
            {category.emoji} {category.label}
          </Tag>
          {done ? <Tag tone="rose">❤️ Erlebt</Tag> : <Tag tone="mint">🌱 Neu</Tag>}
        </>
      }
      footer={
        <>
          <Button size="sm" variant={done ? 'secondary' : 'soft'} onClick={onToggleStatus}>
            {done ? '↩︎ Nochmal ausprobieren' : '✓ Erlebt!'}
          </Button>
          <EditDeleteActions label={place.name} onEdit={onEdit} onDelete={onDelete} />
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {(place.city || place.address) && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPinned className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{place.city ?? place.address}</span>
          </span>
        )}
        {place.priceRange && <span className="font-bold">{PRICE_LABELS[place.priceRange]}</span>}
        {place.date && <span>{formatDate(place.date)}</span>}
      </div>
      <RatingsSummary ratings={place} />
    </MediaCard>
  );
}
