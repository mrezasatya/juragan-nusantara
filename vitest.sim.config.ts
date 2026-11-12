import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.sim.ts'],
    testTimeout: 600_000,
  },
});
