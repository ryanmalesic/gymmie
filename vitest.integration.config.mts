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
      BETTER_AUTH_SECRET: betterAuthSecret,
      BETTER_AUTH_URL: "http://localhost:3000",
      CI: process.env.CI ?? "true",
      DATABASE_URL: databaseUrl,
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
