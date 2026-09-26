import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { useSettings } from '@/hooks/useStore';
import { lock, passwordError, setPassword, verifyPassword } from '../lock/access';

/** Lock the app on this device or change the device password. */
export function PasswordSection() {
  const settings = useSettings();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const change = async (event: FormEvent) => {
    event.preventDefault();
    const problem = passwordError(next, repeat);
    if (problem) return setError(problem);
    setBusy(true);
    if (!(await verifyPassword(current, settings))) {
      setBusy(false);
      return setError('Das aktuelle Passwort stimmt nicht.');
    }
    await setPassword(next);
    setBusy(false);
    setOpen(false);
    setCurrent('');
    setNext('');
    setRepeat('');
    setError(undefined);
    toast({ message: 'Neues Passwort gespeichert 🔒' });
  };

  return (
    <section className="card flex flex-col gap-3 p-5 sm:p-6 lg:col-span-2" aria-labelledby="password-title">
      <h2 id="password-title" className="text-xl font-semibold">
        🔒 Passwort
      </h2>
      <p className="text-sm text-muted">
        Das Passwort gilt für diesen Browser auf diesem Gerät – jedes Gerät bekommt beim ersten Öffnen sein eigenes. Es wird nur als
        verschlüsselte Prüfsumme gespeichert und nie in Backups übernommen.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          icon={LockKeyhole}
          onClick={() => {
            lock();
            window.location.reload();
          }}
        >
          Jetzt sperren
        </Button>
        {!open && (
          <Button variant="soft" onClick={() => setOpen(true)}>
            Passwort ändern
          </Button>
        )}
      </div>
      {open && (
        <form onSubmit={change} className="grid gap-3 rounded-3xl bg-surface-2/60 p-4 sm:grid-cols-3" noValidate>
          <TextField label="Aktuelles Passwort" type="password" autoComplete="current-password" value={current} onChange={setCurrent} />
          <TextField label="Neues Passwort" type="password" autoComplete="new-password" value={next} onChange={setNext} />
          <TextField label="Neues Passwort wiederholen" type="password" autoComplete="new-password" value={repeat} onChange={setRepeat} />
          {error && (
            <p role="alert" className="text-sm font-bold text-danger sm:col-span-3">
              {error}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" disabled={busy}>
              Speichern
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
