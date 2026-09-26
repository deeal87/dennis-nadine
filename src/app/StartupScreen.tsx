import { Button } from '@/components/ui/Button';

/** Shown while the local database opens – or if it cannot be opened at all. */
export function StartupScreen({ error }: { error?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <p className="text-6xl animate-heartbeat" aria-hidden>
          {error ? '🌧️' : '💞'}
        </p>
        <h1 className="mt-4 text-3xl font-semibold">Dennis ❤️ Nadine</h1>
        {error ? (
          <>
            <p className="mt-3 text-muted">
              Unser lokaler Speicher konnte nicht geöffnet werden. Im privaten Modus mancher Browser ist IndexedDB gesperrt – bitte in einem
              normalen Fenster öffnen.
            </p>
            <p className="mt-2 text-xs text-muted">Details: {error}</p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Nochmal versuchen
            </Button>
          </>
        ) : (
          <p className="mt-2 text-muted" role="status">
            Unsere kleine Anime-Welt wird geladen …
          </p>
        )}
      </div>
    </div>
  );
}
