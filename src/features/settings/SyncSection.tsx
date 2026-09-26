import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router';
import { CloudDownload, CloudUpload, ExternalLink, KeyRound, LoaderCircle } from 'lucide-react';
import { Button, buttonClasses } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { settingsRepository } from '@/data/repositories';
import { useSettings } from '@/hooks/useStore';
import { cn } from '@/lib/cn';
import { verifyPassword } from '../lock/access';
import { fetchSyncFile, SYNC_BRANCH, SYNC_ENABLED, SYNC_REPO, verifyToken } from '../sync/github';
import { adoptPassword, autoSync, loadRemoteNow, readRemote, saveNow, SyncConflictError } from '../sync/sync';
import { useSync, useSyncAttention } from '../sync/useSync';
import { SYNC_ANCHOR } from '../sync/UnsavedPill';

const timeFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
const when = (iso?: string) => (iso ? timeFormat.format(new Date(iso)) : '');
const [SYNC_OWNER = '', SYNC_NAME = ''] = SYNC_REPO.split('/');
/** GitHub pre-fills name, owner, expiry and the Contents permission from these parameters. */
const TOKEN_URL = `https://github.com/settings/personal-access-tokens/new?${new URLSearchParams({
  name: 'Dennis Nadine Speichern',
  description: 'Speichert den verschlüsselten Stand der App',
  target_name: SYNC_OWNER,
  expires_in: 'none',
  contents: 'write',
})}`;

export function Dot({ className }: { className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 rounded-full bg-danger ring-2 ring-surface', className)} />;
}

/** One inline password prompt (used when this device has no sync key yet). */
function PasswordPrompt({ label, onSubmit }: { label: string; onSubmit: (password: string) => Promise<string | null> }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(await onSubmit(value));
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-3">
      <label htmlFor="sync-password" className="text-sm font-bold">
        {label}
      </label>
      <div className="flex gap-2">
        <input id="sync-password" type="password" autoComplete="current-password" className={cn(inputClass, 'flex-1')} value={value} onChange={(e) => setValue(e.target.value)} />
        <Button type="submit" disabled={busy || !value.trim()}>
          {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : 'OK'}
        </Button>
      </div>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </form>
  );
}

