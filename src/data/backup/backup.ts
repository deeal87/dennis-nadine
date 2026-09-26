/**
 * Backup format, export and validated import.
 *
 * {
 *   "app": "dennis-nadine",
 *   "version": 1,
 *   "exportedAt": "2026-09-09T12:00:00.000Z",
 *   "data": { "anime": [...], "recipes": [...], ... }
 * }
 */
import { getOne, readAllStores, replaceAllStores, STORE_NAMES, type DatabaseSnapshot, type StoreName } from '../database';
import type { Settings } from '@/types/models';
import { validateEntity } from './schema';
import { todayIso } from '@/lib/date';

export const BACKUP_APP_ID = 'dennis-nadine';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: DatabaseSnapshot;
}

export interface BackupIssue {
  store: StoreName | 'datei';
  index?: number;
  message: string;
}

export interface BackupAnalysis {
  /** False when the file cannot be imported at all. */
  valid: boolean;
  version?: number;
  exportedAt?: string;
  data: DatabaseSnapshot;
  counts: Record<StoreName, number>;
  issues: BackupIssue[];
}

function emptySnapshot(): DatabaseSnapshot {
  return Object.fromEntries(STORE_NAMES.map((name) => [name, []])) as unknown as DatabaseSnapshot;
}

function countsOf(data: DatabaseSnapshot): Record<StoreName, number> {
  return Object.fromEntries(STORE_NAMES.map((name) => [name, data[name].length])) as Record<StoreName, number>;
}

export function createBackup(data: DatabaseSnapshot, now = new Date()): BackupFile {
  return { app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

export function backupFileName(now = new Date()): string {
  return `dennis-nadine-backup-${todayIso(now)}.json`;
}

/** Password, sync key, token etc. belong to the device, not to the data – never exported or imported. */
const DEVICE_FIELDS = ['syncKey', 'syncSalt', 'syncVersion', 'syncSavedAt', 'githubToken'] as const;

function withoutAccess(settings: Settings): Settings {
  const copy = { ...settings };
  for (const field of DEVICE_FIELDS) delete copy[field];
  return copy;
}

function deviceFields(settings: Settings | undefined): Partial<Settings> {
  if (!settings) return {};
  return Object.fromEntries(DEVICE_FIELDS.filter((f) => settings[f] !== undefined).map((f) => [f, settings[f]]));
}

export async function exportBackup(): Promise<BackupFile> {
  const data = await readAllStores();
  return createBackup({ ...data, settings: data.settings.map(withoutAccess) });
}

/**
 * Parses and validates a backup. Structurally broken files are rejected completely;
 * individual invalid records are reported and skipped, never imported.
 */
export function analyzeBackup(json: string): BackupAnalysis {
  const data = emptySnapshot();
  const fail = (message: string): BackupAnalysis => ({
    valid: false,
    data,
    counts: countsOf(data),
    issues: [{ store: 'datei', message }],
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return fail('Die Datei ist kein gültiges JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fail('Unbekanntes Dateiformat.');

  const file = parsed as Partial<Record<keyof BackupFile, unknown>>;
  if (file.app !== BACKUP_APP_ID) return fail('Diese Datei ist kein Dennis ❤️ Nadine Backup.');
  if (typeof file.version !== 'number' || !Number.isInteger(file.version) || file.version < 1) {
    return fail('Die Versionsnummer des Backups fehlt oder ist ungültig.');
  }
  if (file.version > BACKUP_VERSION) {
    return fail(`Backup-Version ${file.version} ist neuer als diese App (Version ${BACKUP_VERSION}). Bitte App aktualisieren.`);
  }
  if (typeof file.data !== 'object' || file.data === null || Array.isArray(file.data)) {
    return fail('Das Backup enthält keinen Datenbereich.');
  }

  const rawData = file.data as Record<string, unknown>;
  const issues: BackupIssue[] = [];

  for (const store of STORE_NAMES) {
    const records = rawData[store];
    if (records === undefined) continue;
    if (!Array.isArray(records)) {
      issues.push({ store, message: 'ist keine Liste und wurde übersprungen' });
      continue;
    }
    const seen = new Set<string>();
    records.forEach((record, index) => {
      const result = validateEntity(store, record);
      if (!result.ok) {
        issues.push({ store, index, message: result.error });
      } else if (seen.has(result.value.id)) {
        issues.push({ store, index, message: `doppelte ID ${result.value.id}` });
      } else {
        seen.add(result.value.id);
        (data[store] as unknown[]).push(result.value);
      }
    });
  }

  return {
    valid: true,
    version: file.version,
    exportedAt: typeof file.exportedAt === 'string' ? file.exportedAt : undefined,
    data,
    counts: countsOf(data),
    issues,
  };
}

/** Replaces all local data with the validated content of an analysis. */
export async function importBackup(analysis: BackupAnalysis): Promise<void> {
  if (!analysis.valid) throw new Error('Ungültiges Backup kann nicht importiert werden.');
  const current = await getOne('settings', 'settings');
  const imported = analysis.data.settings[0];
  const access = deviceFields(current);
  const settings: Settings[] = imported || current ? [{ ...withoutAccess(imported ?? { id: 'settings', theme: 'system' }), ...access }] : [];
  await replaceAllStores({ ...analysis.data, settings });
}

/** Deletes every local record. The seed is not re-applied (settings are cleared too, so it will be on next start). */
export async function resetAllData(): Promise<void> {
  await replaceAllStores({});
}
