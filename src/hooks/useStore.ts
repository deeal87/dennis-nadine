import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { StoreMap, StoreName } from '@/data/database';
import { getSnapshot, subscribe, type StoreSnapshot } from '@/data/live';
import type { Ranking, RankingId, Settings } from '@/types/models';
import { DEFAULT_SETTINGS } from '@/data/repositories';

/** Live list of all records in a store. */
export function useStore<S extends StoreName>(store: S): StoreSnapshot<StoreMap[S]> {
  const sub = useCallback((notify: () => void) => subscribe(store, notify), [store]);
  const snap = useCallback(() => getSnapshot(store), [store]);
  return useSyncExternalStore(sub, snap);
}

export function useRanking(id: RankingId): Ranking {
  const { items } = useStore('rankings');
  return useMemo(() => items.find((r) => r.id === id) ?? { id, itemIds: [], updatedAt: '' }, [items, id]);
}

export function useSettings(): Settings {
  const { items } = useStore('settings');
  return useMemo(() => ({ ...DEFAULT_SETTINGS, ...items[0] }), [items]);
}
