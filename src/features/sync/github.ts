/**
 * Minimal GitHub contents API client for the sync file. Reading works without
 * a token (public repository); saving needs a fine-grained token with
 * "Contents: Read and write" for this one repository. The file lives on its
 * own branch so saves never touch the site or trigger a deploy.
 */
import { isSyncFile, type SyncFile } from './crypto';

/**
 * Repository that holds the encrypted shared state. Fixed here so every copy
 * of the site (github.io, custom domain, other hosts) saves to the same place;
 * VITE_SYNC_REPO can override it for forks.
 */
const DEFAULT_SYNC_REPO = 'deeal87/dennis-nadine';
export const SYNC_REPO: string = import.meta.env.VITE_SYNC_REPO || DEFAULT_SYNC_REPO;
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

const REPO_NAME = SYNC_REPO.split('/')[1] ?? SYNC_REPO;

export const NO_WRITE_ACCESS = `Der Schlüssel darf nur lesen. Beim Erstellen unter „Permissions“ → „Contents“ auf „Read and write“ stellen (und bei „Repository access“ „Only select repositories“ → ${REPO_NAME} wählen – nicht „Public repositories“).`;
export const NO_REPO_ACCESS = `Der Schlüssel hat keinen Zugriff auf das Repository „${REPO_NAME}“. Beim Erstellen unter „Repository access“ „Only select repositories“ → ${REPO_NAME} auswählen.`;

/** Turns a failed GitHub response into a message that says what to change. */
async function failure(response: Response): Promise<SyncError> {
  const status = response.status;
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  const detail = body.message ?? '';
  if (status === 401) return new SyncError('Der GitHub-Schlüssel ist ungültig oder abgelaufen – bitte neu erstellen und einfügen.', status);
  if ((status === 403 || status === 429) && (response.headers.get('x-ratelimit-remaining') === '0' || /rate limit/i.test(detail))) {
    return new SyncError('GitHub bremst gerade (zu viele Anfragen). Bitte in ein paar Minuten nochmal.', status);
  }
  if (status === 403) return new SyncError(NO_WRITE_ACCESS, status);
  if (status === 404) return new SyncError(NO_REPO_ACCESS, status);
  if (status === 409 || status === 422) return new SyncError('Der gespeicherte Stand hat sich gerade geändert. Bitte nochmal versuchen.', status);
  return new SyncError(`GitHub hat mit Fehler ${status} geantwortet${detail ? ` („${detail}“)` : ''}.`, status);
}

const contentsPath = `/repos/${SYNC_REPO}/contents/${SYNC_PATH}?ref=${SYNC_BRANCH}`;

/** The saved state, or null when nothing has been saved yet. */
export async function fetchSyncFile(token?: string): Promise<SyncFile | null> {
  const response = await request(contentsPath, token, { accept: 'application/vnd.github.raw+json' });
  if (response.status === 404) return null;
  if (!response.ok) throw await failure(response);
  const json: unknown = await response.json().catch(() => null);
  if (!isSyncFile(json)) throw new SyncError('Die gespeicherte Datei auf GitHub ist beschädigt.');
  return json;
}

/** Makes sure the sync branch exists; returns its head commit. */
async function ensureBranch(token: string): Promise<{ sha: string; created: boolean }> {
  const existing = await request(`/repos/${SYNC_REPO}/git/ref/heads/${SYNC_BRANCH}`, token);
  if (existing.ok) return { sha: ((await existing.json()) as { object: { sha: string } }).object.sha, created: false };
  if (existing.status !== 404) throw await failure(existing);
  const repo = await request(`/repos/${SYNC_REPO}`, token);
  if (!repo.ok) throw await failure(repo);
  const { default_branch: base } = (await repo.json()) as { default_branch: string };
  const head = await request(`/repos/${SYNC_REPO}/git/ref/heads/${base}`, token);
  if (!head.ok) throw await failure(head);
  const { object } = (await head.json()) as { object: { sha: string } };
  const created = await request(`/repos/${SYNC_REPO}/git/refs`, token, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${SYNC_BRANCH}`, sha: object.sha }),
  });
  if (created.ok || created.status === 422) return { sha: object.sha, created: created.ok };
  throw await failure(created);
}

/**
 * Checks that the token can really write: repository access, then a harmless
 * write (creating the sync branch, or pointing it at the commit it already has).
 */
export async function verifyToken(token: string): Promise<void> {
  const repo = await request(`/repos/${SYNC_REPO}`, token);
  if (!repo.ok) throw await failure(repo);
  const branch = await ensureBranch(token);
  if (branch.created) return;
  const touch = await request(`/repos/${SYNC_REPO}/git/refs/heads/${SYNC_BRANCH}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ sha: branch.sha, force: false }),
  });
  if (!touch.ok) throw await failure(touch);
}

async function currentSha(token: string): Promise<string | undefined> {
  const response = await request(contentsPath, token, { accept: 'application/vnd.github.object+json' });
  if (response.status === 404) return undefined;
  if (!response.ok) throw await failure(response);
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
  if (!response.ok) throw await failure(response);
}
