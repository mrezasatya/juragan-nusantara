/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Modul 3D (three.js) sengaja dipisah & dimuat lazy; ukurannya memang besar.
  build: { chunkSizeWarningLimit: 1100 },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
