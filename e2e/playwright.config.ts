import { defineConfig, devices } from '@playwright/test';

// Ensure JWT_SECRET is set for the backend dev server in CI/test environments
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-jwt-secret-key-at-least-32-chars-long';

const isProduction = process.env.E2E_TARGET === 'production' || process.env.NODE_ENV === 'production';
const skipWebServer = isProduction || Boolean(process.env.NO_WEB_SERVER);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Ignore heavy mutation/seed flows on production targets. */
  testIgnore: isProduction
    ? [
        '**/platform-onboarding.spec.ts',
        '**/tenant-operations-flow.spec.ts',
        '**/tenant-academic-flow.spec.ts',
        '**/responsive-authenticated.spec.ts',
      ]
    : [],
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on local and CI due to shared database/state. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Ignore HTTP errors because of dev SSL or proxy certificates */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server only when not running against external/production server */
  webServer: skipWebServer
    ? undefined
    : {
        command: 'node e2e/scripts/start-web-server.mjs',
        cwd: '..',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
