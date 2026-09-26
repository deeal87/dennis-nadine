import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { FloatingParticles } from '@/components/animations/FloatingParticles';
import { HeartShape } from '@/components/animations/Decor';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/form';
import { cn } from '@/lib/cn';
import { unlock } from './access';

/** Each wrong attempt adds a little waiting time. */
const PENALTY_MS = 800;

interface LockScreenProps {
  /** Optional extra line, e.g. why the password is asked again. */
  notice?: string;
  /** Called with the verified password. */
  onUnlock: (password: string) => Promise<void>;
}

export function LockScreen({ notice, onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !password.trim()) return;
    setBusy(true);
    const [ok] = await Promise.all([unlock(password, remember), new Promise((r) => setTimeout(r, failures * PENALTY_MS))]);
    if (ok) {
      await onUnlock(password);
      return;
    }
    setBusy(false);
    setFailures((f) => f + 1);
    setPassword('');
    setError('Das war leider nicht richtig. 💔');
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <FloatingParticles count={12} />
      <form
        onSubmit={submit}
        className={cn('card relative flex w-full max-w-sm flex-col gap-3 p-6 text-center sm:p-8 animate-pop', shake && '[animation:lock-shake_.45s_ease-in-out]')}
        aria-labelledby="lock-title"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-rose to-violet text-white shadow-[var(--shadow-lift)]">
          <HeartShape className="size-8 animate-heartbeat" />
        </div>
        <h1 id="lock-title" className="mt-1 font-display text-3xl font-semibold">
          Dennis ❤️ Nadine
        </h1>
        <p className="text-muted">{notice ?? 'Nur für Baby & Babe – bitte Passwort eingeben.'}</p>

        <div className="relative">
          <label htmlFor="lock-password" className="sr-only">
            Passwort
          </label>
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="lock-password"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            className={cn(inputClass, 'pl-11 pr-12 text-lg')}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>

        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 text-sm font-bold text-muted">
          <input type="checkbox" className="size-5 accent-[var(--rose)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Auf diesem Gerät angemeldet bleiben
        </label>

        <Button type="submit" size="lg" className="w-full" disabled={busy || !password.trim()}>
          {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : 'Eintreten ✨'}
        </Button>

        <p role="status" className="min-h-5 text-sm font-bold text-danger">
          {!busy && error}
        </p>
      </form>
    </main>
  );
}
