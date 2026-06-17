import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/** `apps/backend` root — works from `src/` (tsx) and `dist/` (node). */
export function resolveBackendRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

/**
 * Loads `apps/backend/.env` regardless of PM2 cwd (repo root vs package dir).
 */
export function loadBackendEnv(): void {
  const backendRoot = resolveBackendRoot();
  const candidates = [
    join(backendRoot, '.env'),
    resolve(process.cwd(), 'apps/backend/.env'),
    resolve(process.cwd(), '.env'),
  ];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const result = dotenv.config({ path });
    if (!result.error) return;
  }
}
