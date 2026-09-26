import { beforeEach, describe, expect, it } from 'vitest';
import { freshDatabase } from '@/test/db';
import { animeRepository, bucketRepository, rankingRepository, settingsRepository, timelineRepository } from '.';
import { ensureSeeded } from '../seed/seed';
import { subscribeToStore } from '../events';

describe('entity repository', () => {
  beforeEach(freshDatabase);

  it('creates entities with id and timestamps', async () => {
    const item = await bucketRepository.create({ title: 'Kyoto', category: 'reisen', priority: 'high', done: false });
    expect(item.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(item.createdAt).toBe(item.updatedAt);
    expect(await bucketRepository.get(item.id)).toEqual(item);
    expect(await bucketRepository.count()).toBe(1);
  });

  it('updates without touching id and createdAt', async () => {
    const item = await bucketRepository.create({ title: 'Kyoto', category: 'reisen', priority: 'high', done: false });
    const updated = await bucketRepository.update(item.id, { done: true });
    expect(updated).toMatchObject({ id: item.id, createdAt: item.createdAt, done: true, title: 'Kyoto' });
    await expect(bucketRepository.update('missing', { done: true })).rejects.toThrow();
  });

  it('removes and restores (undo)', async () => {
    const item = await animeRepository.create({ title: 'Bubble', genres: [], status: 'planned' });
    const removed = await animeRepository.remove(item.id);
    expect(removed).toEqual(item);
    expect(await animeRepository.list()).toEqual([]);
    await animeRepository.restore(item);
    expect(await animeRepository.list()).toEqual([item]);
  });

  it('creates many in one go', async () => {
    const created = await timelineRepository.createMany([
      { date: '2026-09-09', title: 'A', category: 'besonders' },
      { date: '2026-10-01', title: 'B', category: 'date' },
    ]);
    expect(new Set(created.map((c) => c.id)).size).toBe(2);
    expect(await timelineRepository.count()).toBe(2);
  });

  it('notifies store subscribers after writes', async () => {
    let calls = 0;
    const unsubscribe = subscribeToStore('anime', () => calls++);
    await animeRepository.create({ title: 'X', genres: [], status: 'planned' });
    unsubscribe();
    await animeRepository.create({ title: 'Y', genres: [], status: 'planned' });
    expect(calls).toBe(1);
  });
});

describe('ranking repository', () => {
  beforeEach(freshDatabase);

  it('returns an empty ranking by default', async () => {
    expect((await rankingRepository.get('anime-top3')).itemIds).toEqual([]);
  });

  it('persists order, removes duplicates and enforces the limit', async () => {
    await rankingRepository.set('anime-top3', ['a', 'b', 'a', 'c', 'd']);
    expect((await rankingRepository.get('anime-top3')).itemIds).toEqual(['a', 'b', 'c']);
    await rankingRepository.set('lego-wishlist', Array.from({ length: 12 }, (_, i) => `l${i}`));
    expect((await rankingRepository.get('lego-wishlist')).itemIds).toHaveLength(10);
  });
});

describe('settings & seed', () => {
  beforeEach(freshDatabase);

  it('defaults to the system theme', async () => {
    expect(await settingsRepository.get()).toEqual({ id: 'settings', theme: 'system' });
  });

  it('seeds the anime interests and our day exactly once', async () => {
    await Promise.all([ensureSeeded(), ensureSeeded()]);
    await ensureSeeded();
    const anime = await animeRepository.list();
    expect(anime.map((a) => a.title).sort()).toEqual(
      ['Bubble', 'Chihiros Reise ins Zauberland', 'Die Apothekerin', 'Dragon Ball', 'One Piece', 'Prinzessin Mononoke'].sort(),
    );
    expect(anime.every((a) => a.status === 'planned')).toBe(true);
    const timeline = await timelineRepository.list();
    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.date).toBe('2026-09-09');
    expect((await settingsRepository.get()).seededAt).toBeDefined();
  });
});
