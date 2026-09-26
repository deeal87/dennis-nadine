/** Single source of truth for route paths. */
export const PATHS = {
  home: '/',
  anime: '/anime',
  recipes: '/rezepte',
  recipe: (id: string) => `/rezepte/${encodeURIComponent(id)}`,
  dates: '/dates',
  funkos: '/funkos',
  lego: '/lego',
  memories: '/memories',
  timeline: '/timeline',
  bucket: '/bucket-list',
  settings: '/einstellungen',
} as const;

/** Link to a list page with its detail dialog opened. */
export function withDetail(path: string, id: string): string {
  return `${path}?id=${encodeURIComponent(id)}`;
}
