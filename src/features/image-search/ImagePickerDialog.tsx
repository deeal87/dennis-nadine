import { useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { inputClass } from '@/components/ui/form';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { CandidateGrid } from './CandidateGrid';
import { IMAGE_DOMAIN_INFO, type ImageDomain, type ImageSearchContext } from './search';
import { useImageSearch } from './useImageSearch';
import type { ImageCandidate } from './providers';

interface ImagePickerDialogProps {
  domain: ImageDomain;
  initialQuery: string;
  context: ImageSearchContext;
  selectedUrl?: string;
  onPick: (candidate: ImageCandidate) => void;
  onClose: () => void;
}

/** Full image search with editable query. Results come from public, keyless sources. */
export function ImagePickerDialog({ domain, initialQuery, context, selectedUrl, onPick, onClose }: ImagePickerDialogProps) {
  const [draft, setDraft] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const search = useImageSearch(domain, query, context, true, 0);
  const info = IMAGE_DOMAIN_INFO[domain];

  return (
    <Modal open onClose={onClose} title="Passendes Bild finden" description={`Quellen: ${info.sources}`} size="lg">
      <div className="flex flex-col gap-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(draft);
          }}
        >
          <input
            className={cn(inputClass, 'flex-1')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Suchbegriff für Bilder"
            placeholder="Wonach suchen?"
            autoFocus
          />
          <Button type="submit" icon={Search} aria-label="Bilder suchen">
            <span className="hidden sm:inline">Suchen</span>
          </Button>
        </form>
        {info.hint && <p className="text-sm text-muted">{info.hint}</p>}
        {search.status === 'done' && search.results.length === 0 ? (
          <p className="py-10 text-center text-muted">
            <span className="mb-2 block text-3xl" aria-hidden>
              🖼️
            </span>
            Keine Bilder gefunden. Probiert einen anderen Suchbegriff – oder ladet ein eigenes Foto hoch.
          </p>
        ) : (
          <CandidateGrid
            candidates={search.results}
            loading={search.status === 'loading'}
            selectedUrl={selectedUrl}
            onPick={(c) => {
              onPick(c);
              onClose();
            }}
          />
        )}
        <p className="text-xs text-muted">
          Bilder werden direkt von der Quelle geladen und bleiben dort gespeichert. Bitte nur für eure private Sammlung verwenden.
        </p>
      </div>
    </Modal>
  );
}
