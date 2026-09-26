import { createContext, useCallback, useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useKeySequence } from '@/hooks/useKeySequence';
import { Petal } from './Decor';

export type EasterEgg = 'power-up' | 'sakura';

const EasterEggContext = createContext<(egg: EasterEgg) => void>(() => undefined);

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'] as const;
const LOVE_WORD = ['b', 'a', 'b', 'e'] as const;

/**
 * Little surprises:
 *  - Konami code (↑↑↓↓←→←→ B A) → "Power-Up" energy aura
 *  - typing "babe" anywhere     → sakura rain
 *  - clicking the logo 5×       → sakura rain (triggered from the logo)
 */
export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<EasterEgg | null>(null);
  const trigger = useCallback((egg: EasterEgg) => setActive(egg), []);

  useKeySequence(KONAMI, () => trigger('power-up'));
  useKeySequence(LOVE_WORD, () => trigger('sakura'));

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setActive(null), active === 'power-up' ? 4200 : 5200);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <EasterEggContext.Provider value={trigger}>
      {children}
      {active && (
        <div
          className="fixed inset-0 z-[70] grid cursor-pointer place-items-center overflow-hidden"
          role="status"
          onClick={() => setActive(null)}
        >
          {active === 'power-up' ? <PowerUp /> : <Sakura />}
        </div>
      )}
    </EasterEggContext.Provider>
  );
}

export function useEasterEgg(): (egg: EasterEgg) => void {
  return useContext(EasterEggContext);
}

function PowerUp() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle,rgb(60_40_110/.92),rgb(14_17_48/.96)_70%)] backdrop-blur-sm animate-fade-up">
      {[0, 1, 2].map((ring) => (
        <span
          key={ring}
          aria-hidden
          className="absolute size-72 rounded-full border-4 border-gold/70 shadow-[0_0_60px_rgb(255_212_121/.7)]"
          style={{ animation: `aura 1.2s ease-in-out ${ring * 0.25}s infinite`, scale: `${1 + ring * 0.35}` }}
        />
      ))}
      <div className="relative text-center text-white animate-pop">
        <p className="text-6xl" aria-hidden>
          ⚡❤️⚡
        </p>
        <p className="mt-3 font-display text-4xl font-bold drop-shadow-[0_0_18px_rgb(255_212_121)]">Power-Up!</p>
        <p className="mt-1 text-lg font-bold">Baby & Babe – Liebes-Level: über 9000!</p>
      </div>
    </div>
  );
}

function Sakura() {
  return (
    <div className="absolute inset-0 bg-rose-soft/40 backdrop-blur-[2px] animate-fade-up">
      {Array.from({ length: 36 }, (_, i) => (
        <Petal
          key={i}
          className="absolute text-rose/70"
          style={
            {
              left: `${(i * 29) % 100}%`,
              top: '-5%',
              width: 14 + (i % 4) * 5,
              animation: `fall ${4 + (i % 5)}s linear ${(i % 9) * -0.5}s infinite`,
              '--sway': `${((i % 7) - 3) * 30}px`,
              '--spin': `${(i % 2 ? 1 : -1) * 360}deg`,
            } as CSSProperties
          }
        />
      ))}
      <div className="absolute inset-0 grid place-items-center">
        <div className="card px-10 py-8 text-center animate-pop">
          <p className="font-display text-7xl text-rose" aria-hidden>
            愛
          </p>
          <p className="mt-2 font-display text-2xl font-semibold">Baby ❤️ Babe</p>
          <p className="text-sm text-muted">Für immer unsere kleine Anime-Welt</p>
        </div>
      </div>
    </div>
  );
}
