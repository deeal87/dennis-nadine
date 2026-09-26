import type { BaseEntity } from '@/types/models';
import { createId } from '@/lib/id';
import { nowIso } from '@/lib/date';
import { countAll, deleteOne, getAll, getOne, putMany, putOne, type StoreMap, type StoreName } from '../database';

/** Stores whose records are regular user entities (not singletons like settings). */
export type EntityStoreName = {
  [S in StoreName]: StoreMap[S] extends BaseEntity ? S : never;
}[StoreName];

/** Input for create/update: everything except the bookkeeping fields. */
export type Draft<T extends BaseEntity> = Omit<T, keyof BaseEntity>;

export interface Repository<T extends BaseEntity> {
  readonly store: EntityStoreName;
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  count(): Promise<number>;
  create(draft: Draft<T>): Promise<T>;
  createMany(drafts: readonly Draft<T>[]): Promise<T[]>;
  update(id: string, patch: Partial<Draft<T>>): Promise<T>;
  remove(id: string): Promise<T | undefined>;
  /** Puts a previously removed entity back unchanged (undo). */
  restore(entity: T): Promise<void>;
}

export function createRepository<S extends EntityStoreName>(store: S): Repository<StoreMap[S]> {
  type T = StoreMap[S];

  const build = (draft: Draft<T>): T => {
    const now = nowIso();
    return { ...draft, id: createId(), createdAt: now, updatedAt: now } as T;
  };

  return {
    store,
    list: () => getAll(store),
    get: (id) => getOne(store, id),
    count: () => countAll(store),
    async create(draft) {
      const entity = build(draft);
      await putOne(store, entity);
      return entity;
    },
    async createMany(drafts) {
      const entities = drafts.map(build);
      await putMany(store, entities);
      return entities;
    },
    async update(id, patch) {
      const existing = await getOne(store, id);
      if (!existing) throw new Error(`Eintrag ${id} wurde nicht gefunden.`);
      const updated = { ...existing, ...patch, id, createdAt: existing.createdAt, updatedAt: nowIso() } as T;
      await putOne(store, updated);
      return updated;
    },
    async remove(id) {
      const existing = await getOne(store, id);
      await deleteOne(store, id);
      return existing;
    },
    restore: (entity) => putOne(store, entity),
  };
}
