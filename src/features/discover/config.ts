/**
 * What can be discovered, and where. Add a type by appending to DISCOVER_TYPES –
 * `filters` are OpenStreetMap tag filters in Overpass syntax.
 */
import type { DateCategory, DateTag } from '@/types/models';

/** An OpenStreetMap tag: key plus accepted values. */
export interface OsmTag {
  key: string;
  values: string[];
}

export interface DiscoverType {
  id: string;
  label: string;
  emoji: string;
  dateCategory: DateCategory;
  tags: DateTag[];
  /** What counts as a match (used for Overpass and to check Nominatim results). */
  osm: OsmTag[];
  /** Nominatim search phrases (verified to return the matching OSM objects). */
  searchTerms: string[];
}

export const DISCOVER_TYPES: readonly DiscoverType[] = [
  {
    id: 'restaurant',
    label: 'Restaurant',
    emoji: '🍜',
    dateCategory: 'restaurant',
    tags: ['food'],
    osm: [{ key: 'amenity', values: ['restaurant'] }],
    searchTerms: ['restaurant'],
  },
  {
    id: 'cafe',
    label: 'Café & Eis',
    emoji: '☕',
    dateCategory: 'restaurant',
    tags: ['food', 'cheap'],
    osm: [{ key: 'amenity', values: ['cafe', 'ice_cream'] }],
    searchTerms: ['cafe', 'Café', 'ice cream'],
  },
  {
    id: 'bar',
    label: 'Bar & Cocktails',
    emoji: '🍸',
    dateCategory: 'restaurant',
    tags: ['romantic'],
    osm: [{ key: 'amenity', values: ['bar', 'pub'] }],
    searchTerms: ['bar'],
  },
  {
    id: 'activity',
    label: 'Aktivität',
    emoji: '🎢',
    dateCategory: 'activity',
    tags: ['indoor'],
    osm: [
      { key: 'tourism', values: ['theme_park', 'zoo', 'aquarium'] },
      { key: 'leisure', values: ['water_park', 'escape_game', 'miniature_golf', 'bowling_alley', 'ice_rink', 'trampoline_park'] },
      { key: 'amenity', values: ['cinema', 'theatre'] },
    ],
    searchTerms: ['cinema', 'Kino', 'zoo', 'bowling', 'theatre', 'escape room', 'minigolf'],
  },
  {
    id: 'sight',
    label: 'Sehenswürdigkeit',
    emoji: '🏰',
    dateCategory: 'place',
    tags: [],
    osm: [
      { key: 'tourism', values: ['attraction', 'museum', 'viewpoint', 'gallery'] },
      { key: 'historic', values: ['castle', 'monument'] },
    ],
    searchTerms: ['attraction', 'museum', 'viewpoint', 'castle'],
  },
  {
    id: 'nature',
    label: 'Natur & Parks',
    emoji: '🌳',
    dateCategory: 'place',
    tags: ['outdoor', 'cheap'],
    osm: [
      { key: 'leisure', values: ['park', 'garden', 'nature_reserve'] },
      { key: 'tourism', values: ['picnic_site'] },
      { key: 'natural', values: ['beach'] },
    ],
    searchTerms: ['park', 'garden', 'nature reserve'],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    emoji: '🧖',
    dateCategory: 'activity',
    tags: ['romantic', 'special'],
    osm: [
      { key: 'leisure', values: ['sauna', 'spa', 'water_park'] },
      { key: 'amenity', values: ['public_bath'] },
    ],
    searchTerms: ['sauna', 'Therme', 'spa'],
  },
  {
    id: 'stay',
    label: 'Übernachtung',
    emoji: '🏨',
    dateCategory: 'stay',
    tags: ['special'],
    osm: [{ key: 'tourism', values: ['hotel', 'guest_house'] }],
    searchTerms: ['hotel', 'guest house'],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    emoji: '🛍️',
    dateCategory: 'shopping',
    tags: ['indoor'],
    osm: [{ key: 'shop', values: ['mall', 'department_store'] }],
    searchTerms: ['Einkaufszentrum', 'department store'],
  },
];

/** Does an OSM object (class/key + type/value) belong to this discover type? */
export function matchesType(type: DiscoverType, key: string, value: string): boolean {
  return type.osm.some((tag) => tag.key === key && tag.values.includes(value));
}

export interface Region {
  code: string;
  name: string;
}

export const REGIONS: readonly Region[] = [
  { code: 'DE-BW', name: 'Baden-Württemberg' },
  { code: 'DE-BY', name: 'Bayern' },
  { code: 'DE-BE', name: 'Berlin' },
  { code: 'DE-BB', name: 'Brandenburg' },
  { code: 'DE-HB', name: 'Bremen' },
  { code: 'DE-HH', name: 'Hamburg' },
  { code: 'DE-HE', name: 'Hessen' },
  { code: 'DE-MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'DE-NI', name: 'Niedersachsen' },
  { code: 'DE-NW', name: 'Nordrhein-Westfalen' },
  { code: 'DE-RP', name: 'Rheinland-Pfalz' },
  { code: 'DE-SL', name: 'Saarland' },
  { code: 'DE-SN', name: 'Sachsen' },
  { code: 'DE-ST', name: 'Sachsen-Anhalt' },
  { code: 'DE-SH', name: 'Schleswig-Holstein' },
  { code: 'DE-TH', name: 'Thüringen' },
];

export const DEFAULT_REGION = 'DE-NW';
