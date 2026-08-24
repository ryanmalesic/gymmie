import { defineConfig, devices } from "@playwright/test";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ??
  "test-only-better-auth-secret-32-characters";
process.env.BETTER_AUTH_SECRET ??= betterAuthSecret;

const baseUrl = "http://localhost:3000";

const config = defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  testMatch: "**/*.test.ts",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    env: {
      BETTER_AUTH_SECRET: betterAuthSecret,
      BETTER_AUTH_URL: baseUrl,
      DATABASE_URL: databaseUrl,
    },
    reuseExistingServer: !process.env.CI,
    url: baseUrl,
  },
  workers: process.env.CI ? 1 : undefined,
});

export default config;
