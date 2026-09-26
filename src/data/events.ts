/**
 * Change notifications for stores. Listeners are informed after every write,
 * both within this tab and (via BroadcastChannel) in other open tabs.
 */
import type { StoreName } from './database';
import { markDirty } from '@/features/sync/state';

type Listener = () => void;

const listeners = new Map<StoreName, Set<Listener>>();
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('dennis-nadine-data');

function emit(store: StoreName): void {
  listeners.get(store)?.forEach((listener) => listener());
}

channel?.addEventListener('message', (event: MessageEvent<StoreName>) => emit(event.data));

export function notifyChange(store: StoreName): void {
  // Settings are per device; everything else is shared state worth saving.
  if (store !== 'settings') markDirty();
  emit(store);
  channel?.postMessage(store);
}

export function subscribeToStore(store: StoreName, listener: Listener): () => void {
  let set = listeners.get(store);
  if (!set) {
    set = new Set();
    listeners.set(store, set);
  }
  set.add(listener);
  return () => set.delete(listener);
}
