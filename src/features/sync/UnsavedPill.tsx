import { Link, useLocation } from 'react-router';
import { CloudUpload } from 'lucide-react';
import { PATHS } from '@/app/paths';
import { useSync, useSyncAttention } from './useSync';

export const SYNC_ANCHOR = 'speichern';

/**
 * Floating reminder on every page while there is something to save (or a
 * conflict to resolve). Leads straight to the save section in the settings.
 */
export function UnsavedPill() {
  const attention = useSyncAttention();
  const { remote } = useSync();
  const { pathname } = useLocation();
  if (!attention || pathname === PATHS.settings) return null;

  const label = remote.kind === 'conflict' ? 'Neuerer Stand auf anderem Gerät' : remote.kind === 'key-mismatch' ? 'Gespeicherten Stand öffnen' : 'Ungespeicherte Änderungen';
  return (
    <Link
      to={`${PATHS.settings}#${SYNC_ANCHOR}`}
      className="glass fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full py-2 pl-3 pr-4 text-sm font-bold shadow-[var(--shadow-lift)] animate-pop hover:-translate-y-0.5 lg:bottom-6 lg:right-6"
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60 motion-reduce:hidden" aria-hidden />
        <span className="relative inline-flex size-2.5 rounded-full bg-danger" aria-hidden />
      </span>
      {label}
      <span className="inline-flex items-center gap-1 text-rose">
        <CloudUpload className="size-4" aria-hidden /> Speichern
      </span>
    </Link>
  );
}
