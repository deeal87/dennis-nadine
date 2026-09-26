/**
 * Google Maps link helpers – no API key required. The optional map preview uses
 * the keyless "output=embed" page and is only loaded on user request.
 */
import { toSafeUrl } from './url';

export function isGoogleMapsUrl(value?: string): boolean {
  const safe = toSafeUrl(value);
  if (!safe) return false;
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'maps.app.goo.gl') return true;
  if (host === 'goo.gl') return url.pathname.startsWith('/maps');
  return /^(maps\.)?google\.[a-z.]+$/.test(host) && (host.startsWith('maps.') || url.pathname.startsWith('/maps'));
}

/** Extracts something a map can be centred on: coordinates, a place name or a query. */
export function extractMapsQuery(value?: string): string | undefined {
  const safe = toSafeUrl(value);
  if (!safe || !isGoogleMapsUrl(safe)) return undefined;
  const url = new URL(safe);
  const param = url.searchParams.get('q') ?? url.searchParams.get('query') ?? url.searchParams.get('destination');
  if (param) return param;
  const place = url.pathname.match(/\/place\/([^/]+)/)?.[1];
  if (place) return decodeURIComponent(place.replace(/\+/g, ' '));
  const coords = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coords) return `${coords[1]},${coords[2]}`;
  const search = url.pathname.match(/\/search\/([^/]+)/)?.[1];
  return search ? decodeURIComponent(search.replace(/\+/g, ' ')) : undefined;
}

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function mapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** Best link to open for a place: the stored Maps URL, otherwise a search for its address. */
export function resolveMapsLink(mapsUrl?: string, address?: string): string | undefined {
  const safe = toSafeUrl(mapsUrl);
  if (safe) return safe;
  return address?.trim() ? mapsSearchUrl(address.trim()) : undefined;
}
