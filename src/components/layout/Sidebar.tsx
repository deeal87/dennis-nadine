import { NavLink } from 'react-router';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NAV_GROUPS, NAV_SETTINGS, type NavItem } from './navigation';
import { useSyncAttention } from '@/features/sync/useSync';

export function NavEntry({ item, onNavigate, badge }: { item: NavItem; onNavigate?: () => void; badge?: string }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex min-h-11 items-center gap-3 rounded-2xl px-3 font-bold transition',
          isActive ? 'bg-rose-soft text-rose' : 'text-muted hover:bg-surface-2 hover:text-ink',
        )
      }
    >
      <Icon className="size-5 transition group-hover:scale-110" aria-hidden />
      {item.label}
      {badge && <AttentionDot label={badge} />}
    </NavLink>
  );
}

/** Red dot for "unsaved changes" – with a screen reader label. */
export function AttentionDot({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('ml-auto inline-flex', className)}>
      <span className="size-2.5 rounded-full bg-danger ring-2 ring-surface" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export const UNSAVED_LABEL = 'Ungespeicherte Änderungen';

export function Sidebar({ onSearch }: { onSearch: () => void }) {
  const attention = useSyncAttention();
  return (
    <aside className="glass sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-4 border-y-0 border-l-0 p-4 lg:flex">
      <div className="px-2 pt-2">
        <Logo />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface px-3 text-muted transition hover:border-violet/40 hover:text-ink"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left text-sm font-semibold">Suchen …</span>
        <kbd className="rounded-md bg-surface-2 px-1.5 text-xs font-bold">Strg K</kbd>
      </button>
      <nav aria-label="Hauptnavigation" className="-mx-1 flex-1 overflow-y-auto px-1">
        {NAV_GROUPS.map((group, index) => (
          <div key={index} className="mb-3">
            {group.label && <p className="mb-1 px-3 text-xs font-extrabold uppercase tracking-wider text-muted/80">{group.label}</p>}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavEntry item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <NavEntry item={NAV_SETTINGS} badge={attention ? UNSAVED_LABEL : undefined} />
        <div className="flex justify-center">
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}
