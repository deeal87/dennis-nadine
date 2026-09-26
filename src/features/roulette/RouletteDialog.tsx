import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Check, LoaderCircle, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button, buttonClasses } from '@/components/ui/Button';
import { SmartImage } from '@/components/ui/SmartImage';
import { MapPreview } from '@/components/media/MapPreview';
import { burstFromElement } from '@/components/animations/burst';

/** Presentation model of a random pick, independent of the entity type. */
export interface PickResult {
  id: string;
  title: string;
  emoji: string;
  kindLabel: string;
  lines: string[];
  imageUrl?: string;
  href?: string;
  mapsUrl?: string;
  address?: string;
  /** Attribution line, e.g. "Gefunden auf OpenStreetMap". */
  source?: { label: string; url: string };
  /** Extra call to action, e.g. "Zu unseren Dates". */
  action?: { label: string; doneLabel: string; run: () => Promise<boolean> };
}

interface RouletteDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  headline?: string;
  /** Returns a random result (sync or async), avoiding `previousId` when possible. Throw to show an error. */
  spin: (previousId?: string) => PickResult | undefined | Promise<PickResult | undefined>;
  emptyText: string;
  emptyAction?: ReactNode;
  /** Filters etc. shown above the spin button. */
  controls?: ReactNode;
  spinLabel?: string;
}

const COUNTDOWN_FROM = 3;
const TICK_MS = 550;

export function RouletteDialog({ open, onClose, ...props }: RouletteDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={props.title} size="md">
      <RouletteBody onClose={onClose} {...props} />
    </Modal>
  );
}

type Phase =
  | { name: 'idle' }
  | { name: 'countdown'; value: number }
  | { name: 'searching' }
  | { name: 'result'; result: PickResult }
  | { name: 'empty' }
  | { name: 'error'; message: string };

