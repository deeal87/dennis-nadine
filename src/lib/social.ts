/**
 * Social media link helpers. Previews are best effort: the platforms decide
 * whether embeds work, so every consumer must keep a plain link card fallback.
 */
import { toSafeUrl } from './url';

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'pinterest' | 'facebook' | 'web';

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  facebook: 'Facebook',
  web: 'Website',
};

export function detectPlatform(value?: string): Platform | undefined {
  const safe = toSafeUrl(value);
  if (!safe) return undefined;
  const host = new URL(safe).hostname.replace(/^www\.|^m\./, '');
  if (host.endsWith('tiktok.com')) return 'tiktok';
  if (host.endsWith('instagram.com')) return 'instagram';
  if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'youtube';
  if (host.includes('pinterest.') || host === 'pin.it') return 'pinterest';
  if (host.endsWith('facebook.com') || host === 'fb.watch') return 'facebook';
  return 'web';
}

function youtubeId(url: URL): string | undefined {
  if (url.hostname === 'youtu.be') return url.pathname.slice(1) || undefined;
  if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
  return url.searchParams.get('v') ?? undefined;
}

/**
 * Returns an iframe URL for platforms that offer official embed pages.
 * Short links (vm.tiktok.com, pin.it …) cannot be resolved client side → undefined.
 */
export function getEmbedUrl(value?: string): string | undefined {
  const safe = toSafeUrl(value);
  const platform = detectPlatform(safe);
  if (!safe || !platform) return undefined;
  const url = new URL(safe);
  switch (platform) {
    case 'tiktok': {
      const id = url.pathname.match(/\/video\/(\d+)/)?.[1];
      return id ? `https://www.tiktok.com/embed/v2/${id}` : undefined;
    }
    case 'instagram': {
      const match = url.pathname.match(/\/(p|reel|tv)\/([\w-]+)/);
      return match ? `https://www.instagram.com/${match[1]}/${match[2]}/embed` : undefined;
    }
    case 'youtube': {
      const id = youtubeId(url);
      return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
    }
    default:
      return undefined;
  }
}

/** Thumbnails that can be derived without any request to an API. */
export function getDerivedThumbnail(value?: string): string | undefined {
  const safe = toSafeUrl(value);
  if (!safe || detectPlatform(safe) !== 'youtube') return undefined;
  const id = youtubeId(new URL(safe));
  return id && /^[\w-]{6,}$/.test(id) ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

export interface OEmbedPreview {
  title?: string;
  author?: string;
  thumbnailUrl?: string;
}

/**
 * Optional, user-triggered metadata lookup via TikTok's public oEmbed endpoint.
 * Only called when the user explicitly asks for it (it contacts TikTok).
 * Resolves to null on any failure – callers fall back to manual input.
 */
export async function fetchOEmbedPreview(value: string, signal?: AbortSignal): Promise<OEmbedPreview | null> {
  const safe = toSafeUrl(value);
  if (!safe || detectPlatform(safe) !== 'tiktok') return null;
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(safe)}`, { signal });
    if (!response.ok) return null;
    const json = (await response.json()) as { title?: unknown; author_name?: unknown; thumbnail_url?: unknown };
    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
    return { title: text(json.title), author: text(json.author_name), thumbnailUrl: toSafeUrl(text(json.thumbnail_url)) };
  } catch {
    return null;
  }
}

export function canFetchPreview(value?: string): boolean {
  return detectPlatform(value) === 'tiktok';
}
