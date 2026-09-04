import path from 'node:path';
import { defineConfig } from 'vitest/config';

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
    include: ['src/__tests__/**/*.{test,spec}.ts'],
    // Real-Postgres integration tests live in db-integration/ and are opt-in
    // (run explicitly with `vitest run src/__tests__/db-integration/...` when a
    // database is available). They are excluded from the default suite so the
    // mocked unit suite stays green without a database and their global pool
    // lifecycle cannot interfere with other tests.
    exclude: ['src/__tests__/db-integration/**'],
    pool: 'threads',
    // Turbo runs backend and frontend tests together; leave capacity for both suites.
    maxWorkers: 2,
    fileParallelism: true,
    clearMocks: true,
    restoreMocks: true,
    execArgv: ['--no-experimental-webstorage'],
    testTimeout: 15_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/db/migrations/**',
        'src/db/migrations_drizzle/**',
        'src/__tests__/**',
        '**/*.d.ts',
      ],
      // Coverage gate: lock in the current baseline so regressions fail CI.
      // Raise these as coverage improves.
      thresholds: {
        lines: 45,
        statements: 43.2,
        functions: 37.5,
        branches: 27,
      },
    },
  },
});
