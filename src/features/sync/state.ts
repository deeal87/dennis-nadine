/**
 * Sync status shared across the UI: "unsaved changes" (persisted, drives the
 * red dot) and what we know about the state on GitHub.
 */

export type RemoteState =
  | { kind: 'unknown' }
  | { kind: 'offline'; message: string }
  | { kind: 'none' }
  | { kind: 'in-sync'; version: number; savedAt: string }
  /** Saved elsewhere with a password this device doesn't have yet. */
  | { kind: 'key-mismatch'; version: number; savedAt: string }
  /** Newer on GitHub and unsaved changes here. */
  | { kind: 'conflict'; version: number; savedAt: string };

export interface SyncSnapshot {
  dirty: boolean;
  remote: RemoteState;
}

const DIRTY_KEY = 'dn-sync-dirty';
const listeners = new Set<() => void>();
let suppressed = 0;

function readDirty(): boolean {
  try {
    return localStorage.getItem(DIRTY_KEY) === '1';
  } catch {
    return false;
  }
}

let snapshot: SyncSnapshot = { dirty: readDirty(), remote: { kind: 'unknown' } };

function publish(next: Partial<SyncSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function persistDirty(value: boolean): void {
  try {
    if (value) localStorage.setItem(DIRTY_KEY, '1');
    else localStorage.removeItem(DIRTY_KEY);
  } catch {
    // Storage unavailable – the flag still works for this session.
  }
}

export function markDirty(): void {
  if (suppressed > 0 || snapshot.dirty) return;
  persistDirty(true);
  publish({ dirty: true });
}

export function clearDirty(): void {
  persistDirty(false);
  publish({ dirty: false });
}

export function isDirty(): boolean {
  return snapshot.dirty;
}

export function setRemoteState(remote: RemoteState): void {
  publish({ remote });
}

/** Runs writes (e.g. loading the remote state) without flagging them as unsaved changes. */
export async function withoutDirtyTracking<T>(run: () => Promise<T>): Promise<T> {
  suppressed++;
  try {
    return await run();
  } finally {
    suppressed--;
  }
}

export function getSyncSnapshot(): SyncSnapshot {
  return snapshot;
}

export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
