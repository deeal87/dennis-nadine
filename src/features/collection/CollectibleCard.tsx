import type { CollectibleItem, CollectionConfig } from './types';
import { CornerToggle, EditDeleteActions, MediaCard } from '@/components/cards/MediaCard';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';

interface CollectibleCardProps<T extends CollectibleItem> {
  config: CollectionConfig<T>;
  item: T;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onToggleStatus: () => void;
}

export function CollectibleCard<T extends CollectibleItem>({ config, item, onOpen, onEdit, onDelete, onToggleFavorite, onToggleStatus }: CollectibleCardProps<T>) {
  const wish = item.status === 'wishlist';
  return (
    <MediaCard
      title={item.name}
      onOpen={onOpen}
      image={item.imageUrl}
      fallbackEmoji={config.emoji}
      aspect="aspect-square"
      badges={wish ? <Tag tone="peach">🎀 Wunschliste</Tag> : <Tag tone="mint">✅ Gesammelt</Tag>}
      corner={
        <CornerToggle active={item.favorite} label={item.favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'} onClick={onToggleFavorite}>
          💖
        </CornerToggle>
      }
      footer={
        <>
          <Button size="sm" variant={wish ? 'soft' : 'ghost'} onClick={onToggleStatus}>
            {wish ? '✓ Haben wir!' : '🎀 Auf Wunschliste'}
          </Button>
          <EditDeleteActions label={item.name} onEdit={onEdit} onDelete={onDelete} />
        </>
      }
    >
      {config.describe(item) && <p className="line-clamp-2">{config.describe(item)}</p>}
    </MediaCard>
  );
}
