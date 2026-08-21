import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    exclude: ['node_modules/**'],
    include: ['server/**/*.integration.test.ts', 'app/actions/**/*.integration.test.ts'],
  },
});
