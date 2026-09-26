import { describe, expect, it } from 'vitest';
import { DISCOVER_TYPES, REGIONS } from './config';
import { buildPlacesQuery, buildTownsQuery, parsePlaces, parseTowns, radiusFor } from './overpass';
import { freshPlaces } from './discover';

const nrw = REGIONS.find((r) => r.code === 'DE-NW')!;
const restaurant = DISCOVER_TYPES.find((t) => t.id === 'restaurant')!;

describe('overpass queries', () => {
  it('looks up towns inside the chosen state', () => {
    const query = buildTownsQuery(nrw);
    expect(query).toContain('area["ISO3166-2"="DE-NW"]["admin_level"="4"]');
    expect(query).toContain('"^(city|town)$"');
  });

  it('can target one city and escapes regex characters', () => {
    expect(buildTownsQuery(nrw, 'Köln')).toContain('["name"~"^Köln$",i]');
    expect(buildTownsQuery(nrw, 'a.b(c)')).toContain('a\\.b\\(c\\)');
  });

  it('uses districts in city states', () => {
    expect(buildTownsQuery(REGIONS.find((r) => r.code === 'DE-BE')!)).toContain('suburb');
  });

  it('searches every filter of a type around the town', () => {
    const activity = DISCOVER_TYPES.find((t) => t.id === 'activity')!;
    const query = buildPlacesQuery(activity, { lat: 51.2277, lon: 6.7735, kind: 'city' });
    expect(query.match(/nwr\[/g)).toHaveLength(activity.filters.length);
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
  it('parses towns', () => {
    expect(parseTowns({ elements: [{ type: 'node', id: 1, lat: 51, lon: 6, tags: { name: 'Düsseldorf', place: 'city' } }, { id: 2 }] })).toEqual([
      { id: 1, name: 'Düsseldorf', lat: 51, lon: 6, kind: 'city' },
    ]);
  });

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
