import { beforeEach, describe, expect, it } from 'vitest';
import { freshDatabase } from '@/test/db';
import { animeRepository, rankingRepository, settingsRepository } from '../repositories';
import { readAllStores } from '../database';
import { analyzeBackup, BACKUP_VERSION, backupFileName, createBackup, exportBackup, importBackup, resetAllData } from './backup';
import { validateEntity } from './schema';

const now = '2026-09-09T10:00:00.000Z';
const anime = { id: 'a1', title: 'Dragon Ball', genres: ['Action'], status: 'planned', createdAt: now, updatedAt: now };

const file = (data: unknown, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ app: 'dennis-nadine', version: BACKUP_VERSION, exportedAt: now, data, ...extra });

describe('entity validation', () => {
  it('accepts a valid anime and drops unknown fields', () => {
    const result = validateEntity('anime', { ...anime, evil: '<script>' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).not.toHaveProperty('evil');
  });

  it.each([
    ['missing title', { ...anime, title: undefined }],
    ['wrong status', { ...anime, status: 'binge' }],
    ['rating out of range', { ...anime, sharedRating: 7 }],
    ['genres not a list', { ...anime, genres: 'Action' }],
    ['invalid date', { ...anime, watchedAt: '2026-13-45' }],
    ['not an object', 'Dragon Ball'],
  ])('rejects %s', (_, raw) => {
    expect(validateEntity('anime', raw).ok).toBe(false);
  });

  it('validates nested catalog items', () => {
    const catalog = { id: 's', domain: 'funko', name: 'DB', items: [{ id: 'i', name: 'Goku', number: '1' }], createdAt: now, updatedAt: now };
    expect(validateEntity('series', catalog).ok).toBe(true);
    expect(validateEntity('series', { ...catalog, items: [{ id: 'i' }] }).ok).toBe(false);
  });
});

describe('backup analysis', () => {
  it('names the file by date', () => {
    expect(backupFileName(new Date('2026-09-09T12:00:00'))).toBe('dennis-nadine-backup-2026-09-09.json');
  });

  it.each([
    ['broken JSON', '{nope'],
    ['a foreign file', JSON.stringify({ app: 'other', version: 1, data: {} })],
    ['a missing version', JSON.stringify({ app: 'dennis-nadine', data: {} })],
    ['a newer version', file({}, { version: BACKUP_VERSION + 1 })],
    ['a missing data section', JSON.stringify({ app: 'dennis-nadine', version: 1 })],
    ['an array', '[]'],
  ])('rejects %s', (_, json) => {
    const analysis = analyzeBackup(json);
    expect(analysis.valid).toBe(false);
    expect(analysis.issues[0]?.store).toBe('datei');
  });

  it('keeps valid records and reports invalid ones', () => {
    const analysis = analyzeBackup(file({ anime: [anime, { ...anime, id: 'a2', status: '??' }, anime], recipes: 'oops' }));
    expect(analysis.valid).toBe(true);
    expect(analysis.counts.anime).toBe(1);
    expect(analysis.issues.map((i) => i.store)).toEqual(['anime', 'anime', 'recipes']);
    expect(analysis.issues[1]?.message).toMatch(/doppelte ID/);
  });

  it('round-trips a created backup', () => {
    const backup = createBackup({ ...analyzeBackup(file({})).data, anime: [anime as never] });
    const analysis = analyzeBackup(JSON.stringify(backup));
    expect(analysis.valid).toBe(true);
    expect(analysis.issues).toEqual([]);
    expect(analysis.data.anime).toEqual([anime]);
  });
});

describe('export / import / reset with IndexedDB', () => {
  beforeEach(freshDatabase);

  it('exports everything and restores it into an empty database', async () => {
    const created = await animeRepository.create({ title: 'One Piece', genres: [], status: 'watching' });
    await rankingRepository.set('anime-top3', [created.id]);
    await settingsRepository.update({ theme: 'dark' });

    const json = JSON.stringify(await exportBackup());
    await resetAllData();
    expect((await readAllStores()).anime).toEqual([]);

    const analysis = analyzeBackup(json);
    expect(analysis.issues).toEqual([]);
    await importBackup(analysis);

    const restored = await readAllStores();
    expect(restored.anime).toEqual([created]);
    expect(restored.rankings[0]?.itemIds).toEqual([created.id]);
    expect((await settingsRepository.get()).theme).toBe('dark');
  });

  it('replaces existing data on import', async () => {
    await animeRepository.create({ title: 'Wird ersetzt', genres: [], status: 'planned' });
    await importBackup(analyzeBackup(file({ anime: [anime] })));
    expect((await animeRepository.list()).map((a) => a.title)).toEqual(['Dragon Ball']);
  });

  it('refuses to import an invalid analysis', async () => {
    await expect(importBackup(analyzeBackup('{'))).rejects.toThrow();
  });
});
