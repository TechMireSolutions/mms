import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    // Node 26 ships an experimental global `localStorage` getter that shadows
    // happy-dom's storage and resolves to `undefined` without --localstorage-file.
    // Disable it so happy-dom's window.localStorage is installed.
    execArgv: ['--no-experimental-webstorage'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: false,
      },
    },
    fileParallelism: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 15_000,
    hookTimeout: 30_000,
    css: false,
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        '**/*.d.ts',
      ],
    },
  },
});
