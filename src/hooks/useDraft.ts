import { useCallback, useState } from 'react';

/** Local form state with a typed field setter and an "attempted submit" flag for showing errors. */
export function useDraft<T extends object>(initial: T | (() => T)) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => setDraft((current) => ({ ...current, [key]: value })), []);
  return { draft, set, setDraft, submitted, markSubmitted: () => setSubmitted(true) };
}
