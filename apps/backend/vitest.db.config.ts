import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Opt-in real-Postgres integration suite (src/__tests__/db-integration).
 * Run explicitly when a database is available:
 *   pnpm test:db
 * These tests are excluded from the default `vitest run` so the mocked unit suite
 * stays green without a database and their global pool lifecycle cannot interfere
 * with other tests.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      JWT_SECRET: 'test-secret-at-least-32-chars-long!!',
      PORT: '0',
    },
    include: ['src/__tests__/db-integration/**/*.{test,spec}.ts'],
    pool: 'threads',
    maxWorkers: 1,
    execArgv: ['--no-experimental-webstorage'],
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
