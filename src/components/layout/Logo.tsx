import { useRef, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/app/paths';
import { useEasterEgg } from '../animations/EasterEggs';
import { burstAt } from '../animations/burst';

const CLICKS_FOR_SURPRISE = 5;
const CLICK_WINDOW_MS = 2000;

/** Brand mark. Easter egg: five quick clicks start a sakura rain. */
export function Logo({ compact = false }: { compact?: boolean }) {
  const trigger = useEasterEgg();
  const clicks = useRef<number[]>([]);

  const onClick = (event: MouseEvent) => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < CLICK_WINDOW_MS), now];
    if (clicks.current.length >= CLICKS_FOR_SURPRISE) {
      clicks.current = [];
      trigger('sakura');
    } else if (clicks.current.length >= 3) {
      burstAt(event.clientX, event.clientY, ['💗', '✨'], 6);
    }
  };

  return (
    <Link to={PATHS.home} onClick={onClick} className="group inline-flex min-h-11 items-center gap-2 rounded-2xl" aria-label="Dennis ❤️ Nadine – zur Startseite">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-rose to-violet text-lg text-white shadow-[var(--shadow-soft)] transition group-hover:rotate-6">
        <span className="animate-heartbeat" aria-hidden>
          ❤️
        </span>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-lg font-semibold">Dennis ❤️ Nadine</span>
          <span className="block text-xs font-bold text-muted">Baby & Babe</span>
        </span>
      )}
    </Link>
  );
}
