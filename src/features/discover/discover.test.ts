import { describe, expect, it } from 'vitest';
import { DISCOVER_TYPES, REGIONS } from './config';
import { buildPlacesQuery, parsePlaces, radiusFor } from './overpass';
import { geocodeParams, parseGeocode, parseNominatimPlaces, placeSearchParams, viewboxAround } from './nominatim';
import { townsOf } from './towns';
import { freshPlaces } from './discover';

const nrw = REGIONS.find((r) => r.code === 'DE-NW')!;
const restaurant = DISCOVER_TYPES.find((t) => t.id === 'restaurant')!;

describe('overpass queries', () => {
  it('has starting towns inside Germany for every state', () => {
    for (const region of REGIONS) {
      const towns = townsOf(region.code);
      expect(towns.length, region.name).toBeGreaterThanOrEqual(6);
      for (const t of towns) {
        expect(t.lat).toBeGreaterThan(47.2);
        expect(t.lat).toBeLessThan(55.1);
        expect(t.lon).toBeGreaterThan(5.8);
        expect(t.lon).toBeLessThan(15.1);
      }
    }
    expect(townsOf('DE-BE').every((t) => t.kind === 'suburb')).toBe(true);
    expect(townsOf('XX')).toEqual([]);
  });

  it('geocodes a city within the state via Nominatim', () => {
    expect(geocodeParams(' Kempen ', nrw).q).toBe('Kempen, Nordrhein-Westfalen');
    expect(parseGeocode([{ place_id: 5, name: 'Kempen', lat: '51.36', lon: '6.42', addresstype: 'town' }])).toEqual({
      id: 5,
      name: 'Kempen',
      lat: 51.36,
      lon: 6.42,
      kind: 'town',
    });
    expect(parseGeocode([{ lat: '52.5', lon: '13.4', addresstype: 'suburb', name: 'Kreuzberg' }])?.kind).toBe('suburb');
    expect(parseGeocode([])).toBeUndefined();
  });

  it('searches every filter of a type around the town', () => {
    const activity = DISCOVER_TYPES.find((t) => t.id === 'activity')!;
    const query = buildPlacesQuery(activity, { lat: 51.2277, lon: 6.7735, kind: 'city' });
    expect(query.match(/nwr\[/g)).toHaveLength(activity.osm.length);
    expect(query).toContain('["amenity"~"^(cinema|theatre)$"]');
    expect(query).toContain('(around:8000,51.22770,6.77350)');
    expect(radiusFor('village')).toBeLessThan(radiusFor('town'));
    expect(buildPlacesQuery(restaurant, { lat: 1, lon: 2, kind: 'town' })).toContain('["amenity"="restaurant"]["name"]');
  });

  it('has 16 states and unique type ids', () => {
    expect(REGIONS).toHaveLength(16);
    expect(new Set(DISCOVER_TYPES.map((t) => t.id)).size).toBe(DISCOVER_TYPES.length);
  });
});

describe('overpass parsing', () => {

  it('parses places with address, cuisine and image', () => {
    const [place] = parsePlaces(
      {
        elements: [
          {
            type: 'way',
            id: 42,
            center: { lat: 51.2, lon: 6.7 },
            tags: {
              name: 'Takumi',
              cuisine: 'japanese;ramen',
              'addr:street': 'Immermannstraße',
              'addr:housenumber': '28',
              'addr:postcode': '40210',
              wikimedia_commons: 'File:Takumi Ramen.jpg',
              website: 'takumi.example',
            },
          },
          { type: 'node', id: 1, lat: 1, lon: 1, tags: {} },
        ],
      },
      'restaurant',
      'Düsseldorf',
    );
    expect(place).toMatchObject({
      id: 'osm-way-42',
      name: 'Takumi',
      address: 'Immermannstraße 28, 40210 Düsseldorf',
      city: 'Düsseldorf',
      cuisine: 'japanese, ramen',
      website: 'https://takumi.example/',
      osmUrl: 'https://www.openstreetmap.org/way/42',
    });
    expect(place?.imageUrl).toBe('https://commons.wikimedia.org/wiki/Special:FilePath/Takumi%20Ramen.jpg?width=1024');
  });

  it('skips known and already shown places', () => {
    const places = parsePlaces(
      { elements: ['A', 'Béla', 'C'].map((name, id) => ({ type: 'node', id, lat: 1, lon: 1, tags: { name } })) },
      'restaurant',
    );
    expect(freshPlaces(places, ['bela'], new Set(['osm-node-2'])).map((p) => p.name)).toEqual(['A']);
  });
});

describe('nominatim places', () => {
  const town = { lat: 51.23, lon: 6.77, kind: 'city' };

  it('searches a bounded viewbox around the town', () => {
    const [left, top, right, bottom] = viewboxAround(town).split(',').map(Number);
    expect(left).toBeLessThan(6.77);
    expect(right).toBeGreaterThan(6.77);
    expect(top).toBeGreaterThan(51.23);
    expect(bottom).toBeLessThan(51.23);
    expect(top! - bottom!).toBeCloseTo((2 * 8000) / 111_320, 3);
    expect(placeSearchParams('restaurant', town)).toMatchObject({ q: 'restaurant', bounded: '1', extratags: '1' });
  });

  it('keeps only named places of the requested kind', () => {
    const zooType = DISCOVER_TYPES.find((t) => t.id === 'activity')!;
    const places = parseNominatimPlaces(
      [
        { osm_type: 'way', osm_id: 1, name: 'Aquazoo', lat: '51.25', lon: '6.76', category: 'tourism', type: 'zoo', address: { road: 'Kaiserswerther Str.', house_number: '380', postcode: '40474', city: 'Düsseldorf' }, extratags: { website: 'https://duesseldorf.de/aquazoo' } },
        { osm_type: 'node', osm_id: 2, name: 'Düsseldorf Zoo', lat: '51.2', lon: '6.8', category: 'railway', type: 'halt' },
        { osm_type: 'node', osm_id: 3, name: '', lat: '51.2', lon: '6.8', category: 'amenity', type: 'cinema' },
      ],
      zooType,
      'Düsseldorf',
    );
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ id: 'osm-way-1', name: 'Aquazoo', address: 'Kaiserswerther Str. 380, 40474 Düsseldorf', typeId: 'activity' });
    expect(parseNominatimPlaces(null, zooType)).toEqual([]);
  });

  it('has verified search terms for every type', () => {
    for (const type of DISCOVER_TYPES) expect(type.searchTerms.length, type.id).toBeGreaterThan(0);
  });
});
