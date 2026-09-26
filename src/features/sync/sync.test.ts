import { beforeEach, describe, expect, it } from 'vitest';
import { freshDatabase } from '@/test/db';
import { animeRepository, memoryRepository, settingsRepository } from '@/data/repositories';
import { exportBackup } from '@/data/backup/backup';
import { ensureSeeded } from '@/data/seed/seed';
import { decryptState, deriveSyncKey, encryptState, isSyncFile, unlockSyncFile } from './crypto';
import { adoptPassword, applyRemote, autoSync, hasOwnData } from './sync';
import { clearDirty, getSyncSnapshot, isDirty, markDirty, withoutDirtyTracking } from './state';

const FAST = 1000; // PBKDF2 rounds in tests

describe('sync encryption', () => {
  it('round-trips and only opens with the right password', async () => {
    const key = await deriveSyncKey('Sakura', 'salt', FAST);
    const file = await encryptState('{"hallo":"Baby & Babe 💞"}', key, 'salt', 3, FAST);
    expect(isSyncFile(file)).toBe(true);
    expect(file.version).toBe(3);
    expect(file.data).not.toContain('Babe');
    expect(await decryptState(file, key)).toBe('{"hallo":"Baby & Babe 💞"}');
    expect(await unlockSyncFile(file, 'Sakura')).not.toBeNull();
    expect(await unlockSyncFile(file, 'sakura')).toBeNull();
  });

  it('rejects tampered data', async () => {
    const key = await deriveSyncKey('Sakura', 'salt', FAST);
    const file = await encryptState('secret', key, 'salt', 1, FAST);
    const tampered = { ...file, data: file.data.slice(0, -4) + 'AAAA' };
    await expect(decryptState(tampered, key)).rejects.toThrow();
  });
});

describe('unsaved-changes tracking', () => {
  beforeEach(async () => {
    await freshDatabase();
    clearDirty();
  });

  it('flags data changes but not settings or loading', async () => {
    await settingsRepository.update({ theme: 'dark' });
    expect(isDirty()).toBe(false);
    await withoutDirtyTracking(() => animeRepository.create({ title: 'X', genres: [], status: 'planned' }));
    expect(isDirty()).toBe(false);
    await animeRepository.create({ title: 'Y', genres: [], status: 'planned' });
    expect(getSyncSnapshot().dirty).toBe(true);
  });
});

describe('automatic loading', () => {
  beforeEach(async () => {
    await freshDatabase();
    clearDirty();
  });

  async function remoteWith(build: () => Promise<void>, version: number, password = 'Sakura') {
    await build();
    const plaintext = JSON.stringify(await exportBackup());
    const key = await deriveSyncKey(password, 'remote-salt', FAST);
    return { file: await encryptState(plaintext, key, 'remote-salt', version, FAST), key };
  }

  it('loads a newer remote state on a fresh device and adopts its key', async () => {
    const { file } = await remoteWith(() => memoryRepository.create({ title: 'Erstes Date', category: 'date' }).then(() => undefined), 4);
    await freshDatabase();
    await ensureSeeded();
    markDirty();
    expect(await hasOwnData()).toBe(false);

    const { opened } = await adoptPassword('Sakura', { ...file, kdf: { ...file.kdf, iterations: FAST } });
    expect(opened).not.toBeNull();
    const settings = await settingsRepository.get();
    expect(settings.syncSalt).toBe('remote-salt');

    expect(await autoSync(settings, { file, reachable: true })).toBe('loaded');
    expect((await memoryRepository.list()).map((m) => m.title)).toEqual(['Erstes Date']);
    expect((await settingsRepository.get()).syncVersion).toBe(4);
    expect(isDirty()).toBe(false);
  });

  it('never overwrites unsaved local changes', async () => {
    const { file, key } = await remoteWith(async () => undefined, 2);
    await freshDatabase();
    await settingsRepository.update({ syncKey: key, syncSalt: 'remote-salt', syncVersion: 1 });
    await memoryRepository.create({ title: 'Nur hier', category: 'alltag' });
    expect(isDirty()).toBe(true);
    expect(await autoSync(await settingsRepository.get(), { file, reachable: true })).toBe('idle');
    expect(getSyncSnapshot().remote.kind).toBe('conflict');
    expect((await memoryRepository.list()).map((m) => m.title)).toEqual(['Nur hier']);
  });

  it('reports a password change made on another device', async () => {
    const { file } = await remoteWith(async () => undefined, 5);
    await settingsRepository.update({ syncKey: await deriveSyncKey('Alt', 'old-salt', FAST), syncSalt: 'old-salt', syncVersion: 4 });
    await autoSync(await settingsRepository.get(), { file, reachable: true });
    expect(getSyncSnapshot().remote.kind).toBe('key-mismatch');
  });

  it('stays quiet when up to date, offline or nothing is saved', async () => {
    const { file, key } = await remoteWith(async () => undefined, 3);
    await settingsRepository.update({ syncKey: key, syncSalt: 'remote-salt', syncVersion: 3 });
    const settings = await settingsRepository.get();
    await autoSync(settings, { file, reachable: true });
    expect(getSyncSnapshot().remote.kind).toBe('in-sync');
    await autoSync(settings, { file: null, reachable: false, error: 'offline' });
    expect(getSyncSnapshot().remote.kind).toBe('offline');
    await autoSync(settings, { file: null, reachable: true });
    expect(getSyncSnapshot().remote.kind).toBe('none');
  });

  it('applyRemote keeps this device’s password and key', async () => {
    const { file, key } = await remoteWith(async () => undefined, 7);
    await settingsRepository.update({ accessHash: 'a'.repeat(64), accessSalt: 'b'.repeat(32), syncKey: key, syncSalt: 'remote-salt' });
    await applyRemote(file, await decryptState(file, key));
    expect(await settingsRepository.get()).toMatchObject({ accessHash: 'a'.repeat(64), syncSalt: 'remote-salt', syncVersion: 7 });
  });
});
