import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Dennis ❤️ Nadine` : 'Dennis ❤️ Nadine – Unsere kleine Anime-Welt';
  }, [title]);
}
