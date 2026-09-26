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
import { hasAccess } from '@/features/lock/access';
import { settingsRepository } from '@/data/repositories';
import type { Settings } from '@/types/models';

/** Router basename follows Vite's base (e.g. "/Steam-game1/" on GitHub Pages). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

type Boot =
  | { state: 'loading' }
  | { state: 'locked'; mode: 'setup' | 'unlock'; settings: Settings }
  | { state: 'ready' }
  | { state: 'failed'; message: string };

export function App() {
  const [boot, setBoot] = useState<Boot>({ state: 'loading' });
  useApplyTheme();

  useEffect(() => {
    ensureSeeded()
      .then(() => settingsRepository.get())
      .then(
        (settings) => {
          if (hasAccess(settings)) setBoot({ state: 'ready' });
          else setBoot({ state: 'locked', mode: settings.accessHash ? 'unlock' : 'setup', settings });
        },
        (error: unknown) => setBoot({ state: 'failed', message: error instanceof Error ? error.message : String(error) }),
      );
  }, []);

  if (boot.state === 'locked') return <LockScreen mode={boot.mode} settings={boot.settings} onUnlock={() => setBoot({ state: 'ready' })} />;
  if (boot.state !== 'ready') return <StartupScreen error={boot.state === 'failed' ? boot.message : undefined} />;

  return (
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <ConfirmProvider>
          <EasterEggProvider>
            <AppRoutes />
          </EasterEggProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
