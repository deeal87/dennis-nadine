/**
 * "Neu entdecken": pick a random starting town in the chosen state (or the
 * given city) and return a matching place there that we don't know yet.
 * Nominatim is asked first (fast); Overpass is the fallback. Results are
 * cached for the session, so spinning again is quick and never repeats.
 */
import { normalizeText } from '@/lib/text';
import { pickRandom, type RandomSource } from '@/lib/random';
import { DISCOVER_TYPES, REGIONS, type DiscoverType } from './config';
import { buildPlacesQuery, DiscoverError, parsePlaces, runOverpass, type DiscoveredPlace, type Town } from './overpass';
import { geocodeCity, searchPlaces } from './nominatim';
import { townsOf } from './towns';

export interface DiscoverOptions {
  typeId: string;
  regionCode: string;
  city?: string;
  /** Names of places we already know (our dates). */
  knownNames: readonly string[];
  random?: RandomSource;
  signal?: AbortSignal;
}

const MAX_TOWN_ATTEMPTS = 3;
const cityCache = new Map<string, Town | undefined>();
const placeCache = new Map<string, DiscoveredPlace[]>();
const shown = new Set<string>();

async function townsFor(regionCode: string, city: string | undefined, signal?: AbortSignal): Promise<Town[]> {
  const region = REGIONS.find((r) => r.code === regionCode);
  if (!region) return [];
  const starts = townsOf(regionCode);
  if (!city?.trim()) return starts;
  const known = starts.find((t) => normalizeText(t.name) === normalizeText(city));
  if (known) return [known];
  const key = `${regionCode}|${normalizeText(city)}`;
  if (!cityCache.has(key)) cityCache.set(key, await geocodeCity(city, region, signal));
  const found = cityCache.get(key);
  if (!found) throw new DiscoverError(`„${city.trim()}“ haben wir in ${region.name} nicht gefunden.`);
  return [found];
}

/** Filters out known and already shown places (pure, exported for tests). */
export function freshPlaces(places: readonly DiscoveredPlace[], knownNames: readonly string[], alreadyShown: ReadonlySet<string>): DiscoveredPlace[] {
  const known = new Set(knownNames.map(normalizeText));
  return places.filter((p) => !known.has(normalizeText(p.name)) && !alreadyShown.has(p.id));
}

/** Nominatim results around a town (cached). null = the source did not answer. */
async function nominatimAround(type: DiscoverType, town: Town, random: RandomSource | undefined, signal?: AbortSignal): Promise<DiscoveredPlace[] | null> {
  const key = `nominatim|${type.id}|${town.lat},${town.lon}`;
  const cached = placeCache.get(key);
  if (cached) return cached;
  const term = pickRandom(type.searchTerms, random) ?? type.searchTerms[0]!;
  const places = await searchPlaces(type, term, town, signal);
  if (places === null) return null;
  placeCache.set(key, places);
  return places;
}

/** Overpass is more complete but often overloaded – only asked when Nominatim has nothing new. */
async function overpassAround(type: DiscoverType, town: Town, signal?: AbortSignal): Promise<DiscoveredPlace[] | null> {
  const key = `overpass|${type.id}|${town.lat},${town.lon}`;
  const cached = placeCache.get(key);
  if (cached) return cached;
  const json = await runOverpass(buildPlacesQuery(type, town), signal);
  if (!json) return null;
  const places = parsePlaces(json, type.id, town.name);
  placeCache.set(key, places);
  return places;
}

export async function discoverPlace({ typeId, regionCode, city, knownNames, random, signal }: DiscoverOptions): Promise<DiscoveredPlace | undefined> {
  const type = DISCOVER_TYPES.find((t) => t.id === typeId) ?? DISCOVER_TYPES[0]!;
  const candidates = [...(await townsFor(regionCode, city, signal))];
  let anyAnswer = false;
  for (let attempt = 0; attempt < MAX_TOWN_ATTEMPTS && candidates.length > 0; attempt++) {
    const town = pickRandom(candidates, random)!;
    candidates.splice(candidates.indexOf(town), 1);
    for (const source of [() => nominatimAround(type, town, random, signal), () => overpassAround(type, town, signal)]) {
      const places = await source();
      if (places === null) continue;
      anyAnswer = true;
      const place = pickRandom(freshPlaces(places, knownNames, shown), random);
      if (place) {
        shown.add(place.id);
        return place;
      }
    }
  }
  if (!anyAnswer) throw new DiscoverError('OpenStreetMap ist gerade nicht erreichbar. Bitte gleich nochmal versuchen.');
  return undefined;
}
