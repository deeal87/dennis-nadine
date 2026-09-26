import { useCallback, useMemo } from 'react';
import { RANKING_LIMITS, type RankingId } from '@/types/models';
import { rankingRepository } from '@/data/repositories';
import { addToRanking, moveInRanking, removeFromRanking, sanitizeRanking } from '@/lib/ranking';
import { useToast } from '@/components/ui/Toast';
import { useRanking } from './useStore';

/** Top-3 / wishlist operations on top of the pure ranking helpers. */
export function useRankingActions(id: RankingId, existingIds: readonly string[]) {
  const ranking = useRanking(id);
  const toast = useToast();
  const limit = RANKING_LIMITS[id];

  const ids = useMemo(() => sanitizeRanking(ranking.itemIds, new Set(existingIds), limit), [ranking.itemIds, existingIds, limit]);

  const persist = useCallback(
    (next: string[]) =>
      rankingRepository.set(id, next).catch(() => toast({ tone: 'error', message: 'Reihenfolge konnte nicht gespeichert werden.' })),
    [id, toast],
  );

  const add = useCallback(
    (itemId: string, position?: number) => {
      const result = addToRanking(ids, itemId, limit, position);
      if (!result.ok) {
        toast({ tone: 'info', message: result.reason === 'full' ? `Alle ${limit} Plätze sind belegt – erst einen Platz freimachen.` : 'Ist schon dabei 💫' });
        return false;
      }
      void persist(result.ids);
      return true;
    },
    [ids, limit, persist, toast],
  );

  const remove = useCallback((itemId: string) => void persist(removeFromRanking(ids, itemId)), [ids, persist]);
  const reorder = useCallback((from: number, to: number) => void persist(moveInRanking(ids, from, to)), [ids, persist]);

  return { ids, limit, full: ids.length >= limit, has: (itemId: string) => ids.includes(itemId), add, remove, reorder };
}
