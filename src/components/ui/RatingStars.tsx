import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Ratings } from '@/types/models';

const STARS = [1, 2, 3, 4, 5] as const;

interface RatingStarsProps {
  value?: number;
  onChange?: (value: number) => void;
  label: string;
  size?: 'sm' | 'md';
}

/** Read-only when `onChange` is omitted. Clicking the current value resets to 0. */
export function RatingStars({ value = 0, onChange, label, size = 'md' }: RatingStarsProps) {
  const iconSize = size === 'sm' ? 'size-4' : 'size-6';
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: ${value} von 5 Sternen`}>
        {STARS.map((star) => (
          <Star key={star} aria-hidden className={cn(iconSize, star <= value ? 'fill-gold text-gold' : 'text-line')} />
        ))}
      </span>
    );
  }
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} ${star === 1 ? 'Stern' : 'Sterne'}`}
          onClick={() => onChange(star === value ? 0 : star)}
          className="grid size-10 place-items-center rounded-full transition hover:scale-110 active:scale-95"
        >
          <Star aria-hidden className={cn(iconSize, 'transition', star <= value ? 'fill-gold text-gold' : 'text-line')} />
        </button>
      ))}
    </div>
  );
}

const RATING_ROWS = [
  { key: 'dennisRating', label: 'Dennis', nickname: 'Baby' },
  { key: 'nadineRating', label: 'Nadine', nickname: 'Babe' },
  { key: 'sharedRating', label: 'Gemeinsam', nickname: '❤️' },
] as const;

export function RatingsEditor({ value, onChange }: { value: Ratings; onChange: (value: Ratings) => void }) {
  return (
    <fieldset className="rounded-2xl border border-line bg-surface-2/50 p-3">
      <legend className="px-1 text-sm font-bold">Bewertungen</legend>
      <div className="flex flex-col">
        {RATING_ROWS.map((row) => (
          <div key={row.key} className="flex flex-wrap items-center justify-between gap-x-3">
            <span className="text-sm font-bold">
              {row.label} <span className="font-semibold text-muted">({row.nickname})</span>
            </span>
            <RatingStars
              label={`Bewertung ${row.label}`}
              value={value[row.key]}
              onChange={(rating) => onChange({ ...value, [row.key]: rating || undefined })}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/** Compact summary: shared rating if present, otherwise the average of both. */
export function RatingsSummary({ ratings }: { ratings: Ratings }) {
  const personal = [ratings.dennisRating, ratings.nadineRating].filter((r): r is number => !!r);
  const value = ratings.sharedRating || (personal.length ? Math.round(personal.reduce((a, b) => a + b, 0) / personal.length) : 0);
  if (!value) return null;
  return <RatingStars size="sm" value={value} label={ratings.sharedRating ? 'Gemeinsame Bewertung' : 'Durchschnitt'} />;
}

export function RatingsDetails({ ratings }: { ratings: Ratings }) {
  const rows = RATING_ROWS.filter((row) => ratings[row.key]);
  if (rows.length === 0) return null;
  return (
    <dl className="grid gap-1.5 rounded-2xl bg-surface-2 p-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-3">
          <dt className="text-sm font-bold">
            {row.label} <span className="text-muted">({row.nickname})</span>
          </dt>
          <dd>
            <RatingStars size="sm" value={ratings[row.key]} label={`Bewertung ${row.label}`} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
