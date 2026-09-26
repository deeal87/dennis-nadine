import { useId, useRef, useState } from 'react';
import { Camera, LoaderCircle, Sparkles, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/form';
import { SmartImage } from '@/components/ui/SmartImage';
import { useToast } from '@/components/ui/Toast';
import { useSettings } from '@/hooks/useStore';
import { fileToDataUrl, isDataImage } from '@/lib/image';
import { CandidateGrid } from './CandidateGrid';
import { ImagePickerDialog } from './ImagePickerDialog';
import { IMAGE_DOMAIN_INFO, type ImageDomain, type ImageSearchContext } from './search';
import { useImageSearch } from './useImageSearch';
import type { ImageCandidate } from './providers';

export interface ImageSearchConfig {
  domain: ImageDomain;
  /** Built from the form (title, city, series …). */
  query: string;
  context?: ImageSearchContext;
  /** Called with the chosen online result (e.g. to fill in episodes). */
  onPick?: (candidate: ImageCandidate) => void;
}

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Enables online suggestions and the search dialog. */
  search?: ImageSearchConfig;
  fallbackEmoji?: string;
}

/**
 * One field for every image: web link, own photo (stored on the device) or
 * a matching online image – suggested automatically while typing.
 */
export function ImageField({ label, value, onChange, error, search, fallbackEmoji = '🖼️' }: ImageFieldProps) {
  const id = useId();
  const toast = useToast();
  const { autoImageSuggestions = true } = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isPhoto = isDataImage(value);
  const context = search?.context ?? {};

  const suggestions = useImageSearch(search?.domain ?? 'anime', search?.query ?? '', context, !!search && autoImageSuggestions && !value);

  const pick = (candidate: ImageCandidate) => {
    onChange(candidate.url);
    search?.onPick?.(candidate);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await fileToDataUrl(file));
    } catch (e) {
      toast({ tone: 'error', message: e instanceof Error ? e.message : 'Foto konnte nicht geladen werden.' });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const showSuggestions = !!search && !value && suggestions.status !== 'idle' && (suggestions.status === 'loading' || suggestions.results.length > 0);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <div className="flex gap-3">
        <div className="relative w-24 shrink-0 sm:w-28">
          <SmartImage src={value || undefined} alt={label} aspect="aspect-[3/4]" fallbackEmoji={fallbackEmoji} className="rounded-2xl border border-line" />
          {value && (
            <IconButton icon={X} label="Bild entfernen" onClick={() => onChange('')} className="absolute -right-2 -top-2 !size-9 bg-surface shadow-[var(--shadow-soft)]" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input
            id={id}
            type="url"
            inputMode="url"
            className={inputClass}
            value={isPhoto ? '' : value}
            placeholder={isPhoto ? '📷 Eigenes Foto gespeichert' : 'https://… oder Foto / Suche nutzen'}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={uploading ? LoaderCircle : Camera} onClick={() => fileInput.current?.click()} disabled={uploading}>
              Foto
            </Button>
            {search && (
              <Button variant="soft" size="sm" icon={Sparkles} onClick={() => setPickerOpen(true)}>
                Online suchen
              </Button>
            )}
          </div>
          {error && (
            <p id={`${id}-error`} className="text-xs font-bold text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void upload(e.target.files?.[0])} />

      {showSuggestions && (
        <div className="rounded-2xl bg-surface-2/70 p-2.5">
          <p className="mb-2 text-xs font-bold text-muted">✨ Passendes Bild? Einfach antippen</p>
          <CandidateGrid compact candidates={suggestions.results} loading={suggestions.status === 'loading'} onPick={pick} />
        </div>
      )}

      {pickerOpen && search && (
        <ImagePickerDialog
          domain={search.domain}
          initialQuery={search.query}
          context={context}
          selectedUrl={value}
          onPick={pick}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {search && !value && suggestions.status === 'done' && suggestions.results.length === 0 && search.query.trim().length >= 2 && (
        <p className="text-xs text-muted">Keine Online-Vorschläge ({IMAGE_DOMAIN_INFO[search.domain].sources}). Ein eigenes Foto geht immer.</p>
      )}
    </div>
  );
}
