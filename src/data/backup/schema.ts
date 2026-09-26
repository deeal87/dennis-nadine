/**
 * Minimal declarative validation for persisted entities. Used by the backup
 * import to reject malformed data before it touches the database.
 * Unknown fields are dropped, known fields are type-checked.
 */
import {
  ANIME_STATUSES,
  BUCKET_CATEGORIES,
  DATE_CATEGORIES,
  DATE_TAGS,
  MEMORY_CATEGORIES,
  PRIORITIES,
  RANKING_IDS,
  RECIPE_CATEGORIES,
  TIMELINE_CATEGORIES,
} from '@/types/models';
import { isIsoDate } from '@/lib/date';
import type { StoreMap, StoreName } from '../database';

type FieldSpec =
  | { type: 'string'; required?: boolean; enum?: readonly string[]; format?: 'date' | 'timestamp'; max?: number }
  | { type: 'number'; required?: boolean; min?: number; max?: number; integer?: boolean }
  | { type: 'boolean'; required?: boolean }
  | { type: 'stringArray'; required?: boolean; enum?: readonly string[] }
  | { type: 'objectArray'; required?: boolean; of: Schema };

type Schema = Record<string, FieldSpec>;

const MAX_TEXT = 20_000;
const rating: FieldSpec = { type: 'number', min: 0, max: 5 };
const optionalText: FieldSpec = { type: 'string', max: MAX_TEXT };
/** Image fields may hold an uploaded photo as data URL. */
const MAX_IMAGE = 4_000_000;
const optionalImage: FieldSpec = { type: 'string', max: MAX_IMAGE };
const requiredText: FieldSpec = { type: 'string', required: true, max: MAX_TEXT };
const optionalDate: FieldSpec = { type: 'string', format: 'date' };

const base: Schema = {
  id: { type: 'string', required: true, max: 200 },
  createdAt: { type: 'string', required: true, format: 'timestamp' },
  updatedAt: { type: 'string', required: true, format: 'timestamp' },
};

const collectible: Schema = {
  ...base,
  name: requiredText,
  imageUrl: optionalImage,
  status: { type: 'string', required: true, enum: ['owned', 'wishlist'] },
  favorite: { type: 'boolean', required: true },
  notes: optionalText,
};

