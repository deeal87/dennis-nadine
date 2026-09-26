import type { Anime } from '@/types/models';
import { MediaCard, EditDeleteActions } from '@/components/cards/MediaCard';
import { Tag } from '@/components/ui/Tag';
import { RatingsSummary } from '@/components/ui/RatingStars';
import { Button } from '@/components/ui/Button';
import { ANIME_STATUS_META } from './config';
import { InterestBadges } from './InterestBadges';

interface AnimeCardProps {
  anime: Anime;
  inTop3: boolean;
  top3Full: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddTop3: () => void;
}

export function AnimeCard({ anime, inTop3, top3Full, onOpen, onEdit, onDelete, onAddTop3 }: AnimeCardProps) {
  const status = ANIME_STATUS_META[anime.status];
  return (
    <MediaCard
      title={anime.title}
      onOpen={onOpen}
      image={anime.coverUrl}
      fallbackEmoji="🎬"
      aspect="aspect-[16/10] min-[480px]:aspect-[4/5]"
      muted={anime.status === 'dropped'}
      badges={
        <Tag tone={status.tone} className="shadow-sm">
          {status.emoji} {status.label}
        </Tag>
      }
      footer={
        <>
          {!inTop3 && anime.status !== 'completed' && anime.status !== 'dropped' && (
            <Button size="sm" variant="soft" onClick={onAddTop3} disabled={top3Full} title={top3Full ? 'Top 3 ist voll' : undefined}>
              🥇 Zur Top 3
            </Button>
          )}
          {inTop3 && <Tag tone="gold">🏆 In unserer Top 3</Tag>}
          <EditDeleteActions label={anime.title} onEdit={onEdit} onDelete={onDelete} />
        </>
      }
    >
      <InterestBadges people={anime.interestedBy} />
      {anime.genres.length > 0 && <p className="line-clamp-1">{anime.genres.join(' · ')}</p>}
      <RatingsSummary ratings={anime} />
    </MediaCard>
  );
}
