/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs';
import { pbkdf2Sync } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import access from './access.config.json' with { type: 'json' };

/**
 * BASE_PATH is set by the GitHub Pages workflow (e.g. "/Steam-game1/").
 * Locally the app is served from "/".
 */
const base = process.env.BASE_PATH ?? '/';

/**
 * Optional password gate. The plain password only exists as the APP_PASSWORD
 * build secret; the bundle gets a PBKDF2 hash of it. No password → no gate.
 */
const password = process.env.APP_PASSWORD?.trim() ?? '';
const accessHash = password ? pbkdf2Sync(password, access.salt, access.iterations, 32, 'sha256').toString('hex') : '';
const accessHint = process.env.APP_PASSWORD_HINT?.trim() ?? '';

/**
 * GitHub Pages serves 404.html for unknown paths. A copy of index.html lets
 * deep links like /anime boot the SPA, which then routes client-side.
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const dist = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist');
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
    },
  };
}

export default defineConfig({
  base,
  define: {
    __ACCESS_HASH__: JSON.stringify(accessHash),
    __ACCESS_HINT__: JSON.stringify(accessHint),
  },
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react';
          if (id.includes('node_modules/lucide-react')) return 'icons';
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
});
