import { describe, expect, it } from 'vitest';
import { detectPlatform, getDerivedThumbnail, getEmbedUrl } from './social';
import { extractMapsQuery, isGoogleMapsUrl, resolveMapsLink } from './maps';
import { toSafeUrl } from './url';
import { daysBetween, formatDate, isIsoDate } from './date';

describe('urls', () => {
  it('only allows http(s)', () => {
    expect(toSafeUrl('javascript:alert(1)')).toBeUndefined();
    expect(toSafeUrl('example.com/x')).toBe('https://example.com/x');
    expect(toSafeUrl('  ')).toBeUndefined();
    expect(toSafeUrl('https://exa mple')).toBeUndefined();
  });
});

describe('social links', () => {
  it('detects platforms', () => {
    expect(detectPlatform('https://www.tiktok.com/@a/video/1')).toBe('tiktok');
    expect(detectPlatform('https://instagram.com/p/abc')).toBe('instagram');
    expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(detectPlatform('https://chefkoch.de/rezept')).toBe('web');
    expect(detectPlatform('not a url at all ::')).toBeUndefined();
  });

  it('builds official embed urls when possible', () => {
    expect(getEmbedUrl('https://www.tiktok.com/@cook/video/7234567890123456789')).toBe('https://www.tiktok.com/embed/v2/7234567890123456789');
    expect(getEmbedUrl('https://vm.tiktok.com/ZMabc/')).toBeUndefined();
    expect(getEmbedUrl('https://www.instagram.com/reel/Cxyz_12/?igsh=1')).toBe('https://www.instagram.com/reel/Cxyz_12/embed');
    expect(getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(getEmbedUrl('https://example.com')).toBeUndefined();
  });

  it('derives YouTube thumbnails without any request', () => {
    expect(getDerivedThumbnail('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(getDerivedThumbnail('https://www.tiktok.com/@a/video/1')).toBeUndefined();
  });
});

describe('google maps', () => {
  it('recognises maps links', () => {
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc')).toBe(true);
    expect(isGoogleMapsUrl('https://www.google.de/maps/place/X')).toBe(true);
    expect(isGoogleMapsUrl('https://www.google.com/search?q=x')).toBe(false);
  });

  it('extracts a query for the map preview', () => {
    expect(extractMapsQuery('https://www.google.com/maps/place/Ramen+Bar/@51.2,6.7,15z')).toBe('Ramen Bar');
    expect(extractMapsQuery('https://www.google.com/maps/@51.22,6.77,15z')).toBe('51.22,6.77');
    expect(extractMapsQuery('https://maps.google.com/?q=Kyoto')).toBe('Kyoto');
    expect(extractMapsQuery('https://maps.app.goo.gl/abc')).toBeUndefined();
  });

  it('falls back to an address search link', () => {
    expect(resolveMapsLink(undefined, 'Königsallee 1, Düsseldorf')).toBe('https://www.google.com/maps/search/?api=1&query=K%C3%B6nigsallee%201%2C%20D%C3%BCsseldorf');
    expect(resolveMapsLink(undefined, '')).toBeUndefined();
  });
});

describe('dates', () => {
  it('validates and formats', () => {
    expect(isIsoDate('2026-09-09')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(formatDate('2026-09-09')).toBe('09.09.2026');
    expect(formatDate('')).toBe('');
    expect(daysBetween('2026-09-09', '2026-09-26')).toBe(17);
  });
});
