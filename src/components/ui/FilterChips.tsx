import type { FilterDef } from '@/lib/filters';
import { countMatches } from '@/lib/filters';
import { cn } from '@/lib/cn';

interface FilterChipsProps<T> {
  filters: readonly FilterDef<T>[];
  value: string;
  onChange: (id: string) => void;
  /** When given, each chip shows how many items match. */
  items?: readonly T[];
  label: string;
}

export function FilterChips<T>({ filters, value, onChange, items, label }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      {filters.map((filter) => {
        const active = filter.id === value;
        return (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.id)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition',
              active
                ? 'border-transparent bg-ink text-bg shadow-[var(--shadow-soft)]'
                : 'border-line bg-surface text-muted hover:border-violet/40 hover:text-ink',
            )}
          >
            {filter.emoji && <span aria-hidden>{filter.emoji}</span>}
            {filter.label}
            {items && (
              <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-bg/20' : 'bg-surface-2')}>
                {countMatches(items, filter)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
