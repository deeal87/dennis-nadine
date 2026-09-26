import { createRepository } from './createRepository';

export const animeRepository = createRepository('anime');
export const recipeRepository = createRepository('recipes');
export const dateRepository = createRepository('dates');
export const funkoRepository = createRepository('funkos');
export const legoRepository = createRepository('lego');
export const seriesRepository = createRepository('series');
export const memoryRepository = createRepository('memories');
export const timelineRepository = createRepository('timeline');
export const bucketRepository = createRepository('bucket');

export { rankingRepository } from './rankingRepository';
export { settingsRepository, DEFAULT_SETTINGS } from './settingsRepository';
export type { Draft, Repository, EntityStoreName } from './createRepository';
