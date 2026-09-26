/**
 * Series / theme completion ("Dragon Ball 7 / 15"). Pure functions so they can
 * be tested without a database.
 */
import type { SeriesCatalog, SeriesCatalogItem } from '@/types/models';
import { normalizeText } from '@/lib/text';
import { createId } from '@/lib/id';

export interface OwnedEntry {
  group?: string;
  number?: string;
  name: string;
  owned: boolean;
}

export interface SeriesProgress {
  name: string;
  catalog?: SeriesCatalog;
  owned: number;
  /** Size of the known series; undefined when there is no catalog. */
  total?: number;
  missing: SeriesCatalogItem[];
}

const sameText = (a?: string, b?: string) => !!a && !!b && normalizeText(a) === normalizeText(b);

/** A collection entry counts for a catalog figure if the number matches, otherwise the name. */
export function matchesCatalogItem(entry: OwnedEntry, item: SeriesCatalogItem): boolean {
  if (entry.number && item.number) return normalizeText(entry.number) === normalizeText(item.number);
  return sameText(entry.name, item.name);
}

export function computeSeriesProgress(entries: readonly OwnedEntry[], catalogs: readonly SeriesCatalog[]): SeriesProgress[] {
  const names = new Map<string, string>();
  for (const entry of entries) if (entry.group) names.set(normalizeText(entry.group), entry.group);
  for (const catalog of catalogs) names.set(normalizeText(catalog.name), catalog.name);

  return [...names.entries()]
    .map(([key, name]) => {
      const catalog = catalogs.find((c) => normalizeText(c.name) === key);
      const owned = entries.filter((e) => e.owned && e.group && normalizeText(e.group) === key);
      if (!catalog) return { name, owned: owned.length, missing: [] };
      const have = catalog.items.filter((item) => owned.some((entry) => matchesCatalogItem(entry, item)));
      return {
        name: catalog.name,
        catalog,
        owned: have.length,
        total: catalog.items.length,
        missing: catalog.items.filter((item) => !have.includes(item)),
      };
    })
    .sort((a, b) => Number(!!b.catalog) - Number(!!a.catalog) || b.owned - a.owned || a.name.localeCompare(b.name, 'de'));
}

/** "121 Goku" / "#121 Goku" → number + name; lines without a leading number are just names. */
export function parseCatalogLine(line: string): SeriesCatalogItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^#?([\w-]*\d[\w-]*)\s+(.+)$/);
  return match ? { id: createId(), number: match[1], name: match[2]!.trim() } : { id: createId(), name: trimmed };
}

export function formatCatalogLine(item: SeriesCatalogItem): string {
  return item.number ? `${item.number} ${item.name}` : item.name;
}
