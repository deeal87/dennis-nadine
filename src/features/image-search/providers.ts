/**
 * Keyless, CORS-enabled public image sources. Every provider is best effort:
 * network errors, rate limits or odd responses resolve to an empty list.
 * Parsers are exported separately so they can be tested without network.
 */
import { toSafeUrl } from '@/lib/url';
import { normalizeText } from '@/lib/text';

export interface ImageCandidate {
  /** Full-size image to store. */
  url: string;
  /** Smaller preview for the picker grid. */
  thumbUrl: string;
  title: string;
  /** Human readable source for attribution. */
  source: string;
  /** Optional extra data (anime: episodes & genres). */
  meta?: { episodes?: number; genres?: string[] };
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const at = (v: unknown, ...path: string[]): unknown => path.reduce<unknown>((acc, key) => (isObject(acc) ? acc[key] : undefined), v);

function candidate(url: unknown, thumb: unknown, title: string, source: string, meta?: ImageCandidate['meta']): ImageCandidate[] {
  const safe = toSafeUrl(str(url));
  if (!safe) return [];
  return [{ url: safe, thumbUrl: toSafeUrl(str(thumb)) ?? safe, title, source, ...(meta ? { meta } : {}) }];
}

async function getJson(url: string, signal?: AbortSignal, init?: RequestInit): Promise<unknown> {
  try {
    const response = await fetch(url, { ...init, signal });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

// ---------- Anime: Jikan (MyAnimeList) with AniList fallback ----------

export function parseJikan(json: unknown): ImageCandidate[] {
  return list(at(json, 'data')).flatMap((item) => {
    const title = str(at(item, 'title_english')) ?? str(at(item, 'title')) ?? 'Anime';
    const genres = list(at(item, 'genres')).flatMap((g) => str(at(g, 'name')) ?? []);
    return candidate(
      at(item, 'images', 'webp', 'large_image_url') ?? at(item, 'images', 'jpg', 'large_image_url'),
      at(item, 'images', 'webp', 'image_url') ?? at(item, 'images', 'jpg', 'image_url'),
      [title, num(at(item, 'year'))].filter(Boolean).join(' · '),
      'MyAnimeList',
      { episodes: num(at(item, 'episodes')), genres },
    );
  });
}

export function parseAniList(json: unknown): ImageCandidate[] {
  return list(at(json, 'data', 'Page', 'media')).flatMap((item) => {
    const title = str(at(item, 'title', 'english')) ?? str(at(item, 'title', 'romaji')) ?? 'Anime';
    const genres = list(at(item, 'genres')).flatMap((g) => str(g) ?? []);
    return candidate(
      at(item, 'coverImage', 'extraLarge') ?? at(item, 'coverImage', 'large'),
      at(item, 'coverImage', 'large'),
      [title, num(at(item, 'seasonYear'))].filter(Boolean).join(' · '),
      'AniList',
      { episodes: num(at(item, 'episodes')), genres },
    );
  });
}

const ANILIST_QUERY = `query ($search: String) {
  Page(perPage: 8) {
    media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
      title { romaji english } coverImage { extraLarge large } episodes genres seasonYear
    }
  }
}`;

/**
 * German titles MyAnimeList/AniList don't know – mapped to the international title
 * (and type, where the name alone is ambiguous).
 */
export const ANIME_SEARCH_ALIASES: Record<string, { q: string; type?: 'movie' | 'tv' }> = {
  'chihiros reise ins zauberland': { q: 'Spirited Away', type: 'movie' },
  'prinzessin mononoke': { q: 'Princess Mononoke', type: 'movie' },
  'die apothekerin': { q: 'Kusuriya no Hitorigoto' },
  bubble: { q: 'Bubble', type: 'movie' },
  'dragon ball': { q: 'Dragon Ball', type: 'tv' },
  'one piece': { q: 'One Piece', type: 'tv' },
  'das wandelnde schloss': { q: "Howl's Moving Castle", type: 'movie' },
  'mein nachbar totoro': { q: 'My Neighbor Totoro', type: 'movie' },
  'kikis kleiner lieferservice': { q: "Kiki's Delivery Service", type: 'movie' },
};

export function jikanSearchUrl(query: string): string {
  const alias = ANIME_SEARCH_ALIASES[normalizeText(query)];
  const params = new URLSearchParams({ sfw: 'true', limit: '8', q: alias?.q ?? query });
  if (alias?.type) params.set('type', alias.type);
  return `https://api.jikan.moe/v4/anime?${params}`;
}

export async function searchAnime(query: string, signal?: AbortSignal): Promise<ImageCandidate[]> {
  const jikan = parseJikan(await getJson(jikanSearchUrl(query), signal));
  if (jikan.length > 0) return jikan;
  return parseAniList(
    await getJson('https://graphql.anilist.co', signal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: ANIME_SEARCH_ALIASES[normalizeText(query)]?.q ?? query } }),
    }),
  );
}

