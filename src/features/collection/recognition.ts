/**
 * Photo recognition extension point.
 *
 * No provider ships with the app: reliable figure/set recognition needs an
 * external vision service, and nothing is sent anywhere by default. To add one,
 * implement RecognitionProvider (e.g. calling a vision API with the user's own
 * key) and call registerRecognitionProvider() at startup. Until then the
 * photo flow is a fast manual confirmation list – no fake detection.
 */
import type { CollectionDomain } from '@/types/models';

export interface RecognitionCandidate {
  name: string;
  group?: string;
  number?: string;
  /** 0…1, if the provider reports it. */
  confidence?: number;
}

export interface RecognitionProvider {
  id: string;
  label: string;
  recognize(image: Blob, domain: CollectionDomain, signal?: AbortSignal): Promise<RecognitionCandidate[]>;
}

const providers: RecognitionProvider[] = [];

export function registerRecognitionProvider(provider: RecognitionProvider): void {
  if (!providers.some((p) => p.id === provider.id)) providers.push(provider);
}

export function getRecognitionProvider(): RecognitionProvider | undefined {
  return providers[0];
}
