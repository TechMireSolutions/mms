import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
  },
  projects: [
    {
      name: 'api',
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: 'ui',
      testMatch: /interactive\.spec\.ts/,
    },
  ],
});
