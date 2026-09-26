/** Pure helpers for ordered, size-limited rankings (Top 3, wishlist Top 10). */

/** Drops ids that no longer exist and duplicates, keeping order. */
export function sanitizeRanking(ids: readonly string[], existing: ReadonlySet<string>, limit: number): string[] {
  return [...new Set(ids)].filter((id) => existing.has(id)).slice(0, limit);
}

export type AddResult = { ok: true; ids: string[] } | { ok: false; reason: 'full' | 'duplicate' };

/** Appends an id (or inserts at `position`) if there is room. */
export function addToRanking(ids: readonly string[], id: string, limit: number, position = ids.length): AddResult {
  if (ids.includes(id)) return { ok: false, reason: 'duplicate' };
  if (ids.length >= limit) return { ok: false, reason: 'full' };
  const next = [...ids];
  next.splice(Math.max(0, Math.min(position, next.length)), 0, id);
  return { ok: true, ids: next };
}

export function removeFromRanking(ids: readonly string[], id: string): string[] {
  return ids.filter((entry) => entry !== id);
}

/** Moves the element at `from` to index `to` (clamped). */
export function moveInRanking<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length) return [...items];
  const target = Math.max(0, Math.min(to, items.length - 1));
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved as T);
  return next;
}

/** Resolves ids to entities, skipping missing ones. */
export function resolveRanking<T extends { id: string }>(ids: readonly string[], items: readonly T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

export const MEDALS = ['🥇', '🥈', '🥉'] as const;

export function placeLabel(index: number): string {
  return MEDALS[index] ?? `${index + 1}.`;
}
