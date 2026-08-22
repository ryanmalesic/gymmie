import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";

const config = defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
          exclude: ["node_modules", ".next", "e2e", "**/*.integration.test.ts"],
          include: ["**/*.test.{ts,tsx}"],
          name: "unit",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          env: {
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
      },
    ],
  },
});

export default config;
