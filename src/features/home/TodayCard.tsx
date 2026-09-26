import { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '@/hooks/useStore';
import { buttonClasses } from '@/components/ui/Button';
import { PATHS } from '@/app/paths';
import { cn } from '@/lib/cn';
import { DateRoulette } from '../roulette/DateRoulette';
import { RouletteDialog } from '../roulette/RouletteDialog';
import { pickAnime, pickRecipe, pickSurprise } from '../roulette/pickers';

type Picker = 'dates' | 'anime' | 'recipe' | 'surprise' | null;

const OPTIONS = [
  { id: 'dates', emoji: '🎲', label: 'Date-Roulette' },
  { id: 'anime', emoji: '🎬', label: 'Anime auswählen' },
  { id: 'recipe', emoji: '🍜', label: 'Rezept auswählen' },
] as const;

export function TodayCard() {
  const [open, setOpen] = useState<Picker>(null);
  const anime = useStore('anime').items;
  const recipes = useStore('recipes').items;
  const dates = useStore('dates').items;
  const bucket = useStore('bucket').items;
  const close = () => setOpen(null);

  return (
    <section className="card relative overflow-hidden p-5 sm:p-8" aria-labelledby="today-title">
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-rose-soft blur-2xl" aria-hidden />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h2 id="today-title" className="text-2xl font-semibold sm:text-3xl">
            Was machen wir heute?
          </h2>
          <p className="mt-1 text-muted">Lasst den Zufall entscheiden – aus allem, was ihr gespeichert habt.</p>
          <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setOpen(option.id)}
                className="flex min-h-14 items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3 text-left font-bold transition hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-[var(--shadow-soft)] min-[420px]:flex-col min-[420px]:justify-center min-[420px]:py-3 min-[420px]:text-center"
              >
                <span className="text-2xl" aria-hidden>
                  {option.emoji}
                </span>
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen('surprise')}
          className={cn(
            'group relative grid min-h-36 place-items-center rounded-[2rem] bg-gradient-to-br from-rose via-violet to-peach p-1 shadow-[var(--shadow-lift)] transition hover:scale-[1.02] active:scale-[0.98] lg:w-72',
          )}
        >
          <span className="grid size-full place-items-center rounded-[1.8rem] bg-surface/85 px-6 py-5 text-center backdrop-blur">
            <span>
              <span className="block text-4xl transition group-hover:scale-110" aria-hidden>
                ❤️
              </span>
              <span className="mt-2 block font-display text-2xl font-semibold">Überrasche uns ❤️</span>
              <span className="text-xs font-bold text-muted">Anime, Rezept, Date oder Traum</span>
            </span>
          </span>
        </button>
      </div>

      <DateRoulette open={open === 'dates'} onClose={close} places={dates} />
      <RouletteDialog
        open={open === 'anime'}
        onClose={close}
        title="Anime auswählen"
        headline="🍿 Heute schauen wir 🍿"
        spinLabel="Anime auslosen"
        spin={(prev) => pickAnime(anime, prev)}
        emptyText="Kein offener Anime da – alles geschaut? Tragt neue ein!"
        emptyAction={
          <Link to={PATHS.anime} onClick={close} className={buttonClasses('secondary')}>
            Zu den Anime
          </Link>
        }
      />
      <RouletteDialog
        open={open === 'recipe'}
        onClose={close}
        title="Rezept auswählen"
        headline="🍜 Heute kochen wir 🍜"
        spinLabel="Rezept auslosen"
        spin={(prev) => pickRecipe(recipes, prev)}
        emptyText="Noch keine Rezepte gespeichert."
        emptyAction={
          <Link to={PATHS.recipes} onClick={close} className={buttonClasses('secondary')}>
            Rezept hinzufügen
          </Link>
        }
      />
      <RouletteDialog
        open={open === 'surprise'}
        onClose={close}
        title="Überraschung"
        headline="✨ Das Schicksal hat entschieden ✨"
        spin={(prev) => pickSurprise({ anime, recipes, dates, bucket }, prev)}
        emptyText="Noch nichts zum Überraschen da – füllt eure Welt mit Anime, Rezepten, Dates oder Träumen."
      />
    </section>
  );
}
