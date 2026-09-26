/** Returns a normalized http(s) URL or undefined for anything else (javascript:, garbage…). */
export function toSafeUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function isValidUrl(value?: string): boolean {
  return toSafeUrl(value) !== undefined;
}

export function hostnameOf(value?: string): string {
  const safe = toSafeUrl(value);
  return safe ? new URL(safe).hostname.replace(/^www\./, '') : '';
}
