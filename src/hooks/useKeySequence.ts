import { useEffect, useRef } from 'react';

/** Fires `onMatch` when the given key sequence is typed (outside of form fields). */
export function useKeySequence(sequence: readonly string[], onMatch: () => void): void {
  const progress = useRef(0);
  const callback = useRef(onMatch);
  callback.current = onMatch;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const expected = sequence[progress.current];
      if (key === expected) {
        progress.current += 1;
        if (progress.current === sequence.length) {
          progress.current = 0;
          callback.current();
        }
      } else {
        progress.current = key === sequence[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence]);
}
