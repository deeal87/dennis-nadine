import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { STORE_NAMES } from '@/data/database';
import { useSettings, useStore } from '@/hooks/useStore';
import { settingsRepository } from '@/data/repositories';
import { SwitchField } from '@/components/ui/form';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { BackupSection } from './BackupSection';
import { STORE_LABELS } from './storeLabels';

function useStorageStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<string | null>(null);
  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
    void navigator.storage?.estimate?.().then(
      ({ usage: bytes }) => bytes !== undefined && setUsage(`${(bytes / 1024 / 1024).toFixed(1)} MB`),
      () => undefined,
    );
  }, []);
  const request = async () => setPersisted((await navigator.storage?.persist?.()) ?? false);
  return { persisted, usage, request, supported: typeof navigator.storage?.persist === 'function' };
}

function CountRow({ store }: { store: (typeof STORE_NAMES)[number] }) {
  const { items } = useStore(store);
  return (
    <li className="flex justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
      <span>{STORE_LABELS[store]}</span>
      <strong>{items.length}</strong>
    </li>
  );
}

export default function SettingsPage() {
  useDocumentTitle('Einstellungen');
  const storage = useStorageStatus();
  const { autoImageSuggestions = true } = useSettings();

  return (
    <>
      <PageHeader emoji="⚙️" title="Einstellungen" subtitle="Aussehen, Backups und alles rund um eure Daten." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="theme-title">
          <h2 id="theme-title" className="text-xl font-semibold">
            🌗 Farbschema
          </h2>
          <p className="text-sm text-muted">Hell für sonnige Tage, Dunkel für Anime-Nächte unter Sternen – oder einfach wie euer Gerät.</p>
          <ThemeSwitcher showLabels />
        </section>

        <section className="card flex flex-col gap-3 p-5 sm:p-6" aria-labelledby="privacy-title">
          <h2 id="privacy-title" className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="size-5 text-mint" aria-hidden /> Datenschutz
          </h2>
          <p className="text-sm text-muted">
            Keine Accounts, kein Tracking, keine Analytics. Alles bleibt lokal in eurem Browser (IndexedDB) – auch hochgeladene Fotos. Für
            Bildvorschläge und „Neu entdecken“ werden nur Suchbegriffe (Titel, Ort, Bundesland) an öffentliche Dienste wie MyAnimeList,
            Wikipedia oder OpenStreetMap geschickt. Karten und Videos laden erst, wenn ihr sie öffnet.
          </p>
          {storage.supported && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {storage.persisted ? (
                <span className="font-bold text-mint">✓ Speicher ist dauerhaft geschützt</span>
              ) : (
                <Button size="sm" variant="soft" onClick={() => void storage.request()}>
                  Speicher dauerhaft schützen
                </Button>
              )}
              {storage.usage && <span className="text-muted">Belegt: {storage.usage}</span>}
            </div>
          )}
        </section>

        <section className="card flex flex-col gap-3 p-5 sm:p-6 lg:col-span-2" aria-labelledby="images-title">
          <h2 id="images-title" className="text-xl font-semibold">
            🖼️ Bilder
          </h2>
          <p className="text-sm text-muted">
            Anime-Cover kommen von MyAnimeList/AniList, Orte und Gerichte von Wikipedia, Wikimedia Commons und TheMealDB, LEGO-Sets über die
            Set-Nummer. Eigene Fotos gehen überall.
          </p>
          <SwitchField
            label="Bilder automatisch vorschlagen"
            description="Beim Eintippen eines Titels passende Bilder zeigen"
            checked={autoImageSuggestions}
            onChange={(value) => void settingsRepository.update({ autoImageSuggestions: value })}
          />
        </section>

        <div className="lg:col-span-2">
          <BackupSection />
        </div>

        <section className="card flex flex-col gap-3 p-5 sm:p-6 lg:col-span-2" aria-labelledby="stats-title">
          <h2 id="stats-title" className="text-xl font-semibold">
            📦 Gespeicherte Daten
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_NAMES.filter((s) => s !== 'settings').map((store) => (
              <CountRow key={store} store={store} />
            ))}
          </ul>
          <p className="pt-2 text-center text-xs text-muted">Psst … in dieser kleinen Welt verstecken sich ein paar Überraschungen. ✨</p>
        </section>
      </div>
    </>
  );
}
