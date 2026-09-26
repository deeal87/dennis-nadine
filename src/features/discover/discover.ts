/**
 * "Neu entdecken": pick a random town in the chosen state, look for matching
 * places around it and return one we don't know yet. Results are cached for
 * the session, so spinning again is instant and never repeats a place.
 */
import { normalizeText } from '@/lib/text';
import { pickRandom, type RandomSource } from '@/lib/random';
import { DISCOVER_TYPES, REGIONS, type DiscoverType } from './config';
import { buildPlacesQuery, buildTownsQuery, parsePlaces, parseTowns, runOverpass, type DiscoveredPlace, type Town } from './overpass';

export interface DiscoverOptions {
  typeId: string;
  regionCode: string;
  city?: string;
  /** Names of places we already know (our dates). */
  knownNames: readonly string[];
  random?: RandomSource;
  signal?: AbortSignal;
}

const MAX_TOWN_ATTEMPTS = 4;
const townCache = new Map<string, Town[]>();
const placeCache = new Map<string, DiscoveredPlace[]>();
const shown = new Set<string>();

async function townsFor(regionCode: string, city: string | undefined, signal?: AbortSignal): Promise<Town[]> {
  const region = REGIONS.find((r) => r.code === regionCode);
  if (!region) return [];
  const key = `${regionCode}|${normalizeText(city ?? '')}`;
  let towns = townCache.get(key);
  if (!towns) {
    towns = parseTowns(await runOverpass(buildTownsQuery(region, city), signal));
    townCache.set(key, towns);
  }
  return towns;
}

async function placesAround(type: DiscoverType, town: Town, signal?: AbortSignal): Promise<DiscoveredPlace[]> {
  const key = `${type.id}|${town.id}`;
  let places = placeCache.get(key);
  if (!places) {
    places = parsePlaces(await runOverpass(buildPlacesQuery(type, town), signal), type.id, town.name);
    placeCache.set(key, places);
  }
  return places;
}

/** Filters out known and already shown places (pure, exported for tests). */
export function freshPlaces(places: readonly DiscoveredPlace[], knownNames: readonly string[], alreadyShown: ReadonlySet<string>): DiscoveredPlace[] {
  const known = new Set(knownNames.map(normalizeText));
  return places.filter((p) => !known.has(normalizeText(p.name)) && !alreadyShown.has(p.id));
}

export async function discoverPlace({ typeId, regionCode, city, knownNames, random, signal }: DiscoverOptions): Promise<DiscoveredPlace | undefined> {
  const type = DISCOVER_TYPES.find((t) => t.id === typeId) ?? DISCOVER_TYPES[0]!;
  const towns = await townsFor(regionCode, city, signal);
  const candidates = [...towns];
  for (let attempt = 0; attempt < MAX_TOWN_ATTEMPTS && candidates.length > 0; attempt++) {
    const town = pickRandom(candidates, random)!;
    candidates.splice(candidates.indexOf(town), 1);
    const place = pickRandom(freshPlaces(await placesAround(type, town, signal), knownNames, shown), random);
    if (place) {
      shown.add(place.id);
      return place;
    }
  }
  return undefined;
}