export function SyncSection() {
  const settings = useSettings();
  const { dirty, remote } = useSync();
  const attention = useSyncAttention();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<'save' | 'load' | null>(null);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();

  // Coming from the "Speichern" reminder: bring this section into view.
  useEffect(() => {
    if (hash === `#${SYNC_ANCHOR}`) sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  if (!SYNC_ENABLED) return null;
  const hasToken = !!settings.githubToken;

  const report = (error: unknown) => toast({ tone: 'error', message: error instanceof Error ? error.message : 'Das hat nicht geklappt.' });

  const save = async (force = false): Promise<void> => {
    if (!hasToken) return setTokenOpen(true);
    if (!settings.syncKey) return setNeedsPassword(true);
    setBusy('save');
    try {
      const file = await saveNow(settings, force);
      toast({ message: `Gespeichert ☁️ – alle Geräte bekommen jetzt Stand ${file.version}` });
    } catch (error) {
      if (error instanceof SyncConflictError) {
        setBusy(null);
        const overwrite = await confirm({
          title: 'Neuerer Stand auf GitHub',
          message: `Am ${when(error.remote.savedAt)} wurde auf einem anderen Gerät gespeichert. Wenn ihr jetzt speichert, wird dieser Stand ersetzt.`,
          confirmLabel: 'Trotzdem speichern',
        });
        if (overwrite) return save(true);
      } else report(error);
    } finally {
      setBusy(null);
    }
  };

  const load = async () => {
    if (dirty) {
      const ok = await confirm({
        title: 'Gespeicherten Stand laden?',
        message: 'Eure ungespeicherten Änderungen auf diesem Gerät gehen dabei verloren.',
        confirmLabel: 'Laden',
      });
      if (!ok) return;
    }
    setBusy('load');
    try {
      await loadRemoteNow(settings);
      toast({ message: 'Gespeicherter Stand geladen ✨' });
    } catch (error) {
      report(error);
    } finally {
      setBusy(null);
    }
  };

  const connect = async (event: FormEvent) => {
    event.preventDefault();
    setTokenError(null);
    try {
      await verifyToken(token.trim());
      await settingsRepository.update({ githubToken: token.trim() });
      setToken('');
      setTokenOpen(false);
      toast({ message: 'GitHub verbunden – dieses Gerät kann jetzt speichern 🔑' });
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : 'Verbindung fehlgeschlagen.');
    }
  };

  /** Password → sync key for this device (opens the saved state if there is one). */
  const connectPassword = async (password: string): Promise<string | null> => {
    const file = await fetchSyncFile(settings.githubToken).catch(() => null);
    if (!(await verifyPassword(password))) return 'Das Passwort stimmt nicht.';
    const { opened } = await adoptPassword(password, file);
    if (file && !opened) return 'Mit diesem Passwort lässt sich der gespeicherte Stand nicht öffnen.';
    setNeedsPassword(false);
    const fresh = await settingsRepository.get();
    if ((await autoSync(fresh, await readRemote(fresh.githubToken))) === 'loaded') toast({ message: 'Gespeicherter Stand geladen ✨' });
    else toast({ message: 'Passwort übernommen 🔒' });
    return null;
  };

  const status = (() => {
    switch (remote.kind) {
      case 'in-sync':
        return dirty ? `Ungespeicherte Änderungen – zuletzt gespeichert ${when(remote.savedAt)}` : `Alles gespeichert ✓ (${when(remote.savedAt)})`;
      case 'none':
        return dirty ? 'Noch nie gespeichert – eure Einträge sind bisher nur auf diesem Gerät.' : 'Noch nie gespeichert.';
      case 'conflict':
        return `Auf einem anderen Gerät wurde am ${when(remote.savedAt)} gespeichert – und hier gibt es ungespeicherte Änderungen.`;
      case 'key-mismatch':
        return `Auf GitHub liegt ein Stand vom ${when(remote.savedAt)}, den dieses Gerät noch nicht öffnen kann.`;
      case 'offline':
        return `GitHub gerade nicht erreichbar (${remote.message}). ${dirty ? 'Ungespeicherte Änderungen bleiben hier erhalten.' : ''}`;
      default:
        return dirty ? 'Ungespeicherte Änderungen.' : 'Prüfe gespeicherten Stand …';
    }
  })();

  return (
    <section
      ref={sectionRef}
      id={SYNC_ANCHOR}
      className={cn('card flex scroll-mt-24 flex-col gap-4 p-5 sm:p-6 lg:col-span-2', attention && 'ring-2 ring-danger/40')}
      aria-labelledby="sync-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="sync-title" className="flex items-center gap-2 text-xl font-semibold">
            ☁️ Speichern & auf allen Geräten
            {attention && <Dot />}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Speichert euren Stand verschlüsselt (mit eurem Passwort) auf GitHub. Jedes Gerät lädt beim Öffnen automatisch den neuesten Stand.
          </p>
        </div>
      </div>

      <p className={cn('rounded-2xl px-4 py-3 text-sm font-bold', attention ? 'bg-danger-soft text-danger' : 'bg-mint-soft text-mint')} role="status">
        {status}
      </p>

      {remote.kind === 'key-mismatch' || needsPassword ? (
        <PasswordPrompt label={needsPassword ? 'Passwort eingeben, um dieses Gerät zu verbinden' : 'Passwort des gespeicherten Stands eingeben'} onSubmit={connectPassword} />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button icon={busy === 'save' ? LoaderCircle : CloudUpload} onClick={() => void save()} disabled={busy !== null}>
          {remote.kind === 'conflict' ? 'Meinen Stand speichern' : 'Jetzt speichern'}
        </Button>
        {(remote.kind === 'in-sync' || remote.kind === 'conflict') && (
          <Button variant="secondary" icon={busy === 'load' ? LoaderCircle : CloudDownload} onClick={() => void load()} disabled={busy !== null}>
            {remote.kind === 'conflict' ? 'Stand vom anderen Gerät laden' : 'Neu laden'}
          </Button>
        )}
      </div>

      {(tokenOpen || (!hasToken && dirty)) && !hasToken && (
        <form onSubmit={connect} className="flex flex-col gap-3 rounded-3xl border border-line bg-surface-2/60 p-4 text-sm">
          <p className="flex items-center gap-2 font-bold">
            <KeyRound className="size-4 text-violet" aria-hidden /> Einmalig pro Gerät, das speichern soll: GitHub-Schlüssel
          </p>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted">
            <li>
              <a href={TOKEN_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-rose underline-offset-2 hover:underline">
                Schlüssel auf GitHub erstellen <ExternalLink className="inline size-3.5" aria-hidden />
              </a>{' '}
              (öffnet „Fine-grained token“, Name ist schon ausgefüllt)
            </li>
            <li>
              <strong>Repository access:</strong> „<strong>Only select repositories</strong>“ → <strong>{SYNC_NAME}</strong> auswählen.{' '}
              <span className="text-danger">Nicht „Public repositories“ – damit darf der Schlüssel nur lesen.</span>
            </li>
            <li>
              <strong>Permissions:</strong> „Add permissions“ → <strong>Contents</strong> → Access „<strong>Read and write</strong>“ (steht es schon da,
              passt es).
            </li>
            <li>
              Ganz unten „<strong>Generate token</strong>“, Schlüssel kopieren und hier einfügen:
            </li>
          </ol>
          <div className="flex gap-2">
            <input
              className={cn(inputClass, 'flex-1 font-mono text-xs')}
              placeholder="github_pat_…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              aria-label="GitHub-Schlüssel"
              autoComplete="off"
            />
            <Button type="submit" disabled={!token.trim()}>
              Verbinden
            </Button>
          </div>
          {tokenError && <p className="font-bold text-danger">{tokenError}</p>}
          <p className="text-xs text-muted">
            Der Schlüssel bleibt nur auf diesem Gerät und kommt in kein Backup. Geräte, die nur anschauen und laden, brauchen keinen.
          </p>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {hasToken ? (
          <>
            <span>🔑 Dieses Gerät kann speichern.</span>
            <button type="button" className="font-bold underline-offset-2 hover:underline" onClick={() => void settingsRepository.update({ githubToken: undefined })}>
              Schlüssel entfernen
            </button>
          </>
        ) : (
          !tokenOpen && (
            <button type="button" className="font-bold underline-offset-2 hover:underline" onClick={() => setTokenOpen(true)}>
              GitHub-Schlüssel einrichten
            </button>
          )
        )}
        <a
          href={`https://github.com/${SYNC_REPO}/commits/${SYNC_BRANCH}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('ghost', 'sm', '!min-h-0 !px-0 text-xs')}
        >
          Speicherverlauf auf GitHub <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </section>
  );
}
