import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router';
import { ensureSeeded } from '@/data/seed/seed';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { EasterEggProvider } from '@/components/animations/EasterEggs';
import { useApplyTheme } from '@/hooks/useTheme';
import { AppRoutes } from './routes';
import { StartupScreen } from './StartupScreen';
import { LockScreen, type LockMode } from '@/features/lock/LockScreen';
import { SyncManager } from '@/features/sync/SyncManager';
import { adoptPassword, readRemote, type RemoteSnapshot } from '@/features/sync/sync';
import { hasAccess } from '@/features/lock/access';
import { settingsRepository } from '@/data/repositories';
import type { Settings } from '@/types/models';

/** Router basename follows Vite's base (e.g. "/Steam-game1/" on GitHub Pages). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

type Boot =
  | { state: 'loading' }
  | { state: 'locked'; mode: LockMode; settings: Settings; remote: RemoteSnapshot }
  | { state: 'ready'; remote: RemoteSnapshot }
  | { state: 'failed'; message: string };

/**
 * Boot: open the database, look for a saved state on GitHub, then decide:
 * - known device with valid session → app
 * - a saved state exists → password opens it (also on brand-new devices)
 * - otherwise → local password (set it on first visit)
 */
async function boot(): Promise<Boot> {
  await ensureSeeded();
  const settings = await settingsRepository.get();
  const remote = await readRemote(settings.githubToken);
  const passwordChanged = !!remote.file && !!settings.syncSalt && settings.syncSalt !== remote.file.kdf.salt;
  if (hasAccess(settings) && !passwordChanged) return { state: 'ready', remote };
  const mode: LockMode = remote.file ? (passwordChanged ? 'changed' : 'remote') : settings.accessHash ? 'unlock' : 'setup';
  return { state: 'locked', mode, settings, remote };
}

export function App() {
  const [state, setState] = useState<Boot>({ state: 'loading' });
  useApplyTheme();

  useEffect(() => {
    boot().then(setState, (error: unknown) => setState({ state: 'failed', message: error instanceof Error ? error.message : String(error) }));
  }, []);

  if (state.state === 'locked') {
    return (
      <LockScreen
        mode={state.mode}
        settings={state.settings}
        remote={state.remote.file}
        onUnlock={async (password) => {
          await adoptPassword(password, state.remote.file);
          setState({ state: 'ready', remote: state.remote });
        }}
      />
    );
  }
  if (state.state !== 'ready') return <StartupScreen error={state.state === 'failed' ? state.message : undefined} />;

  return (
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <ConfirmProvider>
          <EasterEggProvider>
            <SyncManager initialRemote={state.remote} />
            <AppRoutes />
          </EasterEggProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
