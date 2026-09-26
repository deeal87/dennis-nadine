/**
 * Reactive read cache over the stores. Each store is loaded once and reloaded
 * whenever it changes, so every component sees the same, stable snapshot.
 */
import { getAll, type StoreMap, type StoreName } from './database';
import { subscribeToStore } from './events';

export interface StoreSnapshot<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

const snapshots = new Map<StoreName, StoreSnapshot<unknown>>();
const subscribers = new Map<StoreName, Set<() => void>>();
const INITIAL: StoreSnapshot<never> = { items: [], loading: true, error: null };

function publish(store: StoreName, snapshot: StoreSnapshot<unknown>): void {
  snapshots.set(store, snapshot);
  subscribers.get(store)?.forEach((notify) => notify());
}

async function load(store: StoreName): Promise<void> {
  try {
    publish(store, { items: await getAll(store), loading: false, error: null });
  } catch (error) {
    const previous = snapshots.get(store) ?? INITIAL;
    publish(store, { ...previous, loading: false, error: error instanceof Error ? error.message : String(error) });
  }
}

export function getSnapshot<S extends StoreName>(store: S): StoreSnapshot<StoreMap[S]> {
  return (snapshots.get(store) ?? INITIAL) as StoreSnapshot<StoreMap[S]>;
}

export function subscribe(store: StoreName, notify: () => void): () => void {
  let set = subscribers.get(store);
  if (!set) {
    set = new Set();
    subscribers.set(store, set);
    subscribeToStore(store, () => void load(store));
    void load(store);
  }
  set.add(notify);
  return () => set.delete(notify);
}
