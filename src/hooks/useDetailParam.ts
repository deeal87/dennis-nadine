import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Keeps the id of the opened detail view in the URL (?id=…), so search results
 * and shared links can deep-link into a detail dialog.
 */
export function useDetailParam() {
  const [params, setParams] = useSearchParams();
  const id = params.get('id');
  const open = useCallback(
    (next: string) =>
      setParams((current) => {
        const copy = new URLSearchParams(current);
        copy.set('id', next);
        return copy;
      }),
    [setParams],
  );
  const close = useCallback(
    () =>
      setParams(
        (current) => {
          const copy = new URLSearchParams(current);
          copy.delete('id');
          return copy;
        },
        { replace: true },
      ),
    [setParams],
  );
  return { id, open, close };
}
