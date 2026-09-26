/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "owner/repo" for the encrypted shared state; empty disables saving to GitHub. */
  readonly VITE_SYNC_REPO?: string;
}