// ---------- Wikimedia Commons & Wikipedia ----------

const IMAGE_MIME = /^image\/(jpeg|png|webp)$/;

export function parseCommons(json: unknown): ImageCandidate[] {
  const pages = Object.values(isObject(at(json, 'query', 'pages')) ? (at(json, 'query', 'pages') as Json) : {});
  return pages
    .sort((a, b) => (num(at(a, 'index')) ?? 0) - (num(at(b, 'index')) ?? 0))
    .flatMap((page) => {
      const info = list(at(page, 'imageinfo'))[0];
      if (!IMAGE_MIME.test(str(at(info, 'mime')) ?? '')) return [];
      const title = (str(at(page, 'title')) ?? '').replace(/^File:|^Datei:/, '').replace(/\.[a-z]+$/i, '');
      return candidate(at(info, 'thumburl') ?? at(info, 'url'), at(info, 'thumburl'), title, 'Wikimedia Commons');
    });
}

export async function searchCommons(query: string, signal?: AbortSignal): Promise<ImageCandidate[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '12',
    gsrsearch: `${query} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '1024',
  });
  return parseCommons(await getJson(`https://commons.wikimedia.org/w/api.php?${params}`, signal));
}

export function parseWikipedia(json: unknown): ImageCandidate[] {
  const pages = Object.values(isObject(at(json, 'query', 'pages')) ? (at(json, 'query', 'pages') as Json) : {});
  return pages
    .sort((a, b) => (num(at(a, 'index')) ?? 0) - (num(at(b, 'index')) ?? 0))
    .flatMap((page) => candidate(at(page, 'thumbnail', 'source'), at(page, 'thumbnail', 'source'), str(at(page, 'title')) ?? 'Wikipedia', 'Wikipedia'));
}

export async function searchWikipedia(query: string, signal?: AbortSignal, lang = 'de'): Promise<ImageCandidate[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrlimit: '6',
    gsrsearch: query,
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '1024',
  });
  return parseWikipedia(await getJson(`https://${lang}.wikipedia.org/w/api.php?${params}`, signal));
}

// ---------- Recipes: TheMealDB ----------

export function parseMealDb(json: unknown): ImageCandidate[] {
  return list(at(json, 'meals')).flatMap((meal) => {
    const thumb = str(at(meal, 'strMealThumb'));
    return candidate(thumb, thumb && `${thumb}/preview`, str(at(meal, 'strMeal')) ?? 'Rezept', 'TheMealDB');
  });
}

export async function searchMealDb(query: string, signal?: AbortSignal): Promise<ImageCandidate[]> {
  return parseMealDb(await getJson(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`, signal));
}

// ---------- LEGO: official set images by set number ----------

/** Set images follow a fixed URL scheme – no API call needed. Broken ones are hidden by the picker. */
export function legoSetImages(setNumber: string | undefined, name = 'LEGO Set'): ImageCandidate[] {
  const base = setNumber?.trim().match(/^(\d{3,7})(?:-(\d+))?$/);
  if (!base) return [];
  const id = `${base[1]}-${base[2] ?? '1'}`;
  return [
    ...candidate(`https://cdn.rebrickable.com/media/sets/${id}.jpg`, undefined, `${name} (${id})`, 'Rebrickable'),
    ...candidate(`https://images.brickset.com/sets/images/${id}.jpg`, undefined, `${name} (${id})`, 'Brickset'),
  ];
}
