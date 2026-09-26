import { memo, type ComponentType, type CSSProperties, type SVGProps } from 'react';
import { HeartShape, Leaf, Petal, Sparkle } from './Decor';

type Kind = 'heart' | 'sparkle' | 'leaf' | 'petal';

const SHAPES: Record<Kind, { Component: ComponentType<SVGProps<SVGSVGElement>>; color: string }> = {
  heart: { Component: HeartShape, color: 'text-rose/60' },
  sparkle: { Component: Sparkle, color: 'text-gold' },
  leaf: { Component: Leaf, color: 'text-mint/50' },
  petal: { Component: Petal, color: 'text-rose/40' },
};

const KINDS: Kind[] = ['heart', 'sparkle', 'petal', 'heart', 'leaf', 'sparkle', 'petal'];

/** Deterministic pseudo-random so particles don't jump between renders. */
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * A handful of GPU-friendly (transform/opacity only) rising particles.
 * Hidden entirely for prefers-reduced-motion via .motion-decor.
 */
export const FloatingParticles = memo(function FloatingParticles({ count = 14 }: { count?: number }) {
  return (
    <div className="motion-decor pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const kind = KINDS[i % KINDS.length]!;
        const { Component, color } = SHAPES[kind];
        const size = 10 + seeded(i, 1) * 16;
        const style = {
          left: `${seeded(i, 2) * 100}%`,
          bottom: '-10%',
          width: size,
          height: size,
          animationDuration: `${12 + seeded(i, 3) * 14}s`,
          animationDelay: `${-seeded(i, 4) * 20}s`,
          '--sway': `${(seeded(i, 5) - 0.5) * 120}px`,
          '--spin': `${(seeded(i, 6) - 0.5) * 540}deg`,
        } as CSSProperties;
        return <Component key={i} className={`absolute animate-rise will-change-transform ${color}`} style={style} />;
      })}
    </div>
  );
});
