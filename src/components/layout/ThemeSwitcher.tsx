import { Monitor, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '@/types/models';
import { settingsRepository } from '@/data/repositories';
import { useSettings } from '@/hooks/useStore';
import { cn } from '@/lib/cn';

const OPTIONS = [
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const satisfies ReadonlyArray<{ value: ThemePreference; label: string; icon: unknown }>;

export function ThemeSwitcher({ showLabels = false }: { showLabels?: boolean }) {
  const { theme } = useSettings();
  return (
    <div role="radiogroup" aria-label="Farbschema" className="inline-flex rounded-full border border-line bg-surface-2 p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => void settingsRepository.update({ theme: value })}
          className={cn(
            'inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-bold transition',
            theme === value ? 'bg-surface text-rose shadow-[var(--shadow-soft)]' : 'text-muted hover:text-ink',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {showLabels && label}
        </button>
      ))}
    </div>
  );
}
