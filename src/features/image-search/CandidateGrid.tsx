import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { ImageCandidate } from './providers';

interface CandidateGridProps {
  candidates: readonly ImageCandidate[];
  selectedUrl?: string;
  onPick: (candidate: ImageCandidate) => void;
  loading?: boolean;
  /** Compact single row (inline suggestions) or full grid (picker). */
  compact?: boolean;
}

/** Clickable image results. Images that fail to load are silently dropped. */
export function CandidateGrid({ candidates, selectedUrl, onPick, loading, compact }: CandidateGridProps) {
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  const visible = candidates.filter((c) => !broken.has(c.thumbUrl)).slice(0, compact ? 6 : 24);
  const grid = compact ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';

  if (loading && visible.length === 0) {
    return (
      <div className={cn('grid gap-2', grid)} aria-busy="true" aria-label="Bilder werden gesucht">
        {Array.from({ length: compact ? 6 : 8 }, (_, i) => (
          <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <ul className={cn('grid gap-2', grid)}>
      {visible.map((c) => (
        <li key={c.url}>
          <button
            type="button"
            onClick={() => onPick(c)}
            aria-pressed={selectedUrl === c.url}
            title={`${c.title} · ${c.source}`}
            className={cn(
              'group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-2 ring-offset-2 ring-offset-surface transition hover:scale-[1.03]',
              selectedUrl === c.url ? 'ring-4 ring-rose' : 'hover:ring-2 hover:ring-violet',
            )}
          >
            <img
              src={c.thumbUrl}
              alt={c.title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBroken((b) => new Set(b).add(c.thumbUrl))}
              className="absolute inset-0 size-full object-cover"
            />
            {!compact && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 pt-6 text-left text-xs font-bold text-white">
                <span className="line-clamp-2">{c.title}</span>
                <span className="font-semibold opacity-80">{c.source}</span>
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
