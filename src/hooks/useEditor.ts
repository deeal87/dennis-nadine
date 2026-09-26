import { useCallback, useState } from 'react';

/** Open/close state for a create-or-edit form dialog. */
export function useEditor<T>() {
  const [state, setState] = useState<{ open: boolean; entity?: T }>({ open: false });
  const openNew = useCallback(() => setState({ open: true }), []);
  const openEdit = useCallback((entity: T) => setState({ open: true, entity }), []);
  const close = useCallback(() => setState({ open: false }), []);
  return { ...state, openNew, openEdit, close };
}
