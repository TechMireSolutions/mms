import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/** `apps/backend` root — works from `src/` (tsx) and `dist/` (node). */
export function resolveBackendRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/**
 * Loads env files for the backend package. Merges repo-root `.env` then
 * `apps/backend/.env` so PM2 can use either cwd without losing JWT_SECRET.
 */
export function loadBackendEnv(): void {
  const backendRoot = resolveBackendRoot();
  const repoRoot = resolve(backendRoot, '..', '..');
  const candidates = [
    join(repoRoot, '.env'),
    join(backendRoot, '.env'),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/backend/.env'),
  ];

  const loaded = new Set<string>();
  for (const path of candidates) {
    const normalized = resolve(path);
    if (loaded.has(normalized) || !existsSync(normalized)) continue;
    loaded.add(normalized);
    dotenv.config({ path: normalized });
  }
}
