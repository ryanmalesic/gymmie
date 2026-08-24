import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ??
  "test-only-better-auth-secret-32-characters";

const config = defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: {
      APPLE_APP_BUNDLE_ID: "com.example.gymmie",
      APPLE_CLIENT_ID: "com.example.gymmie.signin",
      APPLE_KEY_ID: "test-key-id",
      APPLE_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgRI7i8wopwPiR8gsm
jtECbNoqedYTiN0YJGtODmcZFiOhRANCAASvHTOki5W5V7CK1X5vosFgk2NJmobw
AIO2OtUAmgkqPx3APEugO0XJnJQhRRnovqZGRsOeqmsgkjmxIBMuvwv2
-----END PRIVATE KEY-----`,
      APPLE_TEAM_ID: "test-team-id",
      BETTER_AUTH_SECRET: betterAuthSecret,
      BETTER_AUTH_URL: "http://localhost:3000",
      CI: process.env.CI ?? "true",
      DATABASE_URL: databaseUrl,
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      GOOGLE_WEB_CLIENT_ID: "test-google-client-id",
    },
    environment: "node",
    exclude: ["node_modules", ".next", "e2e"],
    fileParallelism: false,
    include: ["**/*.integration.test.ts"],
    name: "integration",
    setupFiles: ["./vitest.integration.setup.ts"],
  },
});

export default config;
