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
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
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
    },
  },
});
