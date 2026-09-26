import { useState } from 'react';
import { Compass, ExternalLink } from 'lucide-react';
import { extractMapsQuery, mapsEmbedUrl, resolveMapsLink } from '@/lib/maps';
import { buttonClasses } from '../ui/Button';

interface MapPreviewProps {
  mapsUrl?: string;
  address?: string;
  name: string;
}

/**
 * "In Google Maps öffnen" + optional keyless map preview. The embedded map is
 * only loaded on request, so no data goes to Google unless the user wants it.
 */
export function MapPreview({ mapsUrl, address, name }: MapPreviewProps) {
  const [showMap, setShowMap] = useState(false);
  const link = resolveMapsLink(mapsUrl, address);
  const query = extractMapsQuery(mapsUrl) ?? (address?.trim() || undefined);
  if (!link) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a href={link} target="_blank" rel="noopener noreferrer" className={buttonClasses('primary', 'md')}>
          <Compass className="size-5" aria-hidden /> In Google Maps öffnen <ExternalLink className="size-4" aria-hidden />
        </a>
        {query && !showMap && (
          <button type="button" className={buttonClasses('secondary', 'md')} onClick={() => setShowMap(true)}>
            Karte anzeigen
          </button>
        )}
      </div>
      {showMap && query && (
        <div className="overflow-hidden rounded-3xl border border-line">
          <iframe
            title={`Karte: ${name}`}
            src={mapsEmbedUrl(query)}
            className="aspect-[16/10] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}
