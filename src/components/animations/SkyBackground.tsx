import { memo } from 'react';
import { Cloud, Sparkle } from './Decor';

const STARS = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37.7) % 100,
  top: (i * 23.3) % 70,
  size: 4 + ((i * 7) % 9),
  delay: (i * 0.37) % 3.2,
}));

/**
 * Fixed, subtle backdrop: drifting clouds by day, twinkling stars at night.
 */
export const SkyBackground = memo(function SkyBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="hidden dark:block">
        {STARS.map((star, i) => (
          <Sparkle
            key={i}
            className="absolute animate-twinkle text-gold/70"
            style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, animationDelay: `${star.delay}s` }}
          />
        ))}
      </div>
      <div className="motion-decor dark:opacity-[0.06]">
        <Cloud className="absolute top-[8%] w-56 animate-drift text-white/80 [animation-duration:90s]" />
        <Cloud className="absolute top-[38%] w-40 animate-drift text-white/60 [animation-delay:-45s] [animation-duration:120s]" />
        <Cloud className="absolute top-[70%] w-72 animate-drift text-white/50 [animation-delay:-70s] [animation-duration:140s]" />
      </div>
    </div>
  );
});
