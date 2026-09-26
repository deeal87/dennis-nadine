import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router';
import { ensureSeeded } from '@/data/seed/seed';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { EasterEggProvider } from '@/components/animations/EasterEggs';
import { useApplyTheme } from '@/hooks/useTheme';
import { AppRoutes } from './routes';
import { StartupScreen } from './StartupScreen';

/** Router basename follows Vite's base (e.g. "/Steam-game1/" on GitHub Pages). */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

type Boot = { state: 'loading' } | { state: 'ready' } | { state: 'failed'; message: string };

export function App() {
  const [boot, setBoot] = useState<Boot>({ state: 'loading' });
  useApplyTheme();

  useEffect(() => {
    ensureSeeded().then(
      () => setBoot({ state: 'ready' }),
      (error: unknown) => setBoot({ state: 'failed', message: error instanceof Error ? error.message : String(error) }),
    );
  }, []);

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
