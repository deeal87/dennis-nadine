import { COUPLE } from '@/data/seed/initialData';
import { FloatingParticles } from '@/components/animations/FloatingParticles';
import { HeartShape, Sparkle } from '@/components/animations/Decor';
import { burstFromElement } from '@/components/animations/burst';
import { daysBetween, formatDate, todayIso } from '@/lib/date';

function storyLine(today: string): string {
  const days = daysBetween(COUPLE.specialDate, today);
  if (days > 0) return `Tag ${days + 1} unserer Geschichte`;
  if (days === 0) return 'Heute beginnt unsere Geschichte 💞';
  return `Noch ${-days} ${days === -1 ? 'Tag' : 'Tage'} bis zu unserem Tag`;
}

/** Soft rolling hills – our own Ghibli-esque landscape. */
function Landscape() {
  return (
    <svg className="absolute inset-x-0 bottom-0 h-28 w-full sm:h-36" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
      <path d="M0 90C150 40 300 40 450 80s300 60 450 10 250-40 300-20v100H0Z" className="fill-violet/15" />
      <path d="M0 120c200-50 350-30 520 0s380 30 680-30v70H0Z" className="fill-rose/15" />
      <path d="M0 140c250-30 500-10 700 5s380 5 500-15v30H0Z" className="fill-surface/70" />
    </svg>
  );
}

export function Hero() {
  const today = todayIso();
  return (
    <section className="card relative isolate overflow-hidden px-6 pb-24 pt-12 text-center sm:pb-32 sm:pt-16" aria-labelledby="hero-title">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-violet-soft via-rose-soft/60 to-peach-soft/60 dark:from-[#1b1a4d] dark:via-[#241d55] dark:to-[#2b2050]" />
      <div className="pattern-waves absolute inset-0 -z-10 opacity-60" />
      {/* Sun by day, moon at night */}
      <div className="absolute right-6 top-6 -z-10 size-20 rounded-full bg-gradient-to-br from-gold to-peach opacity-70 blur-[1px] sm:right-12 sm:top-10 sm:size-28 dark:from-[#fff4d6] dark:to-[#ffd479] dark:opacity-90 dark:shadow-[0_0_60px_rgb(255_212_121/.45)]" />
      <FloatingParticles />
      <Landscape />

      <Sparkle className="mx-auto size-7 animate-twinkle text-gold" />
      <h1 id="hero-title" className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-7xl">
        <span className="text-gradient">Dennis</span>{' '}
        <button
          type="button"
          aria-label="Herz – klick mich"
          onClick={(e) => burstFromElement(e.currentTarget, ['💖', '💕', '✨', '💗', '🌸'], 18)}
          className="inline-grid size-14 place-items-center align-middle transition hover:scale-110 active:scale-90 sm:size-20"
        >
          <HeartShape className="size-12 animate-heartbeat text-rose drop-shadow-[0_6px_16px_rgb(210_63_111/.35)] sm:size-16" />
        </button>{' '}
        <span className="text-gradient">Nadine</span>
      </h1>
      <p className="mt-3 font-display text-2xl font-semibold text-ink/90 sm:text-3xl">
        {COUPLE.dennis.nickname} & {COUPLE.nadine.nickname}
      </p>
      <p className="mt-1 text-lg text-muted">Unsere kleine Anime-Welt</p>
      <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2">
        <time dateTime={COUPLE.specialDate} className="glass rounded-full px-4 py-1.5 font-display text-lg font-semibold">
          💞 {formatDate(COUPLE.specialDate)}
        </time>
        <span className="glass rounded-full px-4 py-1.5 text-sm font-bold text-muted">{storyLine(today)}</span>
      </div>
    </section>
  );
}
