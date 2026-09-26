import type { CollectionDomain, Funko, LegoSet, RankingId } from '@/types/models';
import type { Repository } from '@/data/repositories';

export type CollectibleItem = Funko | LegoSet;

export interface ExtraField<T> {
  key: keyof T & string;
  label: string;
  type: 'text' | 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  /** Offer existing group names as suggestions. */
  groupSuggestions?: boolean;
}

/**
 * Everything that differs between Funko Pops and LEGO. The generic collection
 * page, form, series progress and photo capture are driven by this config.
 */
export interface CollectionConfig<T extends CollectibleItem> {
  domain: CollectionDomain;
  store: 'funkos' | 'lego';
  repository: Repository<T>;
  wishlistRanking: RankingId;
  title: string;
  subtitle: string;
  wishlistTitle: string;
  emoji: string;
  noun: string;
  nounPlural: string;
  /** Field that groups items into a series / theme. */
  groupKey: keyof T & string;
  groupLabel: string;
  groupLabelPlural: string;
  /** Collector number (Funko box number, LEGO set number). */
  numberKey: keyof T & string;
  numberLabel: string;
  extraFields: ExtraField<T>[];
  /** Short line under the title on cards. */
  describe: (item: T) => string;
  empty: { emoji: string; title: string; text: string };
}

export function groupOf<T extends CollectibleItem>(config: CollectionConfig<T>, item: T): string | undefined {
  const value = item[config.groupKey];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function numberOf<T extends CollectibleItem>(config: CollectionConfig<T>, item: T): string | undefined {
  const value = item[config.numberKey];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
