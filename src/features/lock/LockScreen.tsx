import { useState, type FormEvent, type ReactNode } from 'react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import type { Settings } from '@/types/models';
import { FloatingParticles } from '@/components/animations/FloatingParticles';
import { HeartShape } from '@/components/animations/Decor';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/form';
import { resetAllData } from '@/data/backup/backup';
import { cn } from '@/lib/cn';
import { passwordError, setPassword, unlock } from './access';

/** Each wrong attempt adds a little waiting time. */
const PENALTY_MS = 800;

interface LockScreenProps {
  /** "setup" = first visit on this device, "unlock" = password is set. */
  mode: 'setup' | 'unlock';
  settings: Settings;
  onUnlock: () => void;
}

function PasswordInput({ id, label, value, onChange, autoFocus, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
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
  );
}

function Shell({ children, shake, onSubmit }: { children: ReactNode; shake: boolean; onSubmit: (e: FormEvent) => void }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <FloatingParticles count={12} />
      <form
        onSubmit={onSubmit}
        className={cn('card relative flex w-full max-w-sm flex-col gap-3 p-6 text-center sm:p-8 animate-pop', shake && '[animation:lock-shake_.45s_ease-in-out]')}
        aria-labelledby="lock-title"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-rose to-violet text-white shadow-[var(--shadow-lift)]">
          <HeartShape className="size-8 animate-heartbeat" />
        </div>
        <h1 id="lock-title" className="mt-1 font-display text-3xl font-semibold">
          Dennis ❤️ Nadine
        </h1>
        {children}
      </form>
    </main>
  );
}

export function LockScreen({ mode, settings, onUnlock }: LockScreenProps) {
  const [password, setPasswordValue] = useState('');
  const [repeat, setRepeat] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [forgot, setForgot] = useState(false);

  const fail = (message: string) => {
    setError(message);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (mode === 'setup') {
      const problem = passwordError(password, repeat);
      if (problem) return fail(problem);
      setBusy(true);
      await setPassword(password, rememberMe);
      setBusy(false);
      return onUnlock();
    }
    if (!password.trim()) return;
    setBusy(true);
    const [ok] = await Promise.all([unlock(password, settings, rememberMe), new Promise((r) => setTimeout(r, failures * PENALTY_MS))]);
    setBusy(false);
    if (ok) return onUnlock();
    setFailures((f) => f + 1);
    setPasswordValue('');
    fail('Das war leider nicht richtig. 💔');
  };

  const rememberBox = (
    <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 text-sm font-bold text-muted">
      <input type="checkbox" className="size-5 accent-[var(--rose)]" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
      Auf diesem Gerät angemeldet bleiben
    </label>
  );

  return (
    <Shell shake={shake} onSubmit={submit}>
      {mode === 'setup' ? (
        <>
          <p className="text-muted">Willkommen! Legt ein Passwort für diese kleine Welt auf diesem Gerät fest.</p>
          <PasswordInput id="lock-new" label="Neues Passwort" value={password} onChange={setPasswordValue} autoFocus autoComplete="new-password" />
          <PasswordInput id="lock-repeat" label="Passwort wiederholen" value={repeat} onChange={setRepeat} autoComplete="new-password" />
          {rememberBox}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : 'Passwort festlegen ✨'}
          </Button>
          <p className="text-xs text-muted">Merkt es euch gut – es gibt keinen Server, der es zurücksetzen könnte.</p>
        </>
      ) : (
        <>
          <p className="text-muted">Nur für Baby & Babe – bitte Passwort eingeben.</p>
          <PasswordInput id="lock-password" label="Passwort" value={password} onChange={setPasswordValue} autoFocus autoComplete="current-password" />
          {rememberBox}
          <Button type="submit" size="lg" className="w-full" disabled={busy || !password.trim()}>
            {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : 'Eintreten ✨'}
          </Button>
        </>
      )}

      <p role="status" className="min-h-5 text-sm font-bold text-danger">
        {!busy && error}
      </p>

      {mode === 'unlock' && failures >= 2 && (
        <div className="text-sm">
          {!forgot ? (
            <button type="button" className="font-bold text-muted underline-offset-2 hover:underline" onClick={() => setForgot(true)}>
              Passwort vergessen?
            </button>
          ) : (
            <div className="rounded-2xl bg-danger-soft p-3 text-left">
              <p>
                Ohne Passwort kommt niemand an die Daten – auch wir nicht. Einziger Ausweg: <strong>alle Daten auf diesem Gerät löschen</strong> und
                neu starten. Mit einem Backup lässt sich danach alles wiederherstellen.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => setForgot(false)}>
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    await resetAllData();
                    window.location.reload();
                  }}
                >
                  Alles löschen & neu starten
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
