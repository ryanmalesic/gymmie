import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      include: ['components/auth/*.tsx', 'lib/session.ts'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 60,
        perFile: true,
        statements: 60,
      },
    },
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
  },
});
