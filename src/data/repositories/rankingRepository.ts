import { RANKING_LIMITS, type Ranking, type RankingId } from '@/types/models';
import { nowIso } from '@/lib/date';
import { getOne, putOne } from '../database';

export const rankingRepository = {
  async get(id: RankingId): Promise<Ranking> {
    return (await getOne('rankings', id)) ?? { id, itemIds: [], updatedAt: nowIso() };
  },
  async set(id: RankingId, itemIds: readonly string[]): Promise<Ranking> {
    const ranking: Ranking = { id, itemIds: [...new Set(itemIds)].slice(0, RANKING_LIMITS[id]), updatedAt: nowIso() };
    await putOne('rankings', ranking);
    return ranking;
  },
};
