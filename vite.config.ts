import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['@capacitor/barcode-scanner']
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Playwright e2e specs live in tests/e2e.
    include: ['tests/unit/**/*.spec.{js,ts}'],
  },
});
