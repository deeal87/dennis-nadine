/** Extensible filter definition shared by all list pages: register a new entry to add a filter chip. */
export interface FilterDef<T> {
  id: string;
  label: string;
  emoji?: string;
  matches: (item: T) => boolean;
}

export function applyFilter<T>(items: readonly T[], filters: readonly FilterDef<T>[], id: string): T[] {
  const filter = filters.find((f) => f.id === id);
  return filter ? items.filter(filter.matches) : [...items];
}

export function countMatches<T>(items: readonly T[], filter: FilterDef<T>): number {
  return items.reduce((sum, item) => sum + (filter.matches(item) ? 1 : 0), 0);
}
