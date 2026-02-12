import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/app/history-towers/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
