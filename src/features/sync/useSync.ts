import { useSyncExternalStore } from 'react';
import { getSyncSnapshot, subscribeSync, type SyncSnapshot } from './state';

export function useSync(): SyncSnapshot {
  return useSyncExternalStore(subscribeSync, getSyncSnapshot);
}

/** Red dot: unsaved changes, or GitHub has something that needs attention. */
export function useSyncAttention(): boolean {
  const { dirty, remote } = useSync();
  return dirty || remote.kind === 'conflict' || remote.kind === 'key-mismatch';
}
