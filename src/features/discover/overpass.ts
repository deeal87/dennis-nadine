/**
 * OpenStreetMap place lookups via Overpass (fallback source, more complete but
 * often overloaded) plus the shared place model. Query builders and parsers
 * are pure so they can be tested offline.
 */
import { toSafeUrl } from '@/lib/url';
import type { DiscoverType } from './config';

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

/** The public mirrors currently hang, so only the main server is used – with a timeout. */
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 12_000;

export class DiscoverError extends Error {}

/** Search radius around the town centre, in metres. */
export function radiusFor(kind: string): number {
  return kind === 'city' ? 8000 : kind === 'town' ? 5000 : 3000;
}

function tagFilter(key: string, values: string[]): string {
  return values.length === 1 ? `["${key}"="${values[0]}"]` : `["${key}"~"^(${values.join('|')})$"]`;
}

export function buildPlacesQuery(type: DiscoverType, town: Pick<Town, 'lat' | 'lon' | 'kind'>): string {
  const around = `(around:${radiusFor(town.kind)},${town.lat.toFixed(5)},${town.lon.toFixed(5)})`;
  const parts = type.osm.map(({ key, values }) => `nwr${tagFilter(key, values)}["name"]${around};`).join('');
  return `[out:json][timeout:20];(${parts});out center tags 300;`;
}

type Element = { type?: string; id?: number; lat?: number; lon?: number; center?: { lat?: number; lon?: number }; tags?: Record<string, string> };

function elements(json: unknown): Element[] {
  const list = (json as { elements?: unknown } | null)?.elements;
  return Array.isArray(list) ? (list as Element[]) : [];
}

/** Links an external abort signal with a timeout. */
export function timeoutSignal(ms: number, outer?: AbortSignal): { signal: AbortSignal; done: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  const onAbort = () => controller.abort();
  outer?.addEventListener('abort', onAbort);
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      outer?.removeEventListener('abort', onAbort);
    },
  };
}

function imageFromTags(tags: Record<string, string | undefined>): string | undefined {
  const commons = tags.wikimedia_commons?.match(/^File:(.+)$/)?.[1];
  if (commons) return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commons)}?width=1024`;
  const image = toSafeUrl(tags.image);
  return image && /\.(jpe?g|png|webp)(\?|$)/i.test(image) ? image : undefined;
}

export interface PlaceInput {
  osmType: string;
  osmId: number;
  name: string;
  lat: number;
  lon: number;
  street?: string;
  houseNumber?: string;
  postcode?: string;
  city?: string;
  /** Extra OSM tags: cuisine, website, image, wikimedia_commons … */
  tags: Record<string, string | undefined>;
}

/** Shared place builder for Overpass and Nominatim results. */
export function toDiscoveredPlace(input: PlaceInput, typeId: string): DiscoveredPlace {
  const street = [input.street, input.houseNumber].filter(Boolean).join(' ');
  const address = [street, [input.postcode, input.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return {
    id: `osm-${input.osmType}-${input.osmId}`,
    name: input.name,
    typeId,
    lat: input.lat,
    lon: input.lon,
    address: address || undefined,
    city: input.city,
    cuisine: input.tags.cuisine?.split(';').map((c) => c.replace(/_/g, ' ')).join(', '),
    website: toSafeUrl(input.tags.website ?? input.tags['contact:website']),
    imageUrl: imageFromTags(input.tags),
    osmUrl: `https://www.openstreetmap.org/${input.osmType}/${input.osmId}`,
  };
}

export function parsePlaces(json: unknown, typeId: string, fallbackCity?: string): DiscoveredPlace[] {
  return elements(json).flatMap((e) => {
    const tags = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!tags.name || typeof lat !== 'number' || typeof lon !== 'number' || typeof e.id !== 'number' || !e.type) return [];
    return [
      toDiscoveredPlace(
        {
          osmType: e.type,
          osmId: e.id,
          name: tags.name,
          lat,
          lon,
          street: tags['addr:street'],
          houseNumber: tags['addr:housenumber'],
          postcode: tags['addr:postcode'],
          city: tags['addr:city'] ?? fallbackCity,
          tags,
        },
        typeId,
      ),
    ];
  });
}

/** One POST with a timeout. Resolves to null when the server is busy or unreachable. */
export async function runOverpass(query: string, signal?: AbortSignal): Promise<unknown> {
  const { signal: limited, done } = timeoutSignal(OVERPASS_TIMEOUT_MS, signal);
  try {
    const response = await fetch(OVERPASS_URL, { method: 'POST', body: new URLSearchParams({ data: query }), signal: limited });
    return response.ok ? await response.json() : null;
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  } finally {
    done();
  }
}
