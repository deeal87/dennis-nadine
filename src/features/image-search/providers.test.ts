import { describe, expect, it } from 'vitest';
import { jikanSearchUrl, legoSetImages, parseAniList, parseCommons, parseJikan, parseMealDb, parseWikipedia } from './providers';

describe('anime cover providers', () => {
  it('parses Jikan results with episodes and genres', () => {
    const [first] = parseJikan({
      data: [
        {
          title: 'Sen to Chihiro no Kamikakushi',
          title_english: 'Spirited Away',
          year: 2001,
          episodes: 1,
          genres: [{ name: 'Adventure' }],
          images: { webp: { large_image_url: 'https://cdn.myanimelist.net/l.webp', image_url: 'https://cdn.myanimelist.net/s.webp' } },
        },
        { title: 'Kein Bild', images: {} },
      ],
    });
    expect(first).toEqual({
      url: 'https://cdn.myanimelist.net/l.webp',
      thumbUrl: 'https://cdn.myanimelist.net/s.webp',
      title: 'Spirited Away · 2001',
      source: 'MyAnimeList',
      meta: { episodes: 1, genres: ['Adventure'] },
    });
    expect(parseJikan({ data: 'nope' })).toEqual([]);
    expect(parseJikan(null)).toEqual([]);
  });

  it('parses AniList results', () => {
    const result = parseAniList({ data: { Page: { media: [{ title: { romaji: 'Bubble' }, coverImage: { large: 'https://s4.anilist.co/b.jpg' }, genres: ['Romance'] }] } } });
    expect(result[0]).toMatchObject({ url: 'https://s4.anilist.co/b.jpg', title: 'Bubble', source: 'AniList' });
  });

  it('maps German titles to searchable international ones', () => {
    expect(jikanSearchUrl('Chihiros Reise ins Zauberland')).toContain('q=Spirited+Away');
    expect(jikanSearchUrl('Chihiros Reise ins Zauberland')).toContain('type=movie');
    expect(jikanSearchUrl('Naruto')).toContain('q=Naruto');
  });
});

describe('wiki & recipe providers', () => {
  it('keeps only bitmap images from Commons, in search order', () => {
    const result = parseCommons({
      query: {
        pages: {
          '2': { index: 2, title: 'File:Ramen b.jpg', imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://upload.wikimedia.org/b.jpg' }] },
          '1': { index: 1, title: 'File:Ramen a.png', imageinfo: [{ mime: 'image/png', thumburl: 'https://upload.wikimedia.org/a.png' }] },
          '3': { index: 3, title: 'File:Doc.pdf', imageinfo: [{ mime: 'application/pdf', url: 'https://upload.wikimedia.org/doc.pdf' }] },
        },
      },
    });
    expect(result.map((r) => r.title)).toEqual(['Ramen a', 'Ramen b']);
  });

  it('parses Wikipedia page images', () => {
    expect(parseWikipedia({ query: { pages: { '9': { title: 'Kölner Dom', thumbnail: { source: 'https://upload.wikimedia.org/dom.jpg' } } } } })[0]).toMatchObject({
      title: 'Kölner Dom',
      source: 'Wikipedia',
    });
  });

  it('parses TheMealDB meals', () => {
    expect(parseMealDb({ meals: [{ strMeal: 'Ramen', strMealThumb: 'https://www.themealdb.com/r.jpg' }] })[0]).toMatchObject({
      url: 'https://www.themealdb.com/r.jpg',
      thumbUrl: 'https://www.themealdb.com/r.jpg/preview',
    });
    expect(parseMealDb({ meals: null })).toEqual([]);
  });

  it('never accepts non-http image urls', () => {
    expect(parseMealDb({ meals: [{ strMeal: 'x', strMealThumb: 'javascript:alert(1)' }] })).toEqual([]);
  });
});

describe('LEGO set images', () => {
  it('builds official image urls from the set number', () => {
    expect(legoSetImages('10280', 'Blumenstrauß').map((c) => c.url)).toEqual([
      'https://cdn.rebrickable.com/media/sets/10280-1.jpg',
      'https://images.brickset.com/sets/images/10280-1.jpg',
    ]);
    expect(legoSetImages('75192-2')[0]?.url).toContain('75192-2.jpg');
    expect(legoSetImages('abc')).toEqual([]);
    expect(legoSetImages(undefined)).toEqual([]);
  });
});
