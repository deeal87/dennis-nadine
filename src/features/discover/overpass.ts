/**
 * OpenStreetMap lookups via the public Overpass API (no key, CORS enabled).
 * Query builders and parsers are pure so they can be tested offline.
 */
import { toSafeUrl } from '@/lib/url';
import type { DiscoverType, Region } from './config';

export interface Town {
  id: number;
  name: string;
  lat: number;
  lon: number;
  kind: string;
}

export interface DiscoveredPlace {
  id: string;
  name: string;
  typeId: string;
  lat: number;
  lon: number;
  address?: string;
  city?: string;
  cuisine?: string;
  website?: string;
  imageUrl?: string;
  osmUrl: string;
}

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

export class DiscoverError extends Error {}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\"]/g, '\\$&');

export function buildTownsQuery(region: Region, city?: string): string {
  const kinds = city ? 'city|town|village|suburb' : region.cityState ? 'city|suburb|quarter' : 'city|town';
  const name = city?.trim() ? `["name"~"^${escapeRegex(city.trim())}$",i]` : '["name"]';
  return `[out:json][timeout:25];area["ISO3166-2"="${region.code}"]["admin_level"="4"]->.r;node["place"~"^(${kinds})$"]${name}(area.r);out 600;`;
}

/** Search radius around the town centre, in metres. */
export function radiusFor(kind: string): number {
  return kind === 'city' ? 8000 : kind === 'town' ? 5000 : 3000;
}

export function buildPlacesQuery(type: DiscoverType, town: Pick<Town, 'lat' | 'lon' | 'kind'>): string {
  const around = `(around:${radiusFor(town.kind)},${town.lat.toFixed(5)},${town.lon.toFixed(5)})`;
  const parts = type.filters.map((filter) => `nwr${filter}["name"]${around};`).join('');
  return `[out:json][timeout:25];(${parts});out center tags 300;`;
}

type Element = { type?: string; id?: number; lat?: number; lon?: number; center?: { lat?: number; lon?: number }; tags?: Record<string, string> };

function elements(json: unknown): Element[] {
  const list = (json as { elements?: unknown } | null)?.elements;
  return Array.isArray(list) ? (list as Element[]) : [];
}

export function parseTowns(json: unknown): Town[] {
  return elements(json).flatMap((e) =>
    typeof e.id === 'number' && typeof e.lat === 'number' && typeof e.lon === 'number' && e.tags?.name
      ? [{ id: e.id, name: e.tags.name, lat: e.lat, lon: e.lon, kind: e.tags.place ?? 'town' }]
      : [],
  );
}

function imageFromTags(tags: Record<string, string>): string | undefined {
  const commons = tags.wikimedia_commons?.match(/^File:(.+)$/)?.[1];
  if (commons) return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commons)}?width=1024`;
  const image = toSafeUrl(tags.image);
  return image && /\.(jpe?g|png|webp)(\?|$)/i.test(image) ? image : undefined;
}

export function parsePlaces(json: unknown, typeId: string, fallbackCity?: string): DiscoveredPlace[] {
  return elements(json).flatMap((e) => {
    const tags = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!tags.name || typeof lat !== 'number' || typeof lon !== 'number' || typeof e.id !== 'number' || !e.type) return [];
    const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
    const city = tags['addr:city'] ?? fallbackCity;
    const address = [street, [tags['addr:postcode'], city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return [
      {
        id: `osm-${e.type}-${e.id}`,
        name: tags.name,
        typeId,
        lat,
        lon,
        address: address || undefined,
        city,
        cuisine: tags.cuisine?.split(';').map((c) => c.replace(/_/g, ' ')).join(', '),
        website: toSafeUrl(tags.website ?? tags['contact:website']),
        imageUrl: imageFromTags(tags),
        osmUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`,
      },
    ];
  });
}

/** POSTs a query, trying a mirror if the main server is busy. */
export async function runOverpass(query: string, signal?: AbortSignal): Promise<unknown> {
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }), signal });
      if (response.ok) return await response.json();
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  throw new DiscoverError('OpenStreetMap ist gerade nicht erreichbar. Bitte gleich nochmal versuchen.');
}
