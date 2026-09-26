import { animeRepository, settingsRepository, timelineRepository } from '../repositories';
import { SEED_ANIME, SEED_TIMELINE } from './initialData';
import { nowIso } from '@/lib/date';

let seeding: Promise<void> | null = null;

/** Writes the initial data exactly once per database (idempotent, safe under StrictMode). */
export function ensureSeeded(): Promise<void> {
  seeding ??= (async () => {
    const settings = await settingsRepository.get();
    if (settings.seededAt) return;
    await animeRepository.createMany(SEED_ANIME);
    await timelineRepository.createMany(SEED_TIMELINE);
    await settingsRepository.update({ seededAt: nowIso() });
  })().catch((error: unknown) => {
    seeding = null;
    throw error;
  });
  return seeding;
}
