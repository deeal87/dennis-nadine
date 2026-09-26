/**
 * Save / load the shared state via GitHub. Everything is encrypted with the
 * shared password before it leaves the device (see crypto.ts).
 */
import { analyzeBackup, exportBackup, importBackup } from '@/data/backup/backup';
import { readAllStores } from '@/data/database';
import { settingsRepository } from '@/data/repositories';
import { SEED_ANIME, SEED_TIMELINE } from '@/data/seed/initialData';
import type { Settings } from '@/types/models';
import { decryptState, deriveSyncKey, encryptState, randomHex, unlockSyncFile, type SyncFile } from './crypto';
import { fetchSyncFile, SYNC_ENABLED, SyncError, uploadSyncFile } from './github';
import { clearDirty, isDirty, setRemoteState, withoutDirtyTracking } from './state';

export interface RemoteSnapshot {
  file: SyncFile | null;
  /** False when GitHub could not be asked (offline, rate limit …). */
  reachable: boolean;
  error?: string;
}

export class SyncConflictError extends Error {
  constructor(readonly remote: SyncFile) {
    super('Auf einem anderen Gerät wurde inzwischen neuer gespeichert.');
  }
}

export async function readRemote(token?: string): Promise<RemoteSnapshot> {
  if (!SYNC_ENABLED) return { file: null, reachable: false };
  try {
    return { file: await fetchSyncFile(token), reachable: true };
  } catch (error) {
    return { file: null, reachable: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Replaces the local data with a decrypted remote state. */
export async function applyRemote(file: SyncFile, plaintext: string): Promise<void> {
  const analysis = analyzeBackup(plaintext);
  if (!analysis.valid) throw new SyncError(analysis.issues[0]?.message ?? 'Der gespeicherte Stand ist ungültig.');
  await withoutDirtyTracking(async () => {
    await importBackup(analysis);
    await settingsRepository.update({ syncVersion: file.version, syncSavedAt: file.savedAt });
  });
  clearDirty();
  setRemoteState({ kind: 'in-sync', version: file.version, savedAt: file.savedAt });
}

/** True when this device holds more than the untouched starter data. */
export async function hasOwnData(): Promise<boolean> {
  const data = await readAllStores();
  const { anime, timeline, rankings, settings: _settings, ...rest } = data;
  return (
    Object.values(rest).some((items) => items.length > 0) ||
    anime.length !== SEED_ANIME.length ||
    timeline.length !== SEED_TIMELINE.length ||
    rankings.some((r) => r.itemIds.length > 0)
  );
}

/**
 * After the password was entered: make sure this device has the sync key.
 * If a remote state exists and the password opens it, that state's key is
 * adopted; otherwise a fresh key is created for the first save.
 */
export async function adoptPassword(password: string, remote: SyncFile | null): Promise<{ opened: string | null }> {
  if (remote) {
    const opened = await unlockSyncFile(remote, password);
    if (opened) {
      await settingsRepository.update({ syncKey: opened.key, syncSalt: remote.kdf.salt });
      return { opened: opened.plaintext };
    }
  }
  const settings = await settingsRepository.get();
  if (!settings.syncKey) {
    // Nothing saved yet: a fresh salt for the first save from this device.
    const salt = randomHex();
    await settingsRepository.update({ syncKey: await deriveSyncKey(password, salt), syncSalt: salt });
  }
  return { opened: null };
}

/** Compares with GitHub and loads a newer state automatically when that is safe. */
export async function autoSync(settings: Settings, remote: RemoteSnapshot): Promise<'loaded' | 'idle'> {
  if (!remote.reachable) return setRemoteState({ kind: 'offline', message: remote.error ?? 'GitHub nicht erreichbar' }), 'idle';
  const file = remote.file;
  if (!file) return setRemoteState({ kind: 'none' }), 'idle';
  const info = { version: file.version, savedAt: file.savedAt };
  if (!settings.syncKey || settings.syncSalt !== file.kdf.salt) return setRemoteState({ kind: 'key-mismatch', ...info }), 'idle';
  if (file.version <= (settings.syncVersion ?? 0)) return setRemoteState({ kind: 'in-sync', ...info }), 'idle';
  const neverSynced = settings.syncVersion === undefined;
  if (isDirty() && !(neverSynced && !(await hasOwnData()))) return setRemoteState({ kind: 'conflict', ...info }), 'idle';
  await applyRemote(file, await decryptState(file, settings.syncKey));
  return 'loaded';
}

/** Loads the remote state now, discarding unsaved local changes. */
export async function loadRemoteNow(settings: Settings): Promise<void> {
  const remote = await fetchSyncFile(settings.githubToken);
  if (!remote) throw new SyncError('Auf GitHub ist noch nichts gespeichert.');
  if (!settings.syncKey || settings.syncSalt !== remote.kdf.salt) throw new SyncError('Dieser Stand wurde mit einem anderen Passwort gespeichert.');
  await applyRemote(remote, await decryptState(remote, settings.syncKey));
}

/** Encrypts the current state and saves it to GitHub. */
export async function saveNow(settings: Settings, force = false): Promise<SyncFile> {
  if (!settings.githubToken) throw new SyncError('Zum Speichern braucht dieses Gerät einen GitHub-Schlüssel.');
  if (!settings.syncKey || !settings.syncSalt) throw new SyncError('Bitte zuerst das Passwort eingeben.');
  const remote = await fetchSyncFile(settings.githubToken);
  if (remote && remote.version > (settings.syncVersion ?? 0) && !force) throw new SyncConflictError(remote);
  const version = Math.max(remote?.version ?? 0, settings.syncVersion ?? 0) + 1;
  const file = await encryptState(JSON.stringify(await exportBackup()), settings.syncKey, settings.syncSalt, version);
  await uploadSyncFile(file, settings.githubToken);
  await withoutDirtyTracking(() => settingsRepository.update({ syncVersion: file.version, syncSavedAt: file.savedAt }));
  clearDirty();
  setRemoteState({ kind: 'in-sync', version: file.version, savedAt: file.savedAt });
  return file;
}
