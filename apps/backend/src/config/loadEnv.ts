import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/** `apps/backend` root — works from `src/` (tsx) and `dist/` (node). */
export function resolveBackendRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/**
 * Loads env files for the backend package. Repo-root `.env` loads first;
 * `apps/backend/.env` loads last with override so deploy secrets win.
 */
export function loadBackendEnv(): void {
  const backendRoot = resolveBackendRoot();
  const repoRoot = resolve(backendRoot, '..', '..');
  const backendEnvPath = join(backendRoot, '.env');
  const candidates: Array<{ path: string; override: boolean }> = [
    { path: join(repoRoot, '.env'), override: false },
    { path: resolve(process.cwd(), '.env'), override: false },
    { path: resolve(process.cwd(), 'apps/backend/.env'), override: false },
    { path: backendEnvPath, override: true },
  ];

  const loaded = new Set<string>();
  for (const { path, override } of candidates) {
    const normalized = resolve(path);
    if (loaded.has(normalized) || !existsSync(normalized)) continue;
    loaded.add(normalized);
    dotenv.config({ path: normalized, override });
  }
}
