import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useRanking, useStore } from '@/hooks/useStore';
import { PATHS, withDetail } from '@/app/paths';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SmartImage } from '@/components/ui/SmartImage';
import { placeLabel, resolveRanking } from '@/lib/ranking';
import { formatDate, todayIso } from '@/lib/date';
import { TIMELINE_CATEGORY_META } from '../timeline/config';

function Panel({ title, to, linkLabel, children }: { title: string; to: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link to={to} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-rose hover:bg-rose-soft">
          {linkLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}

export function WorldOverview() {
  const anime = useStore('anime').items;
  const bucket = useStore('bucket').items;
  const timeline = useStore('timeline').items;
  const top3 = useRanking('anime-top3');
  const ranked = useMemo(() => resolveRanking(top3.itemIds, anime).slice(0, 3), [top3.itemIds, anime]);
  const done = bucket.filter((b) => b.done).length;

  const today = todayIso();
  const moments = useMemo(() => [...timeline].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3), [timeline]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="🏆 Unsere Top 3" to={PATHS.anime} linkLabel="Anime">
        {ranked.length === 0 ? (
          <p className="text-muted">Unsere nächsten Abenteuer warten noch...</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {ranked.map((a, index) => (
              <li key={a.id}>
                <Link to={withDetail(PATHS.anime, a.id)} className="flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-surface-2">
                  <SmartImage src={a.coverUrl} alt={a.title} aspect="aspect-square" fallbackEmoji="🎬" className="w-12 shrink-0 rounded-xl" />
                  <span className="text-xl" aria-label={`Platz ${index + 1}`}>
                    {placeLabel(index)}
                  </span>
                  <span className="min-w-0 truncate font-bold">{a.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel title="🌠 Bucket List" to={PATHS.bucket} linkLabel="Alle Träume">
        {bucket.length === 0 ? (
          <p className="text-muted">Noch keine Träume notiert – was wollt ihr unbedingt zusammen erleben?</p>
        ) : (
          <>
            <ProgressBar value={done} max={bucket.length} label="erledigt" />
            <ul className="flex flex-col gap-1 text-sm">
              {bucket
                .filter((b) => !b.done)
                .slice(0, 3)
                .map((b) => (
                  <li key={b.id} className="truncate rounded-xl bg-surface-2 px-3 py-2 font-semibold">
                    ✨ {b.title}
                  </li>
                ))}
            </ul>
          </>
        )}
      </Panel>

      <Panel title="💞 Unsere Timeline" to={PATHS.timeline} linkLabel="Timeline">
        <ol className="flex flex-col gap-2">
          {moments.map((m) => (
            <li key={m.id}>
              <Link to={withDetail(PATHS.timeline, m.id)} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-soft text-lg" aria-hidden>
                  {TIMELINE_CATEGORY_META[m.category].emoji}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{m.title}</span>
                  <span className="block text-xs font-bold text-muted">
                    {formatDate(m.date)}
                    {m.date > today && ' · bald'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
