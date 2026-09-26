import { IDBFactory } from 'fake-indexeddb';
import { resetConnectionForTests } from '@/data/database';

/** Gives every test a brand-new, empty IndexedDB. */
export async function freshDatabase(): Promise<void> {
  await resetConnectionForTests();
  globalThis.indexedDB = new IDBFactory();
}
