/**
 * What can be discovered, and where. Add a type by appending to DISCOVER_TYPES –
 * `filters` are OpenStreetMap tag filters in Overpass syntax.
 */
import type { DateCategory, DateTag } from '@/types/models';

export interface DiscoverType {
  id: string;
  label: string;
  emoji: string;
  dateCategory: DateCategory;
  tags: DateTag[];
  filters: string[];
}

export const DISCOVER_TYPES: readonly DiscoverType[] = [
  { id: 'restaurant', label: 'Restaurant', emoji: '🍜', dateCategory: 'restaurant', tags: ['food'], filters: ['["amenity"="restaurant"]'] },
  { id: 'cafe', label: 'Café & Eis', emoji: '☕', dateCategory: 'restaurant', tags: ['food', 'cheap'], filters: ['["amenity"~"^(cafe|ice_cream)$"]'] },
  { id: 'bar', label: 'Bar & Cocktails', emoji: '🍸', dateCategory: 'restaurant', tags: ['romantic'], filters: ['["amenity"~"^(bar|pub)$"]'] },
  {
    id: 'activity',
    label: 'Aktivität',
    emoji: '🎢',
    dateCategory: 'activity',
    tags: ['indoor'],
    filters: [
      '["tourism"~"^(theme_park|zoo|aquarium)$"]',
      '["leisure"~"^(water_park|escape_game|miniature_golf|bowling_alley|ice_rink|trampoline_park)$"]',
      '["amenity"~"^(cinema|theatre)$"]',
    ],
  },
  {
    id: 'sight',
    label: 'Sehenswürdigkeit',
    emoji: '🏰',
    dateCategory: 'place',
    tags: [],
    filters: ['["tourism"~"^(attraction|museum|viewpoint|gallery)$"]', '["historic"~"^(castle|monument)$"]'],
  },
  {
    id: 'nature',
    label: 'Natur & Parks',
    emoji: '🌳',
    dateCategory: 'place',
    tags: ['outdoor', 'cheap'],
    filters: ['["leisure"~"^(park|garden|nature_reserve)$"]', '["tourism"="picnic_site"]', '["natural"="beach"]'],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    emoji: '🧖',
    dateCategory: 'activity',
    tags: ['romantic', 'special'],
    filters: ['["leisure"~"^(sauna|spa)$"]', '["amenity"="public_bath"]'],
  },
  { id: 'stay', label: 'Übernachtung', emoji: '🏨', dateCategory: 'stay', tags: ['special'], filters: ['["tourism"~"^(hotel|guest_house)$"]'] },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', dateCategory: 'shopping', tags: ['indoor'], filters: ['["shop"~"^(mall|department_store)$"]'] },
];

export interface Region {
  code: string;
  name: string;
  /** City states: use districts as starting points instead of towns. */
  cityState?: boolean;
}

export const REGIONS: readonly Region[] = [
  { code: 'DE-BW', name: 'Baden-Württemberg' },
  { code: 'DE-BY', name: 'Bayern' },
  { code: 'DE-BE', name: 'Berlin', cityState: true },
  { code: 'DE-BB', name: 'Brandenburg' },
  { code: 'DE-HB', name: 'Bremen', cityState: true },
  { code: 'DE-HH', name: 'Hamburg', cityState: true },
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
