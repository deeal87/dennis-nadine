/**
 * Minimal GitHub contents API client for the sync file. Reading works without
 * a token (public repository); saving needs a fine-grained token with
 * "Contents: Read and write" for this one repository. The file lives on its
 * own branch so saves never touch the site or trigger a deploy.
 */
import { isSyncFile, type SyncFile } from './crypto';

export const SYNC_REPO: string = import.meta.env.VITE_SYNC_REPO ?? '';
export const SYNC_BRANCH = 'sync-data';
export const SYNC_PATH = 'dennis-nadine.sync.json';
export const SYNC_ENABLED = /^[\w.-]+\/[\w.-]+$/.test(SYNC_REPO);

const API = 'https://api.github.com';
const TIMEOUT_MS = 12_000;

export class SyncError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function request(path: string, token: string | undefined, init: RequestInit & { accept?: string } = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { Accept: init.accept ?? 'application/vnd.github+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (init.body) headers['Content-Type'] = 'application/json';
    return await fetch(`${API}${path}`, { ...init, headers, signal: controller.signal, cache: 'no-store' });
  } catch {
    throw new SyncError('GitHub ist gerade nicht erreichbar. Seid ihr online?');
  } finally {
    clearTimeout(timer);
  }
}

function explain(status: number): string {
  if (status === 401) return 'Der GitHub-Schlüssel ist ungültig oder abgelaufen.';
  if (status === 403) return 'Der GitHub-Schlüssel darf hier nicht schreiben – oder GitHub bremst gerade (bitte kurz warten).';
  if (status === 404) return 'Repository nicht gefunden – hat der Schlüssel Zugriff auf dieses Repository?';
  if (status === 409 || status === 422) return 'Der gespeicherte Stand hat sich gerade geändert. Bitte nochmal versuchen.';
  return `GitHub hat mit Fehler ${status} geantwortet.`;
}

const contentsPath = `/repos/${SYNC_REPO}/contents/${SYNC_PATH}?ref=${SYNC_BRANCH}`;

/** The saved state, or null when nothing has been saved yet. */
export async function fetchSyncFile(token?: string): Promise<SyncFile | null> {
  const response = await request(contentsPath, token, { accept: 'application/vnd.github.raw+json' });
  if (response.status === 404) return null;
  if (!response.ok) throw new SyncError(explain(response.status), response.status);
  const json: unknown = await response.json().catch(() => null);
  if (!isSyncFile(json)) throw new SyncError('Die gespeicherte Datei auf GitHub ist beschädigt.');
  return json;
}

/** Checks that the token can push to the repository. */
export async function verifyToken(token: string): Promise<void> {
  const response = await request(`/repos/${SYNC_REPO}`, token);
  if (!response.ok) throw new SyncError(explain(response.status), response.status);
  const repo = (await response.json()) as { permissions?: { push?: boolean } };
  if (repo.permissions && !repo.permissions.push) throw new SyncError('Der Schlüssel darf nur lesen – bitte „Contents: Read and write“ erlauben.');
}

async function ensureBranch(token: string): Promise<void> {
  const existing = await request(`/repos/${SYNC_REPO}/git/ref/heads/${SYNC_BRANCH}`, token);
  if (existing.ok) return;
  if (existing.status !== 404) throw new SyncError(explain(existing.status), existing.status);
  const repo = await request(`/repos/${SYNC_REPO}`, token);
  if (!repo.ok) throw new SyncError(explain(repo.status), repo.status);
  const { default_branch: base } = (await repo.json()) as { default_branch: string };
  const head = await request(`/repos/${SYNC_REPO}/git/ref/heads/${base}`, token);
  if (!head.ok) throw new SyncError(explain(head.status), head.status);
  const { object } = (await head.json()) as { object: { sha: string } };
  const created = await request(`/repos/${SYNC_REPO}/git/refs`, token, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${SYNC_BRANCH}`, sha: object.sha }),
  });
  if (!created.ok && created.status !== 422) throw new SyncError(explain(created.status), created.status);
}

async function currentSha(token: string): Promise<string | undefined> {
  const response = await request(contentsPath, token, { accept: 'application/vnd.github.object+json' });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new SyncError(explain(response.status), response.status);
  return ((await response.json()) as { sha?: string }).sha;
}

export async function uploadSyncFile(file: SyncFile, token: string): Promise<void> {
  await ensureBranch(token);
  const sha = await currentSha(token);
  const content = btoa(JSON.stringify(file));
  const response = await request(`/repos/${SYNC_REPO}/contents/${SYNC_PATH}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Gespeicherter Stand v${file.version} (${file.savedAt.slice(0, 16).replace('T', ' ')})`,
      content,
      branch: SYNC_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) throw new SyncError(explain(response.status), response.status);
}
