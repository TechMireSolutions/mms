import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    // Node 26 ships an experimental global `localStorage` getter that shadows
    // happy-dom's storage and resolves to `undefined` without --localstorage-file.
    // Disable it so happy-dom's window.localStorage is installed.
    execArgv: ['--no-experimental-webstorage'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
  },
});
