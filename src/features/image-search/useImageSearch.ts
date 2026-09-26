import { useEffect, useState } from 'react';
import { searchImages, type ImageDomain, type ImageSearchContext } from './search';
import type { ImageCandidate } from './providers';

export type SearchState = { status: 'idle' | 'loading' | 'done'; results: ImageCandidate[] };

const TIMEOUT_MS = 10_000;

/**
 * Runs an image search whenever `query` changes (after `delay` ms), cancelling
 * outdated requests. Pass `enabled: false` to stay idle.
 */
export function useImageSearch(domain: ImageDomain, query: string, context: ImageSearchContext, enabled: boolean, delay = 700): SearchState {
  const [state, setState] = useState<SearchState>({ status: 'idle', results: [] });
  const { setNumber } = context;

  useEffect(() => {
    const q = query.trim();
    if (!enabled || (q.length < 2 && !setNumber)) {
      setState({ status: 'idle', results: [] });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setState((s) => ({ ...s, status: 'loading' }));
      const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
      searchImages(domain, q, { setNumber }, controller.signal)
        .then((results) => !controller.signal.aborted && setState({ status: 'done', results }))
        .catch(() => !controller.signal.aborted && setState({ status: 'done', results: [] }))
        .finally(() => window.clearTimeout(timeout));
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [domain, query, setNumber, enabled, delay]);

  return state;
}
