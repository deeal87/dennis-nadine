import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { SearchDialog } from '@/features/search/SearchDialog';
import { SkyBackground } from '../animations/SkyBackground';
import { ErrorBoundary } from './ErrorBoundary';
import { BottomNav, MobileTopBar } from './MobileNav';
import { PageSkeleton } from './PageSkeleton';
import { Sidebar } from './Sidebar';
import { UnsavedPill } from '@/features/sync/UnsavedPill';
import { useUpdateCheck } from '@/hooks/useUpdateCheck';

export function AppShell() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  useUpdateCheck();

  // Ctrl/Cmd + K opens the global search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0 });
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="fixed left-4 top-4 z-[80] -translate-y-24 rounded-full bg-ink px-4 py-2 font-bold text-bg transition focus:translate-y-0"
      >
        Zum Inhalt springen
      </a>
      <SkyBackground />
      <Sidebar onSearch={() => setSearchOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar onSearch={() => setSearchOpen(true)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6 outline-none sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <div key={location.pathname} className="animate-fade-up">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <UnsavedPill />
      <BottomNav />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
