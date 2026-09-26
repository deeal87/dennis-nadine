import type { Settings } from '@/types/models';
import { getOne, putOne } from '../database';

export const DEFAULT_SETTINGS: Settings = { id: 'settings', theme: 'system' };

export const settingsRepository = {
  async get(): Promise<Settings> {
    return { ...DEFAULT_SETTINGS, ...(await getOne('settings', 'settings')) };
  },
  async update(patch: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    const next: Settings = { ...(await this.get()), ...patch, id: 'settings' };
    await putOne('settings', next);
    return next;
  },
};
