import { useCallback, useState } from 'react';
import type { Anime } from '@/types/models';
import { animeRepository } from '@/data/repositories';
import { useToast } from '@/components/ui/Toast';
import { searchAnime } from '../image-search/providers';

/** Jikan allows ~3 requests per second; stay well below. */
const REQUEST_GAP_MS = 700;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Fills in missing covers (and episode counts) with the best online match. */
export function useFindCovers() {
  const toast = useToast();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const run = useCallback(
    async (anime: readonly Anime[]) => {
      const missing = anime.filter((a) => !a.coverUrl);
      if (missing.length === 0) return;
      let found = 0;
      setProgress({ done: 0, total: missing.length });
      for (const [index, item] of missing.entries()) {
        if (index > 0) await wait(REQUEST_GAP_MS);
        const [best] = await searchAnime(item.title);
        if (best) {
          await animeRepository
            .update(item.id, { coverUrl: best.url, episodes: item.episodes ?? best.meta?.episodes })
            .then(() => found++)
            .catch(() => undefined);
        }
        setProgress({ done: index + 1, total: missing.length });
      }
      setProgress(null);
      toast(
        found > 0
          ? { message: `✨ ${found} von ${missing.length} Covern gefunden – falsches Bild? Einfach beim Anime ändern.` }
          : { tone: 'info', message: 'Keine Cover gefunden – vielleicht gerade offline?' },
      );
    },
    [toast],
  );

  return { run, progress, running: progress !== null };
}
