import { useState } from 'react';
import { NavLink } from 'react-router';
import { Ellipsis, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { MOBILE_MORE, MOBILE_PRIMARY, NAV_SETTINGS } from './navigation';
import { AttentionDot, UNSAVED_LABEL } from './Sidebar';
import { useSyncAttention } from '@/features/sync/useSync';

export function MobileTopBar({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between gap-2 border-x-0 border-t-0 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] lg:hidden">
      <Logo />
      <IconButton icon={Search} label="Suchen" onClick={onSearch} />
    </header>
  );
}

const tabClass = (active: boolean) =>
  cn(
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.7rem] font-extrabold transition',
    active ? 'text-rose' : 'text-muted',
  );

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const attention = useSyncAttention();
  return (
    <>
      <nav
        aria-label="Hauptnavigation"
        className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {MOBILE_PRIMARY.map((item) => (
            <li key={item.to} className="flex flex-1">
              <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => tabClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-7 w-12 place-items-center rounded-full transition', isActive && 'bg-rose-soft')}>
                      <item.icon className="size-5" aria-hidden />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li className="flex flex-1">
            <button type="button" className={tabClass(moreOpen)} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
              <span className="relative grid h-7 w-12 place-items-center rounded-full">
                <Ellipsis className="size-5" aria-hidden />
                {attention && <AttentionDot label={UNSAVED_LABEL} className="absolute right-2 top-0" />}
              </span>
              Mehr
            </button>
          </li>
        </ul>
      </nav>
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mehr aus unserer Welt">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOBILE_MORE.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-20 flex-col items-center justify-center gap-1 rounded-3xl border p-3 text-center font-bold transition',
                    isActive ? 'border-rose bg-rose-soft text-rose' : 'border-line bg-surface-2 hover:border-violet/40',
                  )
                }
              >
                <span className="relative text-2xl" aria-hidden>
                  {item.emoji}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {item.label}
                  {attention && item.to === NAV_SETTINGS.to && <AttentionDot label={UNSAVED_LABEL} className="ml-0" />}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-3xl bg-surface-2 p-3">
          <span className="text-sm font-bold">Farbschema</span>
          <ThemeSwitcher />
        </div>
      </Modal>
    </>
  );
}
