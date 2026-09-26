import { isValidUrl } from './url';

/** Form helper: error text for a non-empty but invalid URL. */
export function urlError(value: string): string | undefined {
  return value.trim() && !isValidUrl(value) ? 'Bitte einen gültigen Link (https://…) eingeben.' : undefined;
}

export function requiredError(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} fehlt noch.`;
}

/** Trims a string and turns "" into undefined for optional fields. */
export function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
