import { Link } from 'react-router';
import { useStore } from '@/hooks/useStore';
import { PATHS } from '@/app/paths';

interface Stat {
  emoji: string;
  label: string;
  value: number;
  suffix: string;
  to: string;
  tint: string;
}

/** Live numbers straight from the database. */
export function StatCards() {
  const anime = useStore('anime').items;
  const recipes = useStore('recipes').items;
  const dates = useStore('dates').items;
  const funkos = useStore('funkos').items;
  const lego = useStore('lego').items;
  const memories = useStore('memories').items;

  const stats: Stat[] = [
    { emoji: '🎬', label: 'Anime', value: anime.filter((a) => a.status === 'completed').length, suffix: 'geschaut', to: PATHS.anime, tint: 'from-violet-soft' },
    { emoji: '🍜', label: 'Rezepte', value: recipes.length, suffix: 'gespeichert', to: PATHS.recipes, tint: 'from-peach-soft' },
    { emoji: '❤️', label: 'Dates', value: dates.filter((d) => d.status === 'done').length, suffix: 'erlebt', to: PATHS.dates, tint: 'from-rose-soft' },
    { emoji: '🎁', label: 'Funkos', value: funkos.filter((f) => f.status === 'owned').length, suffix: 'gesammelt', to: PATHS.funkos, tint: 'from-mint-soft' },
    { emoji: '🧱', label: 'LEGO', value: lego.filter((l) => l.status === 'owned').length, suffix: 'Sets', to: PATHS.lego, tint: 'from-peach-soft' },
    { emoji: '📸', label: 'Erinnerungen', value: memories.length, suffix: 'gespeichert', to: PATHS.memories, tint: 'from-violet-soft' },
  ];

  return (
    <section aria-label="Unsere Welt in Zahlen">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link
              to={stat.to}
              className={`card group flex h-full flex-col gap-1 bg-gradient-to-br ${stat.tint} to-surface p-4 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]`}
            >
              <span className="text-2xl transition group-hover:scale-110" aria-hidden>
                {stat.emoji}
              </span>
              <span className="text-sm font-bold text-muted">{stat.label}</span>
              <span className="font-display text-3xl font-bold leading-none">{stat.value}</span>
              <span className="text-xs font-bold text-muted">{stat.suffix}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
