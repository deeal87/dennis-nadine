/**
 * Which image sources are asked for which kind of entry. The query is built
 * from the entry (title, city, series …) and can be edited in the picker.
 */
import { legoSetImages, searchAnime, searchCommons, searchMealDb, searchWikipedia, type ImageCandidate } from './providers';

export type ImageDomain = 'anime' | 'recipe' | 'place' | 'funko' | 'lego';

export interface ImageSearchContext {
  /** LEGO set number for direct set images. */
  setNumber?: string;
}

export const IMAGE_DOMAIN_INFO: Record<ImageDomain, { sources: string; hint?: string }> = {
  anime: { sources: 'MyAnimeList / AniList' },
  recipe: { sources: 'TheMealDB & Wikimedia Commons', hint: 'Englische Gerichtnamen liefern oft mehr Treffer.' },
  place: { sources: 'Wikipedia & Wikimedia Commons', hint: 'Klappt am besten mit bekannten Orten, Städten und Sehenswürdigkeiten.' },
  funko: {
    sources: 'Wikimedia Commons',
    hint: 'Für Funko Pops gibt es keine freie Bilddatenbank – ein eigenes Foto ist hier meist die schönste Wahl.',
  },
  lego: { sources: 'Rebrickable, Brickset & Wikimedia Commons', hint: 'Mit Set-Nummer gibt es das offizielle Set-Bild.' },
};

function dedupe(candidates: ImageCandidate[]): ImageCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => !seen.has(c.url) && seen.add(c.url));
}

async function all(...searches: Array<Promise<ImageCandidate[]> | ImageCandidate[]>): Promise<ImageCandidate[]> {
  return dedupe((await Promise.all(searches)).flat());
}

export async function searchImages(domain: ImageDomain, query: string, context: ImageSearchContext = {}, signal?: AbortSignal): Promise<ImageCandidate[]> {
  const q = query.trim();
  if (!q && !context.setNumber) return [];
  switch (domain) {
    case 'anime':
      return q ? searchAnime(q, signal) : [];
    case 'recipe':
      return all(searchMealDb(q, signal), searchCommons(q, signal));
    case 'place':
      return all(searchWikipedia(q, signal), searchCommons(q, signal));
    case 'funko':
      return q ? searchCommons(q, signal) : [];
    case 'lego':
      return all(legoSetImages(context.setNumber, q || undefined), q ? searchCommons(`LEGO ${q}`, signal) : []);
  }
}
