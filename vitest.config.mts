import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const config = defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    exclude: ["node_modules", ".next", "e2e", "**/*.integration.test.ts"],
    include: ["**/*.test.{ts,tsx}"],
    name: "unit",
    setupFiles: ["./vitest.setup.ts"],
  },
});

export default config;
