import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

const CHECK_EVERY_MS = 10 * 60_000;
const ENTRY = /assets\/index-[\w-]+\.js/;

/**
 * GitHub Pages and browsers cache the page for a while. When a newer version
 * was published, offer a reload instead of silently running the old one.
 */
export function useUpdateCheck(): void {
  const toast = useToast();
  const notified = useRef(false);

  useEffect(() => {
    const current = document.querySelector<HTMLScriptElement>('script[type="module"][src*="assets/index-"]')?.src.match(ENTRY)?.[0];
    if (!current) return; // dev server
    let last = Date.now();

    const check = async () => {
      if (notified.current) return;
      last = Date.now();
      try {
        const html = await (await fetch(import.meta.env.BASE_URL, { cache: 'no-store' })).text();
        const latest = html.match(ENTRY)?.[0];
        if (latest && latest !== current) {
          notified.current = true;
          toast({
            tone: 'info',
            message: 'Es gibt eine neue Version unserer Welt ✨',
            action: { label: 'Neu laden', onClick: () => window.location.reload() },
            duration: 60_000,
          });
        }
      } catch {
        // Offline – try again later.
      }
    };

    const onVisible = () => document.visibilityState === 'visible' && Date.now() - last > 60_000 && void check();
    const timer = window.setInterval(() => void check(), CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    void check();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [toast]);
}
