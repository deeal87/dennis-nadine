import { useRef, useState } from 'react';
import { Download, TriangleAlert, Upload } from 'lucide-react';
import { analyzeBackup, backupFileName, exportBackup, importBackup, resetAllData, type BackupAnalysis } from '@/data/backup/backup';
import { STORE_NAMES } from '@/data/database';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { inputClass } from '@/components/ui/form';
import { downloadJson } from '@/lib/download';
import { formatDate } from '@/lib/date';
import { STORE_LABELS } from './storeLabels';

const MAX_IMPORT_BYTES = 300 * 1024 * 1024;
const RESET_WORD = 'LÖSCHEN';

export function BackupSection() {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [analysis, setAnalysis] = useState<BackupAnalysis | null>(null);
  const [importing, setImporting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetWord, setResetWord] = useState('');

  const exportNow = async () => {
    try {
      downloadJson(backupFileName(), await exportBackup());
      toast({ message: 'Backup exportiert 💾' });
    } catch (error) {
      toast({ tone: 'error', message: `Export fehlgeschlagen: ${error instanceof Error ? error.message : 'unbekannter Fehler'}` });
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast({ tone: 'error', message: 'Die Datei ist zu groß für ein Backup.' });
      return;
    }
    setAnalysis(analyzeBackup(await file.text()));
    if (fileInput.current) fileInput.current.value = '';
  };

  const confirmImport = async () => {
    if (!analysis?.valid) return;
    setImporting(true);
    try {
      await importBackup(analysis);
      toast({ message: 'Backup wiederhergestellt ✨' });
      setAnalysis(null);
    } catch (error) {
      toast({ tone: 'error', message: `Import fehlgeschlagen – eure Daten wurden nicht verändert. (${error instanceof Error ? error.message : ''})` });
    } finally {
      setImporting(false);
    }
  };

  const reset = async () => {
    try {
      await resetAllData();
      window.location.reload();
    } catch {
      toast({ tone: 'error', message: 'Löschen fehlgeschlagen.' });
    }
  };

  const total = analysis ? STORE_NAMES.reduce((sum, name) => sum + analysis.counts[name], 0) : 0;

  return (
    <section className="card flex flex-col gap-4 p-5 sm:p-6" aria-labelledby="backup-title">
      <div>
        <h2 id="backup-title" className="text-xl font-semibold">
          💾 Backup & Wiederherstellung
        </h2>
        <p className="text-sm text-muted">
          Alle Daten liegen nur in diesem Browser. Exportiert regelmäßig ein Backup – damit könnt ihr alles auf einem anderen Gerät
          wiederherstellen.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={Download} onClick={exportNow}>
          Backup exportieren
        </Button>
        <Button variant="secondary" icon={Upload} onClick={() => fileInput.current?.click()}>
          Backup importieren
        </Button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void onFile(e.target.files?.[0])} />
      </div>

      <div className="mt-2 rounded-3xl border border-danger/30 bg-danger-soft/50 p-4">
        <h3 className="flex items-center gap-2 font-bold text-danger">
          <TriangleAlert className="size-5" aria-hidden /> Gefahrenzone
        </h3>
        <p className="mb-3 text-sm text-muted">Löscht wirklich alles auf diesem Gerät. Exportiert vorher ein Backup!</p>
        <Button variant="danger" onClick={() => setResetOpen(true)}>
          Alle lokalen Daten löschen
        </Button>
      </div>

      <Modal
        open={analysis !== null}
        onClose={() => setAnalysis(null)}
        title={analysis?.valid ? 'Backup prüfen' : 'Backup ungültig'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnalysis(null)}>
              Abbrechen
            </Button>
            {analysis?.valid && (
              <Button onClick={confirmImport} disabled={importing || total === 0}>
                {importing ? 'Importiere …' : 'Importieren & ersetzen'}
              </Button>
            )}
          </>
        }
      >
        {analysis && (
          <div className="flex flex-col gap-4 text-sm">
            {analysis.valid ? (
              <>
                <p>
                  Backup-Version {analysis.version}
                  {analysis.exportedAt && <> vom {formatDate(analysis.exportedAt)}</>} mit <strong>{total} Einträgen</strong>.
                </p>
                <ul className="grid grid-cols-2 gap-2">
                  {STORE_NAMES.map((name) => (
                    <li key={name} className="flex justify-between rounded-xl bg-surface-2 px-3 py-2">
                      <span>{STORE_LABELS[name]}</span>
                      <strong>{analysis.counts[name]}</strong>
                    </li>
                  ))}
                </ul>
                <p className="rounded-2xl bg-peach-soft p-3 font-semibold">
                  Achtung: Beim Import werden alle aktuellen Daten auf diesem Gerät durch das Backup ersetzt.
                </p>
              </>
            ) : (
              <p className="text-danger">Diese Datei kann nicht importiert werden. Eure aktuellen Daten bleiben unverändert.</p>
            )}
            {analysis.issues.length > 0 && (
              <details open={!analysis.valid} className="rounded-2xl border border-line p-3">
                <summary className="cursor-pointer font-bold">
                  {analysis.valid ? `${analysis.issues.length} ungültige Einträge werden übersprungen` : 'Details'}
                </summary>
                <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-5 text-muted">
                  {analysis.issues.slice(0, 50).map((issue, index) => (
                    <li key={index}>
                      {issue.store === 'datei' ? '' : `${STORE_LABELS[issue.store]}${issue.index !== undefined ? ` #${issue.index + 1}` : ''}: `}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Wirklich alles löschen?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="danger" disabled={resetWord.trim().toUpperCase() !== RESET_WORD} onClick={reset}>
              Endgültig löschen
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm">
          <p>
            Alle Anime, Rezepte, Dates, Sammlungen, Erinnerungen, Timeline-Momente und Einstellungen auf diesem Gerät werden gelöscht. Das
            lässt sich <strong>nicht</strong> rückgängig machen. Danach startet die App im Ausgangszustand.
          </p>
          <label className="flex flex-col gap-1.5 font-bold">
            Zum Bestätigen „{RESET_WORD}“ eintippen
            <input className={inputClass} value={resetWord} onChange={(e) => setResetWord(e.target.value)} autoComplete="off" />
          </label>
        </div>
      </Modal>
    </section>
  );
}
