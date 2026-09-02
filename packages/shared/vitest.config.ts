import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
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
    testTimeout: 10_000,
    env: {
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/**/*.{test,spec}.ts',
        'dist/**',
        '**/*.d.ts',
      ],
    },
  },
});
