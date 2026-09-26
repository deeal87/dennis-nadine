import { useEffect, useRef } from 'react';
import { settingsRepository } from '@/data/repositories';
import { useToast } from '@/components/ui/Toast';
import { autoSync, readRemote, type RemoteSnapshot } from './sync';
import { SYNC_ENABLED } from './github';

/** Re-check GitHub at most this often when the app comes back to the foreground. */
const CHECK_INTERVAL_MS = 2 * 60_000;

/**
 * Keeps this device up to date: after start and whenever the app becomes
 * visible again, a newer saved state is loaded automatically (unless there
 * are unsaved changes here – then Settings shows the conflict).
 */
export function SyncManager({ initialRemote }: { initialRemote: RemoteSnapshot }) {
  const toast = useToast();
  const lastCheck = useRef(0);

  useEffect(() => {
    if (!SYNC_ENABLED) return;
    let cancelled = false;

    const run = async (remote?: RemoteSnapshot) => {
      lastCheck.current = Date.now();
      const settings = await settingsRepository.get();
      const snapshot = remote ?? (await readRemote(settings.githubToken));
      if (cancelled) return;
      try {
        if ((await autoSync(settings, snapshot)) === 'loaded') toast({ message: 'Neuester gemeinsamer Stand geladen ✨' });
      } catch {
        toast({ tone: 'error', message: 'Der gespeicherte Stand konnte nicht geladen werden.' });
      }
    };

    void run(initialRemote);
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > CHECK_INTERVAL_MS) void run();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [initialRemote, toast]);

  return null;
}
