import { useDeferredValue, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { buildSearchIndex, searchEntries } from './searchIndex';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Suche" description="Anime, Rezepte, Dates, Sammlungen, Memories …" size="lg">
      <SearchPanel onClose={onClose} />
    </Modal>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const anime = useStore('anime').items;
  const recipes = useStore('recipes').items;
  const dates = useStore('dates').items;
  const funkos = useStore('funkos').items;
  const lego = useStore('lego').items;
  const memories = useStore('memories').items;
  const timeline = useStore('timeline').items;
  const bucket = useStore('bucket').items;

  const index = useMemo(
    () => buildSearchIndex({ anime, recipes, dates, funkos, lego, memories, timeline, bucket }),
    [anime, recipes, dates, funkos, lego, memories, timeline, bucket],
  );
  const results = useMemo(() => searchEntries(index, deferredQuery), [index, deferredQuery]);

  const go = (href: string) => {
    onClose();
    navigate(href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + delta + results.length) % results.length);
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          autoFocus
          type="search"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `search-${results[active].key}` : undefined}
          aria-label="Suchbegriff"
          placeholder="Wonach sucht ihr?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="min-h-13 w-full rounded-2xl border border-line bg-surface-2 pl-12 pr-4 text-lg focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/15"
        />
      </div>

      {deferredQuery.trim() && results.length === 0 && (
        <p className="py-8 text-center text-muted">
          <span className="mb-2 block text-3xl" aria-hidden>
            🔍
          </span>
          Nichts gefunden für „{deferredQuery}“.
        </p>
      )}
      {!deferredQuery.trim() && (
        <p className="py-6 text-center text-sm text-muted">
          Tipp: <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-sans font-bold">Strg</kbd> +{' '}
          <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-sans font-bold">K</kbd> öffnet die Suche überall.
        </p>
      )}

      <ul id="search-results" role="listbox" aria-label="Suchergebnisse" className="flex flex-col gap-1">
        {results.map((result, index) => (
          <li
            key={result.key}
            id={`search-${result.key}`}
            role="option"
            aria-selected={index === active}
            onMouseEnter={() => setActive(index)}
            onClick={() => go(result.href)}
            className={cn(
              'flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition',
              index === active ? 'bg-rose-soft' : 'hover:bg-surface-2',
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-xl shadow-[var(--shadow-soft)]" aria-hidden>
              {result.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{result.title}</span>
              <span className="block truncate text-sm text-muted">{result.subtitle}</span>
            </span>
            <span className="hidden shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted sm:block">{result.group}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
