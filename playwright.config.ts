import { defineConfig, devices } from '@playwright/test';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5556/gymmie_test';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  reporter: 'html',
  retries: process.env.CI ? 2 : 0,
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm build && pnpm start',
    env: {
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? 'playwright-test-secret-with-at-least-32-characters',
      DATABASE_URL,
      DIRECT_URL: DATABASE_URL,
    },
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
  },
  workers: process.env.CI ? 1 : undefined,
});
