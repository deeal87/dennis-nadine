/**
 * Thin, promise-based IndexedDB layer. This is the only module that talks to
 * IndexedDB directly; everything else goes through repositories.
 */
import type {
  Anime,
  BucketItem,
  DatePlace,
  Funko,
  LegoSet,
  Memory,
  Ranking,
  Recipe,
  SeriesCatalog,
  Settings,
  TimelineEvent,
} from '@/types/models';
import { notifyChange } from './events';

export const DB_NAME = 'dennis-nadine';
export const DB_VERSION = 1;

export interface StoreMap {
  anime: Anime;
  recipes: Recipe;
  dates: DatePlace;
  funkos: Funko;
  lego: LegoSet;
  series: SeriesCatalog;
  memories: Memory;
  timeline: TimelineEvent;
  bucket: BucketItem;
  rankings: Ranking;
  settings: Settings;
}

export type StoreName = keyof StoreMap;

export const STORE_NAMES = [
  'anime',
  'recipes',
  'dates',
  'funkos',
  'lego',
  'series',
  'memories',
  'timeline',
  'bucket',
  'rankings',
  'settings',
] as const satisfies readonly StoreName[];

export class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DatabaseError('IndexedDB-Anfrage fehlgeschlagen', { cause: request.error }));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () =>
      reject(new DatabaseError('IndexedDB-Transaktion fehlgeschlagen', { cause: tx.error }));
  });
}

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new DatabaseError('IndexedDB wird von diesem Browser nicht unterstützt.'));
  }
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgraded the schema: drop our handle so the next call reopens.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(new DatabaseError('Die lokale Datenbank konnte nicht geöffnet werden.', { cause: request.error }));
    };
    request.onblocked = () => {
      reject(new DatabaseError('Die Datenbank ist in einem anderen Tab blockiert. Bitte andere Tabs schließen.'));
    };
  });
  return dbPromise;
}

async function withStore<S extends StoreName, R>(
  store: S,
  mode: IDBTransactionMode,
  run: (objectStore: IDBObjectStore) => IDBRequest<R> | void,
): Promise<R | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(store, mode);
  const request = run(tx.objectStore(store));
  const [result] = await Promise.all([request ? promisify(request) : Promise.resolve(undefined), transactionDone(tx)]);
  if (mode === 'readwrite') notifyChange(store);
  return result;
}

export async function getAll<S extends StoreName>(store: S): Promise<StoreMap[S][]> {
  return ((await withStore(store, 'readonly', (s) => s.getAll())) ?? []) as StoreMap[S][];
}

export async function getOne<S extends StoreName>(store: S, id: string): Promise<StoreMap[S] | undefined> {
  return (await withStore(store, 'readonly', (s) => s.get(id))) as StoreMap[S] | undefined;
}

export async function putOne<S extends StoreName>(store: S, value: StoreMap[S]): Promise<void> {
  await withStore(store, 'readwrite', (s) => s.put(value));
}

export async function putMany<S extends StoreName>(store: S, values: readonly StoreMap[S][]): Promise<void> {
  await withStore(store, 'readwrite', (s) => {
    for (const value of values) s.put(value);
  });
}

export async function deleteOne(store: StoreName, id: string): Promise<void> {
  await withStore(store, 'readwrite', (s) => s.delete(id));
}

export async function countAll(store: StoreName): Promise<number> {
  return (await withStore(store, 'readonly', (s) => s.count())) ?? 0;
}

export type DatabaseSnapshot = { [S in StoreName]: StoreMap[S][] };

export async function readAllStores(): Promise<DatabaseSnapshot> {
  const entries = await Promise.all(STORE_NAMES.map(async (name) => [name, await getAll(name)] as const));
  return Object.fromEntries(entries) as DatabaseSnapshot;
}

/**
 * Atomically replaces the content of all given stores (used by import and reset).
 * Stores missing from `data` are cleared.
 */
export async function replaceAllStores(data: Partial<DatabaseSnapshot>): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  for (const name of STORE_NAMES) {
    const store = tx.objectStore(name);
    store.clear();
    for (const value of data[name] ?? []) store.put(value);
  }
  await transactionDone(tx);
  for (const name of STORE_NAMES) notifyChange(name);
}

/** Test helper: closes the connection so a fresh database can be opened. */
export async function resetConnectionForTests(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}
