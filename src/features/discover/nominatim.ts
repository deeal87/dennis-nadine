/**
 * Nominatim (OpenStreetMap search): fast and reliable, used as the primary
 * source for "Neu entdecken" and to locate an optional city. Special phrases
 * like "restaurant" combined with a bounded viewbox return matching places.
 * Usage policy: max. 1 request per second – one search per spin is well below.
 */
import { matchesType, type DiscoverType, type Region } from './config';
import { radiusFor, timeoutSignal, toDiscoveredPlace, type DiscoveredPlace, type Town } from './overpass';

const BASE = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 10_000;
const MIN_GAP_MS = 1100;
let lastRequest = 0;

async function search(params: Record<string, string>, signal?: AbortSignal): Promise<unknown> {
  const wait = lastRequest + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequest = Date.now();
  const { signal: limited, done } = timeoutSignal(TIMEOUT_MS, signal);
  try {
    const query = new URLSearchParams({ format: 'jsonv2', countrycodes: 'de', 'accept-language': 'de', ...params });
    const response = await fetch(`${BASE}?${query}`, { signal: limited, headers: { Accept: 'application/json' } });
    return response.ok ? await response.json() : null;
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  } finally {
    done();
  }
}

// ---------- City lookup ----------

export function geocodeParams(city: string, region: Region): Record<string, string> {
  return { limit: '1', q: `${city.trim()}, ${region.name}` };
}

export function parseGeocode(json: unknown): Town | undefined {
  const hit = Array.isArray(json) ? (json[0] as Record<string, unknown> | undefined) : undefined;
  const lat = Number(hit?.lat);
  const lon = Number(hit?.lon);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
  const type = String(hit.addresstype ?? hit.type ?? '');
  const kind = type === 'city' ? 'city' : ['suburb', 'quarter', 'neighbourhood', 'city_district', 'borough'].includes(type) ? 'suburb' : 'town';
  return { id: Number(hit.place_id) || 0, name: String(hit.name ?? ''), lat, lon, kind };
}

export async function geocodeCity(city: string, region: Region, signal?: AbortSignal): Promise<Town | undefined> {
  return parseGeocode(await search(geocodeParams(city, region), signal));
}

// ---------- Places around a town ----------

/** Nominatim viewbox "left,top,right,bottom" covering the town's search radius. */
export function viewboxAround(town: Pick<Town, 'lat' | 'lon' | 'kind'>): string {
  const radius = radiusFor(town.kind);
  const dLat = radius / 111_320;
  const dLon = radius / (111_320 * Math.cos((town.lat * Math.PI) / 180));
  return [town.lon - dLon, town.lat + dLat, town.lon + dLon, town.lat - dLat].map((n) => n.toFixed(5)).join(',');
}

export function placeSearchParams(term: string, town: Pick<Town, 'lat' | 'lon' | 'kind'>): Record<string, string> {
  return { q: term, limit: '40', addressdetails: '1', extratags: '1', viewbox: viewboxAround(town), bounded: '1' };
}

type Hit = {
  osm_type?: string;
  osm_id?: number;
  name?: string;
  lat?: string;
  lon?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string> | null;
};

export function parseNominatimPlaces(json: unknown, type: DiscoverType, fallbackCity?: string): DiscoveredPlace[] {
  if (!Array.isArray(json)) return [];
  return (json as Hit[]).flatMap((hit) => {
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    if (!hit.name || !hit.osm_type || typeof hit.osm_id !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    if (!matchesType(type, hit.category ?? '', hit.type ?? '')) return [];
    const address = hit.address ?? {};
    return [
      toDiscoveredPlace(
        {
          osmType: hit.osm_type,
          osmId: hit.osm_id,
          name: hit.name,
          lat,
          lon,
          street: address.road ?? address.pedestrian,
          houseNumber: address.house_number,
          postcode: address.postcode,
          city: address.city ?? address.town ?? address.village ?? fallbackCity,
          tags: hit.extratags ?? {},
        },
        type.id,
      ),
    ];
  });
}

/** Resolves to null when Nominatim did not answer. */
export async function searchPlaces(type: DiscoverType, term: string, town: Town, signal?: AbortSignal): Promise<DiscoveredPlace[] | null> {
  const json = await search(placeSearchParams(term, town), signal);
  return json === null ? null : parseNominatimPlaces(json, type, town.name);
}