export const SCHEMAS: Record<StoreName, Schema> = {
  anime: {
    ...base,
    title: requiredText,
    coverUrl: optionalImage,
    genres: { type: 'stringArray', required: true },
    status: { type: 'string', required: true, enum: ANIME_STATUSES },
    dennisRating: rating,
    nadineRating: rating,
    sharedRating: rating,
    episodes: { type: 'number', min: 0, integer: true },
    watchedAt: optionalDate,
    notes: optionalText,
    interestedBy: { type: 'stringArray', enum: ['dennis', 'nadine'] },
  },
  recipes: {
    ...base,
    kind: { type: 'string', required: true, enum: ['social', 'manual'] },
    title: requiredText,
    description: optionalText,
    imageUrl: optionalImage,
    category: { type: 'string', required: true, enum: RECIPE_CATEGORIES },
    vegetarian: { type: 'boolean', required: true },
    favorite: { type: 'boolean', required: true },
    servings: { type: 'number', min: 0 },
    prepMinutes: { type: 'number', min: 0 },
    ingredients: { type: 'stringArray', required: true },
    steps: { type: 'stringArray', required: true },
    notes: optionalText,
    source: optionalText,
    socialUrl: optionalText,
  },
  dates: {
    ...base,
    name: requiredText,
    category: { type: 'string', required: true, enum: DATE_CATEGORIES },
    status: { type: 'string', required: true, enum: ['done', 'todo'] },
    tags: { type: 'stringArray', required: true, enum: DATE_TAGS },
    description: optionalText,
    address: optionalText,
    city: optionalText,
    mapsUrl: optionalText,
    date: optionalDate,
    dennisRating: rating,
    nadineRating: rating,
    sharedRating: rating,
    priceRange: { type: 'number', min: 1, max: 4, integer: true },
    notes: optionalText,
    photoUrl: optionalImage,
  },
  funkos: {
    ...collectible,
    series: optionalText,
    number: optionalText,
    character: optionalText,
    releaseYear: { type: 'number', min: 1900, max: 2200, integer: true },
  },
  lego: {
    ...collectible,
    setNumber: optionalText,
    theme: optionalText,
    pieces: { type: 'number', min: 0, integer: true },
  },
  series: {
    ...base,
    domain: { type: 'string', required: true, enum: ['funko', 'lego'] },
    name: requiredText,
    items: {
      type: 'objectArray',
      required: true,
      of: { id: { type: 'string', required: true }, name: requiredText, number: optionalText },
    },
  },
  memories: {
    ...base,
    title: requiredText,
    date: optionalDate,
    description: optionalText,
    category: { type: 'string', required: true, enum: MEMORY_CATEGORIES },
    instagramUrl: optionalText,
    tiktokUrl: optionalText,
    imageUrl: optionalImage,
  },
  timeline: {
    ...base,
    date: { type: 'string', required: true, format: 'date' },
    title: requiredText,
    description: optionalText,
    imageUrl: optionalImage,
    category: { type: 'string', required: true, enum: TIMELINE_CATEGORIES },
  },
  bucket: {
    ...base,
    title: requiredText,
    description: optionalText,
    category: { type: 'string', required: true, enum: BUCKET_CATEGORIES },
    priority: { type: 'string', required: true, enum: PRIORITIES },
    done: { type: 'boolean', required: true },
    date: optionalDate,
  },
  rankings: {
    id: { type: 'string', required: true, enum: RANKING_IDS },
    itemIds: { type: 'stringArray', required: true },
    updatedAt: { type: 'string', required: true, format: 'timestamp' },
  },
  settings: {
    id: { type: 'string', required: true, enum: ['settings'] },
    theme: { type: 'string', required: true, enum: ['light', 'dark', 'system'] },
    seededAt: { type: 'string', format: 'timestamp' },
    autoImageSuggestions: { type: 'boolean' },
    discoverRegion: { type: 'string', max: 10 },
  },
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkField(key: string, spec: FieldSpec, value: unknown): string | null {
  switch (spec.type) {
    case 'string': {
      if (typeof value !== 'string') return `${key} muss Text sein`;
      if (spec.max !== undefined && value.length > spec.max) return `${key} ist zu lang`;
      if (spec.enum && !spec.enum.includes(value)) return `${key} hat einen ungültigen Wert „${value}“`;
      if (spec.format === 'date' && !isIsoDate(value)) return `${key} ist kein gültiges Datum`;
      if (spec.format === 'timestamp' && Number.isNaN(Date.parse(value))) return `${key} ist kein gültiger Zeitstempel`;
      return null;
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return `${key} muss eine Zahl sein`;
      if (spec.integer && !Number.isInteger(value)) return `${key} muss eine ganze Zahl sein`;
      if (spec.min !== undefined && value < spec.min) return `${key} ist zu klein`;
      if (spec.max !== undefined && value > spec.max) return `${key} ist zu groß`;
      return null;
    }
    case 'boolean':
      return typeof value === 'boolean' ? null : `${key} muss ja/nein sein`;
    case 'stringArray': {
      if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) return `${key} muss eine Textliste sein`;
      const allowed = spec.enum;
      if (allowed && !value.every((v) => allowed.includes(v))) return `${key} enthält ungültige Werte`;
      return null;
    }
    case 'objectArray': {
      if (!Array.isArray(value)) return `${key} muss eine Liste sein`;
      for (const [index, entry] of value.entries()) {
        const result = validateAgainst(spec.of, entry);
        if (!result.ok) return `${key}[${index}]: ${result.error}`;
      }
      return null;
    }
  }
}

function sanitize(spec: FieldSpec, value: unknown): unknown {
  if (spec.type === 'objectArray' && Array.isArray(value)) {
    return value.map((entry) => (validateAgainst(spec.of, entry) as { value: unknown }).value);
  }
  return value;
}

function validateAgainst(schema: Schema, raw: unknown): ValidationResult<Record<string, unknown>> {
  if (!isRecord(raw)) return { ok: false, error: 'Eintrag ist kein Objekt' };
  const value: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(schema)) {
    const field = raw[key];
    if (field === undefined || field === null) {
      if (spec.required) return { ok: false, error: `${key} fehlt` };
      continue;
    }
    const error = checkField(key, spec, field);
    if (error) return { ok: false, error };
    value[key] = sanitize(spec, field);
  }
  return { ok: true, value };
}

export function validateEntity<S extends StoreName>(store: S, raw: unknown): ValidationResult<StoreMap[S]> {
  return validateAgainst(SCHEMAS[store], raw) as ValidationResult<StoreMap[S]>;
}
