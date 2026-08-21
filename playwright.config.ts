import { defineConfig, devices } from "@playwright/test";

const config = defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  testMatch: "**/*.test.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    reuseExistingServer: !process.env.CI,
    url: "http://localhost:3000",
  },
  workers: process.env.CI ? 1 : undefined,
});

export default config;
