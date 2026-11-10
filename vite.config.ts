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
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.spec.{js,ts}'],
  },
  server: {
    proxy: {
      '/api-forge': {
        target: 'https://ds4-demo-5w8lmtds.on-forge.com',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api-forge/, ''),
      },
    },
  },
});
