import { useEffect } from 'react';
import { useSettings, useStore } from './useStore';
import type { ThemePreference } from '@/types/models';

/** Mirrors the theme to localStorage so index.html can apply it before first paint. */
export const THEME_STORAGE_KEY = 'dn-theme';

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
}

/** Applies the persisted theme preference to <html> and follows system changes. */
export function useApplyTheme(): void {
  const { loading } = useStore('settings');
  const { theme } = useSettings();

  useEffect(() => {
    if (loading) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = resolveTheme(theme, media.matches) === 'dark';
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e1130' : '#fcf7f3');
    };
    apply();
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode) – the theme still applies for this session.
    }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, loading]);
}
