import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router';
import { ensureSeeded } from '@/data/seed/seed';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { EasterEggProvider } from '@/components/animations/EasterEggs';
import { useApplyTheme } from '@/hooks/useTheme';
import { AppRoutes } from './routes';
import { StartupScreen } from './StartupScreen';
import { LockScreen } from '@/features/lock/LockScreen';
import { SyncManager } from '@/features/sync/SyncManager';
import { adoptPassword, readRemote, type RemoteSnapshot } from '@/features/sync/sync';
import { hasAccess } from '@/features/lock/access';
import { settingsRepository } from '@/data/repositories';

/** Router basename follows Vite's base (e.g. "/Steam-game1/" on GitHub Pages). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

type Boot =
  | { state: 'loading' }
  | { state: 'locked'; notice?: string; remote: RemoteSnapshot }
  | { state: 'ready'; remote: RemoteSnapshot }
  | { state: 'failed'; message: string };

/**
 * Boot: open the database and look for a saved state on GitHub. Without a
 * valid session the password is asked – also when the saved state was
 * encrypted with a key this device doesn't have yet (it's derived from the
 * password, so entering it once is enough).
 */
async function boot(): Promise<Boot> {
  await ensureSeeded();
  const settings = await settingsRepository.get();
  const remote = await readRemote(settings.githubToken);
  const needsKey = !!remote.file && settings.syncSalt !== remote.file.kdf.salt;
  if (hasAccess() && !needsKey) return { state: 'ready', remote };
  return { state: 'locked', remote, notice: hasAccess() ? 'Einmal kurz das Passwort, um euren gespeicherten Stand zu öffnen.' : undefined };
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
        notice={state.notice}
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