function RouletteBody({ headline = '✨ Euer nächstes Abenteuer ✨', spin, emptyText, emptyAction, controls, spinLabel = 'Überrasche uns ❤️', onClose }: Omit<RouletteDialogProps, 'open' | 'title'>) {
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const resultRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | undefined>(undefined);
  const spinRef = useRef(spin);
  spinRef.current = spin;

  const pending = useRef<Promise<PickResult | undefined> | null>(null);
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());

  // The search starts right away and runs during the countdown; reveal waits for it.
  const reveal = useCallback(async () => {
    setPhase((current) => (current.name === 'countdown' ? { name: 'searching' } : current));
    try {
      const result = await pending.current;
      lastId.current = result?.id;
      setPhase(result ? { name: 'result', result } : { name: 'empty' });
    } catch (error) {
      setPhase({ name: 'error', message: error instanceof Error ? error.message : 'Da ist etwas schiefgelaufen.' });
    }
  }, []);

  const start = () => {
    pending.current = Promise.resolve().then(() => spinRef.current(lastId.current));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase({ name: 'searching' });
      void reveal();
      return;
    }
    setPhase({ name: 'countdown', value: COUNTDOWN_FROM });
  };

  const runAction = async (result: PickResult) => {
    if (result.action && (await result.action.run())) setSaved((all) => new Set(all).add(result.id));
  };

  useEffect(() => {
    if (phase.name !== 'countdown') return;
    const timer = window.setTimeout(() => {
      if (phase.value > 1) setPhase({ name: 'countdown', value: phase.value - 1 });
      else void reveal();
    }, TICK_MS);
    return () => window.clearTimeout(timer);
  }, [phase, reveal]);

  useEffect(() => {
    if (phase.name === 'result' && resultRef.current) burstFromElement(resultRef.current, ['💖', '✨', '🌸', '⭐'], 16);
  }, [phase]);

  return (
    <div className="flex flex-col gap-5">
      {controls && phase.name !== 'countdown' && phase.name !== 'searching' && <div className="flex flex-col gap-3">{controls}</div>}

      <div className="grid min-h-72 place-items-center [perspective:900px]">
        {phase.name === 'idle' && (
          <button
            type="button"
            onClick={start}
            className="group grid size-56 place-items-center rounded-[2.5rem] bg-gradient-to-br from-rose via-violet to-peach p-1 shadow-[var(--shadow-lift)] transition hover:scale-[1.03] active:scale-95"
          >
            <span className="grid size-full place-items-center rounded-[2.3rem] bg-surface/90 px-4 text-center">
              <span>
                <span className="block text-6xl transition group-hover:rotate-12" aria-hidden>
                  🎲
                </span>
                <span className="mt-3 block font-display text-xl font-semibold">{spinLabel}</span>
              </span>
            </span>
          </button>
        )}

        {phase.name === 'countdown' && (
          <div
            className="grid size-56 place-items-center rounded-[2.5rem] bg-gradient-to-br from-rose via-violet to-peach text-white shadow-[var(--shadow-lift)] [animation:spin-card_.55s_ease-in-out_infinite]"
            role="status"
            aria-live="assertive"
          >
            <span className="font-display text-8xl font-bold drop-shadow">{phase.value}</span>
          </div>
        )}

        {phase.name === 'searching' && (
          <div className="flex flex-col items-center gap-3 text-center" role="status">
            <LoaderCircle className="size-10 animate-spin text-violet" aria-hidden />
            <p className="font-bold">Wir suchen etwas Schönes für euch …</p>
          </div>
        )}

        {phase.name === 'error' && (
          <div className="text-center" role="alert">
            <p className="text-5xl" aria-hidden>
              🌧️
            </p>
            <p className="mt-3 font-bold">{phase.message}</p>
          </div>
        )}

        {phase.name === 'empty' && (
          <div className="text-center">
            <p className="text-5xl" aria-hidden>
              🫧
            </p>
            <p className="mt-3 font-bold">{emptyText}</p>
            {emptyAction && <div className="mt-4">{emptyAction}</div>}
          </div>
        )}

        {phase.name === 'result' && (
          <div ref={resultRef} className="w-full [animation:flip-in_.6s_cubic-bezier(.2,.8,.3,1.1)_both]" role="status" aria-live="polite">
            <p className="mb-3 text-center font-display text-lg font-semibold text-rose">{headline}</p>
            <div className="card overflow-hidden">
              {phase.result.imageUrl && <SmartImage src={phase.result.imageUrl} alt={phase.result.title} aspect="aspect-[16/8]" fallbackEmoji={phase.result.emoji} />}
              <div className="flex flex-col items-center gap-2 p-5 text-center">
                <span className="text-4xl" aria-hidden>
                  {phase.result.emoji}
                </span>
                <h3 className="text-2xl font-semibold sm:text-3xl">{phase.result.title}</h3>
                <p className="font-bold text-violet">{phase.result.kindLabel}</p>
                {phase.result.lines.map((line) => (
                  <p key={line} className="text-muted">
                    {line}
                  </p>
                ))}
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {(phase.result.mapsUrl || phase.result.address) && (
                    <MapPreview mapsUrl={phase.result.mapsUrl} address={phase.result.address} name={phase.result.title} />
                  )}
                  {phase.result.action &&
                    (saved.has(phase.result.id) ? (
                      <span className={buttonClasses('soft', 'md', 'pointer-events-none')}>
                        <Check className="size-5" aria-hidden /> {phase.result.action.doneLabel}
                      </span>
                    ) : (
                      <Button variant="soft" onClick={() => void runAction(phase.result)}>
                        {phase.result.action.label}
                      </Button>
                    ))}
                  {phase.result.href && (
                    <Link to={phase.result.href} onClick={onClose} className={buttonClasses('secondary')}>
                      Details ansehen
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {phase.name === 'result' && phase.result.source && (
        <p className="-mt-2 text-center text-xs text-muted">
          <a href={phase.result.source.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            {phase.result.source.label}
          </a>
        </p>
      )}

      {(phase.name === 'result' || phase.name === 'empty' || phase.name === 'error') && (
        <Button variant="soft" icon={RotateCcw} onClick={start} className="self-center">
          Nochmal drehen
        </Button>
      )}
    </div>
  );
}
