import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { lock } from '../lock/access';

/** Lock the app on this device (the password itself is fixed for the whole site). */
export function PasswordSection() {
  return (
    <section className="card flex flex-col gap-3 p-5 sm:p-6 lg:col-span-2" aria-labelledby="password-title">
      <h2 id="password-title" className="text-xl font-semibold">
        🔒 Zugang
      </h2>
      <p className="text-sm text-muted">
        Die Seite ist mit eurem festen Passwort geschützt – ohne kommt niemand hinein. Es steckt nur als Prüfsumme im Code, nie im Klartext.
        Hier könnt ihr euch auf diesem Gerät wieder abmelden.
      </p>
      <Button
        variant="secondary"
        icon={LockKeyhole}
        className="self-start"
        onClick={() => {
          lock();
          window.location.reload();
        }}
      >
        Jetzt sperren
      </Button>
    </section>
  );
}
