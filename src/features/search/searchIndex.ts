/**
 * Global search: turns every store into flat, searchable entries.
 * Pure functions – the dialog feeds them with live store data.
 */
import type { DatabaseSnapshot } from '@/data/database';
import { PATHS, withDetail } from '@/app/paths';
import { normalizeText } from '@/lib/text';
import { DATE_CATEGORY_META } from '../dates/config';
import { RECIPE_CATEGORY_META } from '../recipes/config';
import { BUCKET_CATEGORY_META } from '../bucket-list/config';
import { MEMORY_CATEGORY_META } from '../memories/config';
import { TIMELINE_CATEGORY_META } from '../timeline/config';
import { ANIME_STATUS_META } from '../anime/config';
import { formatDate } from '@/lib/date';

export type SearchGroup = 'Anime' | 'Rezepte' | 'Dates' | 'Funko Pops' | 'LEGO' | 'Memories' | 'Timeline' | 'Bucket List';

export interface SearchEntry {
  key: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  emoji: string;
  href: string;
  /** Pre-normalized haystacks. */
  titleText: string;
  bodyText: string;
}

type SearchSource = Pick<DatabaseSnapshot, 'anime' | 'recipes' | 'dates' | 'funkos' | 'lego' | 'memories' | 'timeline' | 'bucket'>;

function entry(
  group: SearchGroup,
  id: string,
  title: string,
  subtitle: string,
  emoji: string,
  href: string,
  extra: Array<string | undefined>,
): SearchEntry {
  return {
    key: `${group}:${id}`,
    group,
    title,
    subtitle,
    emoji,
    href,
    titleText: normalizeText(title),
    bodyText: normalizeText([subtitle, ...extra].filter(Boolean).join(' ')),
  };
}

export function buildSearchIndex(data: SearchSource): SearchEntry[] {
  return [
    ...data.anime.map((a) =>
      entry('Anime', a.id, a.title, ANIME_STATUS_META[a.status].label, '🎬', withDetail(PATHS.anime, a.id), [...a.genres, a.notes]),
    ),
    ...data.recipes.map((r) =>
      entry('Rezepte', r.id, r.title, RECIPE_CATEGORY_META[r.category].label, RECIPE_CATEGORY_META[r.category].emoji, PATHS.recipe(r.id), [
        r.description,
        r.notes,
        r.source,
        ...r.ingredients,
      ]),
    ),
    ...data.dates.map((d) => {
      const meta = DATE_CATEGORY_META[d.category];
      return entry('Dates', d.id, d.name, [meta.label, d.city].filter(Boolean).join(' · '), meta.emoji, withDetail(PATHS.dates, d.id), [
        d.description,
        d.address,
        d.notes,
        meta.plural,
      ]);
    }),
    ...data.funkos.map((f) =>
      entry('Funko Pops', f.id, f.name, [f.series, f.number && `#${f.number}`].filter(Boolean).join(' · ') || 'Funko Pop', '🎁', withDetail(PATHS.funkos, f.id), [
        f.character,
        f.notes,
      ]),
    ),
    ...data.lego.map((l) =>
      entry('LEGO', l.id, l.name, [l.theme, l.setNumber].filter(Boolean).join(' · ') || 'LEGO Set', '🧱', withDetail(PATHS.lego, l.id), [l.notes]),
    ),
    ...data.memories.map((m) =>
      entry('Memories', m.id, m.title, [MEMORY_CATEGORY_META[m.category].label, formatDate(m.date)].filter(Boolean).join(' · '), '📸', withDetail(PATHS.memories, m.id), [
        m.description,
      ]),
    ),
    ...data.timeline.map((t) =>
      entry('Timeline', t.id, t.title, formatDate(t.date), TIMELINE_CATEGORY_META[t.category].emoji, withDetail(PATHS.timeline, t.id), [t.description]),
    ),
    ...data.bucket.map((b) =>
      entry('Bucket List', b.id, b.title, `${BUCKET_CATEGORY_META[b.category].label}${b.done ? ' · erledigt' : ''}`, BUCKET_CATEGORY_META[b.category].emoji, withDetail(PATHS.bucket, b.id), [
        b.description,
      ]),
    ),
  ];
}

/** Every query word must match; title matches rank above body matches. */
export function searchEntries(index: readonly SearchEntry[], query: string, limit = 30): SearchEntry[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: Array<{ entry: SearchEntry; score: number }> = [];
  for (const item of index) {
    let score = 0;
    for (const word of words) {
      if (item.titleText.startsWith(word)) score += 4;
      else if (item.titleText.includes(word)) score += 3;
      else if (item.bodyText.includes(word)) score += 1;
      else {
        score = 0;
        break;
      }
    }
    if (score > 0) scored.push({ entry: item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'de'))
    .slice(0, limit)
    .map((s) => s.entry);
}
