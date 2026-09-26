import type { Anime, AnimeStatus } from '@/types/models';
import type { FilterDef } from '@/lib/filters';
import type { TagTone } from '@/components/ui/Tag';

export const ANIME_STATUS_META: Record<AnimeStatus, { label: string; emoji: string; tone: TagTone }> = {
  planned: { label: 'Geplant', emoji: '📝', tone: 'violet' },
  watching: { label: 'Schauen wir gerade', emoji: '🍿', tone: 'rose' },
  completed: { label: 'Abgeschlossen', emoji: '✅', tone: 'mint' },
  paused: { label: 'Pausiert', emoji: '⏸️', tone: 'peach' },
  dropped: { label: 'Abgebrochen', emoji: '💤', tone: 'neutral' },
};

export const ANIME_FILTERS: readonly FilterDef<Anime>[] = [
  { id: 'all', label: 'Alle', matches: () => true },
  { id: 'planned', label: 'Geplant', emoji: '📝', matches: (a) => a.status === 'planned' },
  { id: 'watching', label: 'Aktuell', emoji: '🍿', matches: (a) => a.status === 'watching' },
  { id: 'completed', label: 'Abgeschlossen', emoji: '✅', matches: (a) => a.status === 'completed' },
  { id: 'paused', label: 'Pausiert', emoji: '⏸️', matches: (a) => a.status === 'paused' },
  { id: 'dropped', label: 'Abgebrochen', emoji: '💤', matches: (a) => a.status === 'dropped' },
];

export const GENRE_SUGGESTIONS = [
  'Action', 'Abenteuer', 'Fantasy', 'Romantik', 'Komödie', 'Drama', 'Slice of Life', 'Mystery', 'Sci-Fi', 'Sport', 'Horror', 'Film',
];
